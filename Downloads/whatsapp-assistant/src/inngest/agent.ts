import { inngest } from "./client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const messageAgent = inngest.createFunction(
  { id: "message.agent", retries: 3 },
  { event: "message.upsert" },
  async ({ event, step }) => {
    const { contactId, instanceId, tenantId, phone, content } = event.data;

    // Step 1: Get tenant settings (autoReply, AI model, etc.)
    const settings = await step.run("get-settings", async () => {
      return await convex.query(api.settings.getSettings, {
        tenantId: tenantId as any,
      });
    });

    // Check if auto-reply is enabled
    if (settings && settings.autoReplyEnabled === false) {
      return { status: "disabled", reason: "Auto-reply is disabled for this tenant" };
    }

    // Step 2: Check credits
    const creditCheck = await step.run("check-credits", async () => {
      return await convex.query(api.subscriptionUsage.checkCredits, {
        tenantId: tenantId as any,
      });
    });

    if (!creditCheck.hasCredits) {
      return { status: "blocked", reason: "No credits remaining" };
    }

    // Step 3: Human-in-the-Loop - Check if contact is paused
    const contact = await step.run("check-contact-status", async () => {
      return await convex.query(api.contacts.getContact, {
        contactId: contactId as any,
      });
    });

    if (contact?.status === "paused") {
      return { status: "paused", reason: "Contact is paused for human intervention" };
    }

    // Step 4: Get conversation history
    const history = await step.run("get-history", async () => {
      return await convex.query(api.interactions.getMessages, {
        contactId: contactId as any,
      });
    });

    // Step 5: Get quick replies for context
    const quickReplies = await step.run("get-quick-replies", async () => {
      return await convex.query(api.settings.listQuickReplies, {
        tenantId: tenantId as any,
      });
    });

    // Step 6: Generate AI response using tenant's settings
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

    // Step 7: Send message via WhatsApp
    await step.run("send-message", async () => {
      const result = await whatsapp.sendText(instanceId, phone, aiResponse);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }
    });

    // Step 8: Log outbound interaction
    await step.run("log-outbound", async () => {
      await convex.mutation(api.interactions.addInteraction, {
        contactId: contactId as any,
        tenantId: tenantId as any,
        type: "outbound",
        content: aiResponse,
      });
    });

    // Step 9: Decrement credits
    await step.run("decrement-credits", async () => {
      await convex.mutation(api.subscriptionUsage.decrementCredits, {
        tenantId: tenantId as any,
      });
    });

    // Step 10: Update contact status to active if new
    if (contact?.status === "new") {
      await step.run("activate-contact", async () => {
        await convex.mutation(api.contacts.updateContact, {
          contactId: contactId as any,
          status: "active",
        });
      });
    }

    return { status: "completed", response: aiResponse };
  }
);
