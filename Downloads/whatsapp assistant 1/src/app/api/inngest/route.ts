import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { messageAgent } from "@/inngest/agent";
import { campaignSender } from "@/inngest/functions/campaign-sender";

// Serve the Inngest API endpoint
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [messageAgent, campaignSender],
});
