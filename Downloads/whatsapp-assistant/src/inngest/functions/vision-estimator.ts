import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Vision Estimator - Analyzes images sent via WhatsApp
 * Use cases:
 * - Property photos: Describe features, condition, style
 * - Documents: Extract key information from photos of documents
 * - Floor plans: Identify room counts and layout
 */
export const visionEstimator = inngest.createFunction(
  {
    id: "vision.estimator",
    retries: 2,
    // Rate limit to control costs (10 images per minute per tenant)
    rateLimit: { key: "event.data.tenantId", limit: 10, period: "1m" },
  },
  { event: "image.analyze" },
  async ({ event, step }) => {
    const { contactId, instanceId, tenantId, phone, imageUrl, imageType } = event.data;

    // Step 1: Check credits (vision costs more)
    const creditCheck = await step.run("check-credits", async () => {
      return await convex.query(api.subscriptionUsage.checkCredits, {
        tenantId: tenantId as string,
      });
    });

    if (!creditCheck.hasCredits) {
      return { status: "blocked", reason: "No credits remaining" };
    }

    // Step 2: Fetch and analyze the image
    const analysis = await step.run("analyze-image", async () => {
      // Determine analysis prompt based on context
      let analysisPrompt = "Describe this image in detail.";

      if (imageType === "property") {
        analysisPrompt = `Analyze this property image as a real estate professional. Describe:
- Property type (house, apartment, land, commercial)
- Key features visible (bedrooms, bathrooms if visible, parking, garden)
- Condition assessment (new, good, needs renovation)
- Style/architecture
- Any notable features or concerns
Keep the response concise (2-4 sentences).`;
      } else if (imageType === "document") {
        analysisPrompt = `Extract and summarize the key information from this document image.
Focus on names, dates, amounts, and important details.
Keep the response concise and structured.`;
      } else if (imageType === "floorplan") {
        analysisPrompt = `Analyze this floor plan and describe:
- Number of bedrooms and bathrooms
- Living areas
- Kitchen location
- Overall layout flow
- Approximate size if scale is visible
Keep the response concise (2-3 sentences).`;
      }

      try {
        // Fetch image as base64 if it's a URL
        let imageData: { type: "base64"; data: string; mimeType: string } | { type: "url"; url: string };

        if (imageUrl.startsWith("http")) {
          // Use URL directly
          imageData = { type: "url", url: imageUrl };
        } else {
          // Assume it's already base64
          imageData = {
            type: "base64",
            data: imageUrl.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: "image/jpeg",
          };
        }

        const { text } = await generateText({
          model: google("gemini-1.5-flash"),
          messages: [
            {
              role: "user",
              content: [
                imageData.type === "url"
                  ? { type: "image" as const, image: new URL(imageData.url) }
                  : { type: "image" as const, image: imageData.data, mimeType: imageData.mimeType },
                { type: "text" as const, text: analysisPrompt },
              ],
            },
          ],
        });

        return { success: true, text };
      } catch (error) {
        console.error("Vision analysis error:", error);
        return {
          success: false,
          text: "I couldn't analyze this image. Please try sending it again or describe what you'd like me to know about it.",
        };
      }
    });

    // Step 3: Send response via WhatsApp
    await step.run("send-response", async () => {
      const responseText = analysis.success
        ? analysis.text
        : "I had trouble analyzing that image. Could you describe it for me, or try sending another photo?";

      const result = await whatsapp.sendText(instanceId, phone, responseText);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }
    });

    // Step 4: Log the interaction
    await step.run("log-interaction", async () => {
      await convex.mutation(api.interactions.addInteraction, {
        contactId: contactId as string,
        tenantId: tenantId as string,
        type: "outbound",
        content: `[Image Analysis] ${analysis.text.substring(0, 500)}${analysis.text.length > 500 ? "..." : ""}`,
      });
    });

    // Step 5: Decrement credits (vision costs 2 credits)
    await step.run("decrement-credits", async () => {
      await convex.mutation(api.subscriptionUsage.decrementCredits, {
        tenantId: tenantId as string,
      });
      // Decrement again for vision (costs 2x)
      await convex.mutation(api.subscriptionUsage.decrementCredits, {
        tenantId: tenantId as string,
      });
    });

    return {
      status: "completed",
      type: "vision",
      analysis: analysis.text,
      success: analysis.success,
    };
  }
);
