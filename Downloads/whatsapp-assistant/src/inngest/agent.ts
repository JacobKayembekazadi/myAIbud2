import { inngest } from "./client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper: Check if message contains any activation keywords
function containsKeyword(message: string, keywords: string[]): boolean {
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
}

// Helper: Check if current time is within business hours
function isWithinBusinessHours(
  startHour: number,
  endHour: number,
  activeDays: number[],
  timezone: string
): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
      weekday: "short",
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0");
    const weekdayName = parts.find(p => p.type === "weekday")?.value || "Mon";

    // Map weekday name to number (0=Sun, 1=Mon, etc.)
    const dayMap: Record<string, number> = {
      "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6
    };
    const dayOfWeek = dayMap[weekdayName] ?? 1;

    // Check if current day is active
    if (!activeDays.includes(dayOfWeek)) {
      return false;
    }

    // Check if current hour is within range
    if (startHour <= endHour) {
      return hour >= startHour && hour < endHour;
    } else {
      // Handle overnight ranges (e.g., 22:00 - 06:00)
      return hour >= startHour || hour < endHour;
    }
  } catch {
    // Default to true if timezone parsing fails
    return true;
  }
}

export const messageAgent = inngest.createFunction(
  { id: "message.agent", retries: 3 },
  { event: "message.upsert" },
  async ({ event, step }) => {
    const { contactId, instanceId, tenantId, phone, content } = event.data;

    // Step 1: Get tenant settings (autoReply, AI model, activation mode, etc.)
    const settings = await step.run("get-settings", async () => {
      return await convex.query(api.settings.getSettings, {
        tenantId: tenantId as any,
      });
    });

    // Check if auto-reply is enabled (master switch)
    if (settings && settings.autoReplyEnabled === false) {
      return { status: "disabled", reason: "Auto-reply is disabled for this tenant" };
    }

    // Step 2: Get contact info for activation mode checks
    const contact = await step.run("check-contact-status", async () => {
      return await convex.query(api.contacts.getContact, {
        contactId: contactId as any,
      });
    });

    // Check contact-level AI controls
    if (contact?.isPersonal === true) {
      return { status: "skipped", reason: "Contact marked as personal" };
    }
    if (contact?.aiEnabled === false) {
      return { status: "skipped", reason: "AI disabled for this contact" };
    }
    if (contact?.status === "paused") {
      return { status: "paused", reason: "Contact is paused for human intervention" };
    }

    // Step 3: Check activation mode
    const activationMode = settings?.agentActivationMode || "always_on";
    let shouldActivate = true;
    let skipReason = "";

    switch (activationMode) {
      case "always_on":
        // Always activate
        shouldActivate = true;
        break;

      case "keyword_triggered":
        // Check if message contains activation keywords
        const keywords = settings?.activationKeywords || [];
        shouldActivate = keywords.length === 0 || containsKeyword(content, keywords);
        if (!shouldActivate) {
          skipReason = "No activation keywords detected";
        }
        break;

      case "new_contacts_only":
        // Only activate for new contacts
        shouldActivate = contact?.status === "new";
        if (!shouldActivate) {
          skipReason = "Contact is not new";
        }
        break;

      case "business_hours":
        // Check if within business hours
        shouldActivate = isWithinBusinessHours(
          settings?.businessHoursStart ?? 8,
          settings?.businessHoursEnd ?? 18,
          settings?.businessDays ?? [1, 2, 3, 4, 5],
          settings?.businessTimezone ?? "Africa/Johannesburg"
        );
        if (!shouldActivate) {
          skipReason = "Outside business hours";
        }
        break;

      default:
        shouldActivate = true;
    }

    // If not activating, optionally send fallback message
    if (!shouldActivate) {
      if (settings?.sendFallbackWhenInactive && settings?.fallbackMessage) {
        await step.run("send-fallback", async () => {
          const result = await whatsapp.sendText(instanceId, phone, settings.fallbackMessage!);
          if (!result.success) {
            console.error("Failed to send fallback message:", result.error);
          }
        });

        // Log the fallback as an outbound interaction
        await step.run("log-fallback", async () => {
          await convex.mutation(api.interactions.addInteraction, {
            contactId: contactId as any,
            tenantId: tenantId as any,
            type: "outbound",
            content: `[Fallback] ${settings.fallbackMessage}`,
          });
        });
      }

      return { status: "skipped", reason: skipReason, activationMode };
    }

    // Step 4: Check credits
    const creditCheck = await step.run("check-credits", async () => {
      return await convex.query(api.subscriptionUsage.checkCredits, {
        tenantId: tenantId as any,
      });
    });

    if (!creditCheck.hasCredits) {
      return { status: "blocked", reason: "No credits remaining" };
    }

    // Step 5: Get conversation history
    const history = await step.run("get-history", async () => {
      return await convex.query(api.interactions.getMessages, {
        contactId: contactId as any,
      });
    });

    // Step 6: Get quick replies for context
    const quickReplies = await step.run("get-quick-replies", async () => {
      return await convex.query(api.settings.listQuickReplies, {
        tenantId: tenantId as any,
      });
    });

    // Step 7: Generate AI response using tenant's settings
    const aiResponse = await step.run("generate-response", async () => {
      const historyText = history
        .slice(-10)
        .map((m: any) => (m.type === "inbound" ? "User: " : "Assistant: ") + m.content)
        .join("\n");

      // Build quick replies context if available
      let quickRepliesContext = "";
      if (quickReplies && quickReplies.length > 0) {
        const activeReplies = quickReplies.filter((qr: any) => qr.isActive);
        if (activeReplies.length > 0) {
          quickRepliesContext = "\n\nAvailable quick responses you can reference:\n" +
            activeReplies.map((qr: any) => `- ${qr.label}: ${qr.content}`).join("\n");
        }
      }

      // Use tenant's AI model setting, fallback to gemini-1.5-flash
      const modelName = settings?.aiModel || "gemini-1.5-flash";

      const systemPrompt = `You are an AI assistant for a real estate agent in South Africa. Your role is to:
- Qualify leads by understanding their property needs (buying, selling, renting)
- Collect relevant information (budget, preferred areas, property type)
- Schedule viewing appointments or callbacks
- Answer common questions about the buying/selling process
- Be helpful, professional, and conversational in tone
- Keep responses concise (1-3 sentences when possible)
- If you don't know something specific, offer to have the agent follow up

${quickRepliesContext}`;

      const { text } = await generateText({
        model: google(modelName),
        system: systemPrompt,
        prompt: `Previous conversation:\n${historyText}\n\nUser: ${content}\n\nRespond appropriately:`,
        temperature: settings?.aiTemperature ?? 0.7,
      });

      return text;
    });

    // Step 8: Send message via WhatsApp
    await step.run("send-message", async () => {
      const result = await whatsapp.sendText(instanceId, phone, aiResponse);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }
    });

    // Step 9: Log outbound interaction
    await step.run("log-outbound", async () => {
      await convex.mutation(api.interactions.addInteraction, {
        contactId: contactId as any,
        tenantId: tenantId as any,
        type: "outbound",
        content: aiResponse,
      });
    });

    // Step 10: Decrement credits
    await step.run("decrement-credits", async () => {
      await convex.mutation(api.subscriptionUsage.decrementCredits, {
        tenantId: tenantId as any,
      });
    });

    // Step 11: Update contact status to active if new
    if (contact?.status === "new") {
      await step.run("activate-contact", async () => {
        await convex.mutation(api.contacts.updateContact, {
          contactId: contactId as any,
          status: "active",
        });
      });
    }

    return { status: "completed", response: aiResponse, activationMode };
  }
);
