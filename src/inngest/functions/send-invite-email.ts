import { inngest } from "../client";
import { sendTeamInviteEmail, isEmailConfigured } from "@/lib/email";

/**
 * Inngest function to send team invitation emails
 * Runs in the background with automatic retries
 */
export const sendInviteEmail = inngest.createFunction(
  {
    id: "send-invite-email",
    name: "Send Team Invitation Email",
    retries: 3, // Retry up to 3 times on failure
  },
  { event: "team.member.invited" },
  async ({ event, step }) => {
    const {
      invitedEmail,
      invitedByName,
      invitedByEmail,
      organizationName,
      role,
      inviteUrl,
    } = event.data;

    // Step 1: Validate email configuration
    await step.run("validate-email-config", async () => {
      if (!isEmailConfigured()) {
        console.warn("[Email] Resend not configured, skipping email send");
        throw new Error(
          "Email service not configured. Please set RESEND_API_KEY and EMAIL_FROM_ADDRESS environment variables."
        );
      }
      return { configured: true };
    });

    // Step 2: Send the email
    const result = await step.run("send-email", async () => {
      return await sendTeamInviteEmail({
        to: invitedEmail,
        invitedByName,
        invitedByEmail,
        organizationName,
        role,
        inviteUrl,
      });
    });

    // Step 3: Log success
    await step.run("log-success", async () => {
      console.log("[Inngest] Team invite email sent:", {
        to: invitedEmail,
        organization: organizationName,
        emailId: result.emailId,
      });
      return { success: true };
    });

    return {
      success: true,
      emailId: result.emailId,
      sentTo: invitedEmail,
    };
  }
);
