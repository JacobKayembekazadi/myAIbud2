import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { messageAgent } from "@/inngest/agent";

// Serve the Inngest API endpoint
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [messageAgent],
});
