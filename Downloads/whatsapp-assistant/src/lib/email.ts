import { Resend } from "resend";

// Initialize Resend client if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || "noreply@mychatflow.com";

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS;
}

interface TeamInviteEmailParams {
  to: string;
  invitedByName: string;
  invitedByEmail: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
}

/**
 * Send team invitation email
 */
export async function sendTeamInviteEmail(
  params: TeamInviteEmailParams
): Promise<{ emailId: string }> {
  if (!resend) {
    throw new Error("Email service not configured");
  }

  const { to, invitedByName, organizationName, role, inviteUrl } = params;

  const { data, error } = await resend.emails.send({
    from: `MyChatFlow <${FROM_ADDRESS}>`,
    to: [to],
    subject: `You've been invited to join ${organizationName} on MyChatFlow`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">MyChatFlow</h1>
          </div>

          <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin-top: 0;">You've been invited!</h2>
            <p><strong>${invitedByName}</strong> has invited you to join <strong>${organizationName}</strong> on MyChatFlow as a <strong>${role}</strong>.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            MyChatFlow - AI-Powered WhatsApp Assistant for Real Estate
          </p>
        </body>
      </html>
    `,
    text: `
${invitedByName} has invited you to join ${organizationName} on MyChatFlow as a ${role}.

Accept your invitation: ${inviteUrl}

If you didn't expect this invitation, you can safely ignore this email.
    `,
  });

  if (error) {
    console.error("[Email] Failed to send invite:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { emailId: data?.id || "unknown" };
}

interface WelcomeEmailParams {
  to: string;
  name: string;
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<{ emailId: string }> {
  if (!resend) {
    throw new Error("Email service not configured");
  }

  const { to, name } = params;

  const { data, error } = await resend.emails.send({
    from: `MyChatFlow <${FROM_ADDRESS}>`,
    to: [to],
    subject: "Welcome to MyChatFlow!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Welcome to MyChatFlow, ${name}!</h1>
          <p>Thank you for signing up. You're now ready to start using AI-powered WhatsApp automation for your real estate business.</p>
          <p>Get started by connecting your WhatsApp number in the dashboard.</p>
        </body>
      </html>
    `,
    text: `Welcome to MyChatFlow, ${name}! Thank you for signing up.`,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { emailId: data?.id || "unknown" };
}
