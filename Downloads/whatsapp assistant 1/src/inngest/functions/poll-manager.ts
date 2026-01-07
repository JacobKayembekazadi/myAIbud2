import { inngest } from "../client";

export const pollManager = inngest.createFunction(
  { id: "poll-manager" },
  { event: "poll.response" },
  async ({ event }) => {
    // TODO: Implement poll response handling
    return { status: "processed", type: "poll", id: event.data.id };
  }
);
