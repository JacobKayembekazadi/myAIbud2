import { inngest } from "../client";

export const visionEstimator = inngest.createFunction(
  { id: "vision.estimator" },
  { event: "image.analyze" },
  async ({ event }) => {
    // TODO: Implement vision analysis
    return { status: "processed", type: "vision", id: event.data.id };
  }
);
