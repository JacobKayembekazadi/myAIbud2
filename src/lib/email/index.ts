import { Resend } from "resend";
import { render } from "@react-email/components";
import TeamInviteEmail from "./templates/team-invite";

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// From email address - must be verified domain in Resend
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";

export interface SendTeamInviteEmailParams {
  to: string;
  invitedByName: string;
  invitedByEmail: string;
  organizationName: string;
  role: "admin" | "agent" | "viewer";
  inviteUrl: string;
}

/**
 * Send a team invitation email
 */
export async function sendTeamInviteEmail(params: SendTeamInviteEmailParams) {
  try {
    // Render the React email template to HTML
    const emailHtml = await render(
      TeamInviteEmail({
        invitedByName: params.invitedByName,
        invitedByEmail: params.invitedByEmail,
        organizationName: params.organizationName,
        role: params.role,
        inviteUrl: params.inviteUrl,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `You've been invited to join ${params.organizationName} on MyAIBud`,
      html: emailHtml,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log("[Email] Team invite sent successfully:", {
      to: params.to,
      organizationName: params.organizationName,
      emailId: data?.id,
    });

    return { success: true, emailId: data?.id || "unknown" };
  } catch (error) {
    console.error("[Email] Failed to send team invite:", error);

    // Re-throw with more context
    throw new Error(
      `Failed to send invitation email to ${params.to}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validate email configuration
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM_ADDRESS);
}
