import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TeamInviteEmailProps {
  invitedByName: string;
  invitedByEmail: string;
  organizationName: string;
  role: "admin" | "agent" | "viewer";
  inviteUrl: string;
}

export default function TeamInviteEmail({
  invitedByName = "John Doe",
  invitedByEmail = "john@example.com",
  organizationName = "Acme Corp",
  role = "agent",
  inviteUrl = "https://app.example.com/accept-invite?token=abc123",
}: TeamInviteEmailProps) {
  const roleDescriptions = {
    admin: "Full access to manage the team, contacts, and billing",
    agent: "Manage assigned contacts and respond to messages",
    viewer: "Read-only access to view contacts and conversations",
  };

  return (
    <Html>
      <Head />
      <Preview>
        You've been invited to join {organizationName} on MyAIBud
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Heading style={h1}>
            You're invited to join {organizationName}
          </Heading>

          <Text style={text}>
            <strong>{invitedByName}</strong> ({invitedByEmail}) has invited you
            to join their team on <strong>MyAIBud</strong>.
          </Text>

          {/* Role Badge */}
          <Section style={roleSection}>
            <Text style={roleLabel}>Your Role:</Text>
            <div style={roleBadge}>
              <Text style={roleText}>{role.toUpperCase()}</Text>
            </div>
            <Text style={roleDescription}>{roleDescriptions[role]}</Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
          </Section>

          {/* Help Text */}
          <Text style={helpText}>
            If you weren't expecting this invitation, you can safely ignore this
            email.
          </Text>

          <Text style={footer}>
            This invitation will expire in 7 days.
          </Text>

          {/* Manual Link */}
          <Text style={linkText}>
            Or copy and paste this URL into your browser:{" "}
            <a href={inviteUrl} style={link}>
              {inviteUrl}
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginTop: "40px",
  marginBottom: "40px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px",
  padding: "0",
  lineHeight: "1.4",
};

const text = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const roleSection = {
  backgroundColor: "#f7fafc",
  borderRadius: "8px",
  padding: "20px",
  margin: "30px 0",
  textAlign: "center" as const,
};

const roleLabel = {
  color: "#718096",
  fontSize: "14px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 10px",
};

const roleBadge = {
  display: "inline-block",
  backgroundColor: "#10b981",
  borderRadius: "20px",
  padding: "8px 20px",
  margin: "0 0 10px",
};

const roleText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "0.5px",
};

const roleDescription = {
  color: "#4a5568",
  fontSize: "14px",
  margin: "0",
  lineHeight: "1.5",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const helpText = {
  color: "#718096",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "30px 0 10px",
};

const footer = {
  color: "#a0aec0",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "10px 0",
};

const linkText = {
  color: "#718096",
  fontSize: "12px",
  lineHeight: "1.6",
  margin: "20px 0 0",
  wordBreak: "break-all" as const,
};

const link = {
  color: "#10b981",
  textDecoration: "underline",
};
