import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { messageAgent } from "@/inngest/agent";
import { campaignSender } from "@/inngest/functions/campaign-sender";
import { sendInviteEmail } from "@/inngest/functions/send-invite-email";

// Serve the Inngest API endpoint
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [messageAgent, campaignSender, sendInviteEmail],
});
