"use server";

import { whatsapp } from "@/lib/whatsapp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function sendWhatsAppMessage(
    instanceId: string,
    contactId: string,
    tenantId: string,
    phone: string,
    message: string
) {
    try {
        // 1. Send via WhatsApp
        const result = await whatsapp.sendText(instanceId, phone, message);

        if (!result.success) {
            return { error: result.error || "Failed to send message" };
        }

        // 2. Log to database
        await convex.mutation(api.interactions.addInteraction, {
            contactId: contactId as any,
            tenantId: tenantId as any,
            type: "outbound",
            content: message,
        });

        // 3. Decrement credits
        await convex.mutation(api.subscriptionUsage.decrementCredits, {
            tenantId: tenantId as any,
        });

        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error("Failed to send message:", error);
        return { error: error instanceof Error ? error.message : "Failed to send" };
    }
}
