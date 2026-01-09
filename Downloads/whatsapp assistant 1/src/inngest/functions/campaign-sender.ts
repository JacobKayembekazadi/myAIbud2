import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const campaignSender = inngest.createFunction(
    {
        id: "campaign-sender",
        retries: 2,
        // Rate limiting to avoid WhatsApp bans (30 messages per minute max)
        rateLimit: { key: "campaign-sender", limit: 30, period: "1m" }
    },
    { event: "campaign.send" },
    async ({ event, step }) => {
        const { campaignId, tenantId } = event.data;

        // 1. Get campaign details
        const campaign = await step.run("get-campaign", async () => {
            return await convex.query(api.campaigns.getCampaign, {
                campaignId: campaignId as any,
            });
        });

        if (!campaign) {
            return { status: "error", reason: "Campaign not found" };
        }

        // 2. Update status to "sending"
        await step.run("update-status-sending", async () => {
            await convex.mutation(api.campaigns.updateCampaignStatus, {
                campaignId: campaignId as any,
                status: "sending",
            });
        });

        // 3. Get all contacts for this campaign
        const contacts = await step.run("get-contacts", async () => {
            const results = [];
            for (const contactId of campaign.contactIds) {
                const contact = await convex.query(api.contacts.getContact, {
                    contactId: contactId,
                });
                if (contact) results.push(contact);
            }
            return results;
        });

        // 4. Send messages to each contact (with delays to avoid bans)
        let sentCount = 0;
        for (const contact of contacts) {
            await step.run(`send-to-${contact._id}`, async () => {
                // Personalize message with {Name} placeholder
                const personalizedMessage = campaign.message
                    .replace(/{Name}/gi, contact.name || "there");

                const result = await whatsapp.sendText(
                    campaign.instanceId,
                    contact.phone,
                    personalizedMessage
                );

                if (result.success) {
                    // Log interaction
                    await convex.mutation(api.interactions.addInteraction, {
                        contactId: contact._id,
                        tenantId: tenantId as any,
                        type: "outbound",
                        content: personalizedMessage,
                    });

                    // Increment sent count
                    await convex.mutation(api.campaigns.incrementSentCount, {
                        campaignId: campaignId as any,
                    });

                    sentCount++;
                }

                // Random delay between messages (2-5 seconds) to avoid spam detection
                await new Promise(resolve =>
                    setTimeout(resolve, 2000 + Math.random() * 3000)
                );
            });
        }

        // 5. Mark campaign as completed
        await step.run("mark-completed", async () => {
            await convex.mutation(api.campaigns.updateCampaignStatus, {
                campaignId: campaignId as any,
                status: "completed",
            });
        });

        return { status: "completed", sentCount, total: contacts.length };
    }
);
