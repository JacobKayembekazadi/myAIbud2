"use server";

import { inngest } from "@/inngest/client";

export async function startCampaign(campaignId: string, tenantId: string) {
    try {
        await inngest.send({
            name: "campaign.send",
            data: { campaignId, tenantId },
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to start campaign:", error);
        return { error: "Failed to start campaign" };
    }
}
