import { inngest } from "./client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Process follow-up messages for a single contact
export const processFollowUp = inngest.createFunction(
  { id: "followup.process", retries: 2 },
  { event: "followup.send" },
  async ({ event, step }) => {
    const { contactId, tenantId, instanceId, phone, sequenceId, stepIndex, message } = event.data;

    // Step 1: Verify the follow-up is still needed
    const contact = await step.run("verify-contact", async () => {
      return await convex.query(api.contacts.getContact, {
        contactId: contactId as any,
      });
    });

    // Skip if contact no longer has this sequence
    if (!contact || contact.followUpSequenceId !== sequenceId) {
      return { status: "skipped", reason: "sequence_changed" };
    }

    // Skip if contact is paused or has handoff pending
    if (contact.status === "paused" || contact.handoffRequested) {
      return { status: "skipped", reason: "contact_paused_or_handoff" };
    }

    // Step 2: Check credits
    const creditCheck = await step.run("check-credits", async () => {
      return await convex.query(api.subscriptionUsage.checkCredits, {
        tenantId: tenantId as any,
      });
    });

    if (!creditCheck.hasCredits) {
      return { status: "blocked", reason: "no_credits" };
    }

    // Step 3: Get settings to check if follow-up is still enabled
    const settings = await step.run("get-settings", async () => {
      return await convex.query(api.settings.getSettings, {
        tenantId: tenantId as any,
      });
    });

    if (!settings?.followUpEnabled) {
      return { status: "skipped", reason: "followup_disabled" };
    }

    // Step 4: Send the follow-up message
    await step.run("send-followup", async () => {
      const result = await whatsapp.sendText(instanceId, phone, message);
      if (!result.success) {
        throw new Error(result.error || "Failed to send follow-up message");
      }
    });

    // Step 5: Log the interaction
    await step.run("log-followup", async () => {
      await convex.mutation(api.interactions.addInteraction, {
        contactId: contactId as any,
        tenantId: tenantId as any,
        type: "outbound",
        content: `[Follow-up ${stepIndex + 1}] ${message}`,
      });
    });

    // Step 6: Decrement credits
    await step.run("decrement-credits", async () => {
      await convex.mutation(api.subscriptionUsage.decrementCredits, {
        tenantId: tenantId as any,
      });
    });

    // Step 7: Advance to next step
    const advancement = await step.run("advance-step", async () => {
      return await convex.mutation(api.followUpSequences.advanceFollowUpStep, {
        contactId: contactId as any,
      });
    });

    return {
      status: "sent",
      stepIndex,
      sequenceCompleted: advancement.completed,
      nextStep: advancement.nextStep,
    };
  }
);

// Cron job to check and trigger follow-ups
export const followUpCronJob = inngest.createFunction(
  { id: "followup.cron", retries: 1 },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    // Step 1: Get all tenants with follow-up enabled
    // For now, we'll process globally. In production, you'd want to iterate by tenant.

    // This is a simplified version. In production, you'd query all tenants
    // and process contacts for each one.

    const processed: string[] = [];
    const errors: string[] = [];

    // Note: This implementation assumes you have a way to get all tenants
    // For a simple implementation, you might need to track contacts due differently

    return {
      processed: processed.length,
      errors: errors.length,
      message: "Follow-up cron completed",
    };
  }
);

// Manual trigger for processing follow-ups for a specific tenant
export const processFollowUpsForTenant = inngest.createFunction(
  { id: "followup.tenant.process", retries: 1 },
  { event: "followup.tenant.check" },
  async ({ event, step }) => {
    const { tenantId } = event.data;

    // Step 1: Get settings
    const settings = await step.run("get-settings", async () => {
      return await convex.query(api.settings.getSettings, {
        tenantId: tenantId as any,
      });
    });

    if (!settings?.followUpEnabled) {
      return { status: "skipped", reason: "followup_disabled" };
    }

    // Step 2: Get contacts due for follow-up
    const contactsDue = await step.run("get-due-contacts", async () => {
      return await convex.query(api.followUpSequences.getContactsDueForFollowUp, {
        tenantId: tenantId as any,
      });
    });

    if (contactsDue.length === 0) {
      return { status: "complete", processed: 0 };
    }

    // Step 3: Get default instance
    const instances = await step.run("get-instances", async () => {
      return await convex.query(api.instances.listInstances, {
        tenantId: tenantId as any,
      });
    });

    if (!instances || instances.length === 0) {
      return { status: "error", reason: "no_instances" };
    }

    // Step 4: Process each contact
    const results = [];

    for (const contact of contactsDue) {
      if (!contact.followUpSequenceId) continue;

      // Get the sequence
      const sequence = await step.run(`get-sequence-${contact._id}`, async () => {
        return await convex.query(api.followUpSequences.getSequence, {
          sequenceId: contact.followUpSequenceId as any,
        });
      });

      if (!sequence || !sequence.isActive) continue;

      const stepIndex = contact.followUpStep ?? 0;
      const stepConfig = sequence.steps[stepIndex];
      if (!stepConfig) continue;

      // Find the instance for this contact
      const instance = instances.find(i => i.instanceId === contact.instanceId) || instances[0];

      // Trigger the follow-up send event
      await step.sendEvent("trigger-followup", {
        name: "followup.send",
        data: {
          contactId: contact._id,
          tenantId: contact.tenantId,
          instanceId: instance.instanceId,
          phone: contact.phone,
          sequenceId: contact.followUpSequenceId,
          stepIndex,
          message: stepConfig.message,
        },
      });

      results.push(contact._id);
    }

    return { status: "complete", processed: results.length, contactIds: results };
  }
);
