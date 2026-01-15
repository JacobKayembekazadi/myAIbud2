import { inngest } from "./client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Industry-specific prompt templates
const INDUSTRY_PROMPTS: Record<string, string> = {
  real_estate: `Your role is to:
- Qualify leads by understanding their property needs (buying, selling, renting)
- Collect relevant information (budget, preferred areas, property type, timeline)
- Schedule viewing appointments or callbacks
- Answer common questions about the buying/selling process
- Provide information about available properties when asked`,

  automotive: `Your role is to:
- Help customers find the right vehicle for their needs
- Collect information about preferences (budget, vehicle type, features)
- Schedule test drives and showroom visits
- Answer questions about financing options and trade-ins
- Provide details about available inventory`,

  retail: `Your role is to:
- Help customers find products they're looking for
- Answer questions about product availability and pricing
- Assist with order status inquiries
- Handle basic returns and exchange questions
- Provide information about promotions and deals`,

  hospitality: `Your role is to:
- Help guests with booking inquiries and reservations
- Answer questions about amenities and services
- Provide information about pricing and availability
- Handle special requests and preferences
- Share local recommendations and travel tips`,

  healthcare: `Your role is to:
- Help patients schedule appointments
- Answer general questions about services offered
- Provide clinic hours and location information
- Handle prescription refill requests (directing to appropriate channels)
- Note: Always advise patients to consult medical professionals for health advice`,

  professional_services: `Your role is to:
- Qualify potential clients and understand their needs
- Schedule consultations and meetings
- Answer questions about services and pricing
- Provide information about the team's expertise
- Handle general inquiries professionally`,

  general: `Your role is to:
- Answer questions about the business and its services
- Help customers with their inquiries
- Schedule appointments or callbacks when needed
- Provide helpful information and assistance
- Direct complex queries to the appropriate person`,
};

// Personality tone instructions
const PERSONALITY_TONES: Record<string, string> = {
  professional: "Be professional, formal, and business-like. Use proper grammar and maintain a courteous demeanor.",
  friendly: "Be warm, friendly, and approachable. Use a conversational tone while remaining helpful.",
  casual: "Be relaxed and casual in your responses. Feel free to use informal language while staying helpful.",
  enthusiastic: "Be energetic and enthusiastic! Show excitement about helping and use positive language.",
};

// Helper: Build dynamic system prompt from business profile
function buildSystemPrompt(settings: any, quickRepliesContext: string): string {
  // If custom prompt is provided, use it directly
  if (settings.customSystemPrompt && settings.customSystemPrompt.trim()) {
    return settings.customSystemPrompt + quickRepliesContext;
  }

  // Build dynamic prompt from business profile
  const businessName = settings.businessName || "the business";
  const industry = settings.industry || "general";
  const industryPrompt = INDUSTRY_PROMPTS[industry] || INDUSTRY_PROMPTS.general;
  const personality = settings.aiPersonality || "professional";
  const toneInstruction = PERSONALITY_TONES[personality] || PERSONALITY_TONES.professional;

  let prompt = `You are an AI assistant for ${businessName}.`;

  // Add business description if available
  if (settings.businessDescription) {
    prompt += ` ${settings.businessDescription}`;
  }

  // Add location if available
  if (settings.businessLocation) {
    prompt += ` Located in ${settings.businessLocation}.`;
  }

  prompt += `\n\n${industryPrompt}`;

  // Add services if available
  if (settings.servicesOffered && settings.servicesOffered.length > 0) {
    prompt += `\n\nServices we offer: ${settings.servicesOffered.join(", ")}.`;
  }

  prompt += `\n\nCommunication style: ${toneInstruction}`;

  prompt += `\n\nGeneral guidelines:
- Keep responses concise (1-3 sentences when possible)
- If you don't know something specific, offer to have someone follow up
- Be helpful and aim to resolve inquiries or move them forward
- If a customer explicitly asks to speak to a human or seems frustrated, acknowledge their request politely`;

  // Add quick replies context
  prompt += quickRepliesContext;

  return prompt;
}

// Helper: Build system prompt with language instruction
function buildSystemPromptWithLanguage(settings: any, quickRepliesContext: string, language: string): string {
  let basePrompt = buildSystemPrompt(settings, quickRepliesContext);

  // Add language instruction if not English
  if (language && language !== "en") {
    const languageNames: Record<string, string> = {
      es: "Spanish",
      fr: "French",
      de: "German",
      pt: "Portuguese",
      it: "Italian",
      nl: "Dutch",
      zu: "Zulu",
      af: "Afrikaans",
    };

    const langName = languageNames[language] || language;
    basePrompt += `\n\nIMPORTANT: The customer is writing in ${langName}. Please respond in ${langName} to match their language preference.`;
  }

  return basePrompt;
}

// Helper: Check if message contains any activation keywords
function containsKeyword(message: string, keywords: string[]): boolean {
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
}

// Helper: Check if message contains handoff trigger keywords
function shouldTriggerHandoff(message: string, handoffKeywords: string[]): { trigger: boolean; reason: string } {
  const lowerMessage = message.toLowerCase();

  for (const keyword of handoffKeywords) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return { trigger: true, reason: `Customer requested: "${keyword}"` };
    }
  }

  return { trigger: false, reason: "" };
}

