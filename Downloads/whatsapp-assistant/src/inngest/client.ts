import { Inngest } from "inngest";

// Configure Inngest with event key for sending events
export const inngest = new Inngest({
  id: "mychatflow",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
