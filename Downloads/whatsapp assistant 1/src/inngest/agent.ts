import { inngest } from "./client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const messageAgent = inngest.createFunction(
  { id: "message-agent", retries: 3 },
  { event: "message.upsert" },
  async ({ event, step }) => {
    const { contactId, instanceId, tenantId, phone, content } = event.data;

    const creditCheck = await step.run("check-credits", async () => {
      return await convex.query(api.subscriptionUsage.checkCredits, {
        tenantId: tenantId as any,
      });
    });

    if (!creditCheck.hasCredits) {
      return { status: "blocked", reason: "No credits remaining" };
    }

    const history = await step.run("get-history", async () => {
      return await convex.query(api.interactions.getMessages, {
        contactId: contactId as any,
      });
    });

    const aiResponse = await step.run("generate-response", async () => {
      const historyText = history
        .slice(-10)
        .map((m: any) => (m.type === "inbound" ? "User: " : "Assistant: ") + m.content)
        .join("\n");

      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        system: "You are an AI assistant for a real estate agent. Be helpful, professional, and concise.",
        prompt: "Previous conversation:\n" + historyText + "\n\nUser: " + content + "\n\nRespond appropriately:",
      });

      return text;
    });

    await step.run("send-message", async () => {
      const result = await whatsapp.sendText(instanceId, phone, aiResponse);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }
    });

    await step.run("log-outbound", async () => {
      await convex.mutation(api.interactions.addInteraction, {
        contactId: contactId as any,
        tenantId: tenantId as any,
        type: "outbound",
        content: aiResponse,
      });
    });

    await step.run("decrement-credits", async () => {
      await convex.mutation(api.subscriptionUsage.decrementCredits, {
        tenantId: tenantId as any,
      });
    });

    return { status: "completed", response: aiResponse };
  }
);
