import { Inngest } from "inngest";

// Configure Inngest with event key for sending events and signing key for serve endpoint
// IMPORTANT: The ID must match the app name in your Inngest Cloud dashboard
export const inngest = new Inngest({
  id: "my-aibud",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