// Helper: Check if AI response indicates uncertainty
function isAIUncertain(aiResponse: string): { uncertain: boolean; reason: string } {
  const uncertaintyPhrases = [
    "i'm not sure",
    "i don't have that information",
    "i cannot help with",
    "i'm unable to",
    "you should contact",
    "please contact our team",
    "i don't know",
    "i'm not certain",
    "beyond my capabilities",
    "outside my scope",
    "need to speak with",
    "better to talk to",
  ];

  const lowerResponse = aiResponse.toLowerCase();

  for (const phrase of uncertaintyPhrases) {
    if (lowerResponse.includes(phrase)) {
      return { uncertain: true, reason: `AI expressed uncertainty: "${phrase}"` };
    }
  }

  return { uncertain: false, reason: "" };
}

// Helper: Detect language from text (simple detection)
function detectLanguage(text: string): string {
  // Common words in different languages for basic detection
  const languagePatterns: Record<string, RegExp[]> = {
    es: [/\b(hola|gracias|buenos|buenas|que|como|por favor|ayuda)\b/i],
    fr: [/\b(bonjour|merci|s'il vous plait|comment|aide|oui|non)\b/i],
    de: [/\b(hallo|danke|bitte|wie|hilfe|guten|ja|nein)\b/i],
    pt: [/\b(olá|obrigado|por favor|como|ajuda|bom dia|sim|não)\b/i],
    it: [/\b(ciao|grazie|per favore|come|aiuto|buongiorno|si|no)\b/i],
    nl: [/\b(hallo|dank|alstublieft|hoe|hulp|goedendag|ja|nee)\b/i],
    zu: [/\b(sawubona|ngiyabonga|yebo|cha|usizo|kanjani)\b/i], // Zulu
    af: [/\b(hallo|dankie|asseblief|hoe|hulp|goeie|ja|nee)\b/i], // Afrikaans
  };

  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    if (patterns.some(pattern => pattern.test(text))) {
      return lang;
    }
  }

  return "en"; // Default to English
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
    // Using type assertion since the query returns a merged object with defaults
    const settings = await step.run("get-settings", async () => {
      return await convex.query(api.settings.getSettings, {
        tenantId: tenantId as any,
      });
    }) as Record<string, any> | null;

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

    // Step 3.5: Check for handoff keywords in customer message
    const handoffEnabled = settings?.handoffEnabled ?? true;
    const handoffKeywords = settings?.handoffKeywords || [];

    if (handoffEnabled && handoffKeywords.length > 0) {
      const handoffCheck = shouldTriggerHandoff(content, handoffKeywords);

      if (handoffCheck.trigger) {
        // Trigger immediate handoff
        await step.run("trigger-handoff", async () => {
          // Request handoff (pause AI and create notification)
          await convex.mutation(api.notifications.requestHandoff, {
            contactId: contactId as any,
            reason: handoffCheck.reason,
            createNotification: true,
          });
        });

        // Send handoff message to customer
        const handoffMessage = settings?.handoffMessage ||
          "I'm connecting you with a team member who can better assist you. They'll be with you shortly!";

        await step.run("send-handoff-message", async () => {
          const result = await whatsapp.sendText(instanceId, phone, handoffMessage);
          if (!result.success) {
            console.error("Failed to send handoff message:", result.error);
          }
        });

        // Log the handoff interaction
        await step.run("log-handoff", async () => {
          await convex.mutation(api.interactions.addInteraction, {
            contactId: contactId as any,
            tenantId: tenantId as any,
            type: "outbound",
            content: `[Handoff] ${handoffMessage}`,
          });
        });

        return { status: "handoff", reason: handoffCheck.reason };
      }
    }

    // Step 3.6: Detect language for multi-language support
    const multiLanguageEnabled = settings?.multiLanguageEnabled ?? true;
    let detectedLang = contact?.detectedLanguage || "en";

    if (multiLanguageEnabled) {
      const newDetectedLang = detectLanguage(content);
      if (newDetectedLang !== detectedLang) {
        detectedLang = newDetectedLang;
        // Update contact's detected language
        await step.run("update-language", async () => {
          await convex.mutation(api.contacts.updateContact, {
            contactId: contactId as any,
            detectedLanguage: detectedLang,
          });
        });
      }
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

    // Step 5: Check if this is a first-time contact and send welcome message
    const isFirstContact = contact?.status === "new";
    const welcomeEnabled = settings?.welcomeMessageEnabled ?? true;

    if (isFirstContact && welcomeEnabled) {
      await step.run("send-welcome-message", async () => {
        // Build welcome message
        let welcomeText = settings?.welcomeMessage;

        // If no custom welcome message, generate one from business profile
        if (!welcomeText) {
          const businessName = settings?.businessName || "us";
          const services = settings?.servicesOffered || [];

          welcomeText = `Hi! Welcome to ${businessName}. 👋`;

          if (services.length > 0) {
            welcomeText += `\n\nWe can help you with: ${services.slice(0, 3).join(", ")}${services.length > 3 ? ", and more" : ""}.`;
          }

          welcomeText += `\n\nHow can I assist you today?`;
        }

        // Add suggested questions if available
        const suggestedQuestions = settings?.suggestedQuestions || [];
        if (suggestedQuestions.length > 0) {
          welcomeText += `\n\n💡 *Quick questions you can ask:*`;
          suggestedQuestions.slice(0, 3).forEach((q: string) => {
            welcomeText += `\n• ${q}`;
          });
        }

        // Small delay to feel more natural
        const delay = settings?.welcomeMessageDelay ?? 1000;
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await whatsapp.sendText(instanceId, phone, welcomeText!);
        if (!result.success) {
          console.error("Failed to send welcome message:", result.error);
        }

        // Log the welcome message
        await convex.mutation(api.interactions.addInteraction, {
          contactId: contactId as any,
          tenantId: tenantId as any,
          type: "outbound",
          content: `[Welcome] ${welcomeText}`,
        });
      });
    }

    // Step 6: Get conversation history
    const history = await step.run("get-history", async () => {
      return await convex.query(api.interactions.getMessages, {
        contactId: contactId as any,
      });
    });

    // Step 7: Get quick replies for context
    const quickReplies = await step.run("get-quick-replies", async () => {
      return await convex.query(api.settings.listQuickReplies, {
        tenantId: tenantId as any,
      });
    });

    // Step 8: Generate AI response using tenant's settings
    const aiResponse = await step.run("generate-response", async () => {
      const historyText = history
        .slice(-10)
        .map((m: any) => (m.type === "inbound" ? "User: " : "Assistant: ") + m.content)
        .join("\n");

      // Build quick replies context if enabled
      let quickRepliesContext = "";
      const useQuickRepliesAsKnowledge = settings?.useQuickRepliesAsKnowledge ?? true;
      if (useQuickRepliesAsKnowledge && quickReplies && quickReplies.length > 0) {
        const activeReplies = quickReplies.filter((qr: any) => qr.isActive);
        if (activeReplies.length > 0) {
          quickRepliesContext = "\n\nKnowledge base (use this information when relevant):\n" +
            activeReplies.map((qr: any) => `- ${qr.label}: ${qr.content}`).join("\n");
        }
      }

      // Use tenant's AI model setting, fallback to gemini-1.5-flash
      const modelName = settings?.aiModel || "gemini-1.5-flash";

      // Build dynamic system prompt with language support
      const systemPrompt = multiLanguageEnabled
        ? buildSystemPromptWithLanguage(settings, quickRepliesContext, detectedLang)
        : buildSystemPrompt(settings, quickRepliesContext);

      const { text } = await generateText({
        model: google(modelName),
        system: systemPrompt,
        prompt: `Previous conversation:\n${historyText}\n\nUser: ${content}\n\nRespond appropriately:`,
        temperature: settings?.aiTemperature ?? 0.7,
      });

      return text;
    });

    // Step 8.5: Check if AI response indicates uncertainty (post-response handoff)
    if (handoffEnabled) {
      const uncertaintyCheck = isAIUncertain(aiResponse);

      if (uncertaintyCheck.uncertain) {
        // AI is uncertain - trigger soft handoff (still send AI response but flag for human review)
        await step.run("flag-for-review", async () => {
          await convex.mutation(api.notifications.requestHandoff, {
            contactId: contactId as any,
            reason: uncertaintyCheck.reason,
            createNotification: true,
          });
        });

        // Note: We still send the AI response but the contact is now flagged for review
        // The human can see the AI's response and decide to take over
      }
    }

    // Step 9: Send message via WhatsApp
    await step.run("send-message", async () => {
      const result = await whatsapp.sendText(instanceId, phone, aiResponse);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }
    });

    // Step 10: Log outbound interaction
    await step.run("log-outbound", async () => {
      await convex.mutation(api.interactions.addInteraction, {
        contactId: contactId as any,
        tenantId: tenantId as any,
        type: "outbound",
        content: aiResponse,
      });
    });

    // Step 11: Decrement credits
    await step.run("decrement-credits", async () => {
      await convex.mutation(api.subscriptionUsage.decrementCredits, {
        tenantId: tenantId as any,
      });
    });

    // Step 12: Update contact status to active if new
    if (contact?.status === "new") {
      await step.run("activate-contact", async () => {
        await convex.mutation(api.contacts.updateContact, {
          contactId: contactId as any,
          status: "active",
        });
      });
    }

    // Step 13: Stop follow-up sequence if customer replied
    if (contact?.followUpSequenceId) {
      await step.run("stop-followup-sequence", async () => {
        await convex.mutation(api.followUpSequences.stopSequenceOnReply, {
          contactId: contactId as any,
        });
      });
    }

    // Step 14: Update lead score
    if (settings?.leadScoringEnabled !== false) {
      await step.run("update-lead-score", async () => {
        await convex.mutation(api.leadScoring.autoUpdateLeadScore, {
          contactId: contactId as any,
        });
      });
    }

    return { status: "completed", response: aiResponse, activationMode };
  }
);
