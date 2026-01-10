import crypto from "crypto";
import type {
  WhatsAppProvider,
  SendMessageResult,
  QRCodeResult,
  CreateInstanceResult,
  DeleteInstanceResult,
  InstanceStatus,
  ChatInfo,
  ParsedWebhook,
  ParsedSessionStatus,
} from "./types";

const WAHA_API_URL = process.env.WAHA_API_URL || "http://localhost:3000";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";
const WAHA_WEBHOOK_SECRET = process.env.WAHA_WEBHOOK_SECRET || "";

async function wahaFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${WAHA_API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (WAHA_API_KEY) {
    headers["X-Api-Key"] = WAHA_API_KEY;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export const wahaProvider: WhatsAppProvider = {
  async sendText(
    instanceId: string,
    phone: string,
    message: string
  ): Promise<SendMessageResult> {
    try {
      // Format phone number for WAHA (remove + and add @c.us suffix)
      const chatId = phone.replace(/[^0-9]/g, "") + "@c.us";

      const response = await wahaFetch(
        `/api/sessions/${instanceId}/messages/send/text`,
        {
          method: "POST",
          body: JSON.stringify({
            chatId,
            text: message,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("WAHA sendText error:", errorText);
        return { success: false, error: `Failed to send: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error("WAHA sendText exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getQRCode(instanceId: string): Promise<QRCodeResult> {
    try {
      // First check session status
      const statusResponse = await wahaFetch(`/api/sessions/${instanceId}`);
      
      if (!statusResponse.ok) {
        // Session doesn't exist, try to start it
        await wahaFetch(`/api/sessions/${instanceId}/start`, { method: "POST" });
        // Wait a moment for session to initialize
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // WAHA 2026.x returns a PNG from `/api/{session}/auth/qr` (no `/sessions`).
      // We convert it to a data URL so the UI can render it in an <img src="...">.
      const response = await wahaFetch(`/api/${instanceId}/auth/qr`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        return {
          error: `Failed to get QR: ${response.status}${errorText ? ` - ${errorText}` : ""}`,
        };
      }

      const buf = Buffer.from(await response.arrayBuffer());
      const base64 = buf.toString("base64");
      return { base64: `data:image/png;base64,${base64}` };
    } catch (error) {
      console.error("WAHA getQRCode exception:", error);
      return {
        error: error instanceof Error ? error.message : "Failed to get QR code",
      };
    }
  },

  async createInstance(name: string): Promise<CreateInstanceResult> {
    try {
      // Generate a unique session ID
      const instanceId = `session-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp`
        : null;

      const response = await wahaFetch("/api/sessions/", {
        method: "POST",
        body: JSON.stringify({
          name: instanceId,
          start: true, // Auto-start the session
          config: webhookUrl ? {
            webhooks: [
              {
                url: webhookUrl,
                events: ["message", "session.status"], // Include session status for real-time updates
              },
            ],
          } : {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("WAHA createInstance error:", errorText);
        return {
          success: false,
          error: `Failed to create instance: ${response.status} - ${errorText}`,
        };
      }

      return {
        success: true,
        instance: { instanceId, name },
      };
    } catch (error) {
      console.error("WAHA createInstance exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async deleteInstance(instanceId: string): Promise<DeleteInstanceResult> {
    try {
      // Stop session first
      await wahaFetch(`/api/sessions/${instanceId}/stop`, { method: "POST" });

      // Delete session
      const response = await wahaFetch(`/api/sessions/${instanceId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 404) {
        return {
          success: false,
          error: `Failed to delete: ${response.status}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("WAHA deleteInstance exception:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getInstanceStatus(instanceId: string): Promise<InstanceStatus | null> {
    try {
      const response = await wahaFetch(`/api/sessions/${instanceId}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Map WAHA status to our status
      let status: "connected" | "disconnected" | "connecting" = "disconnected";
      if (data.status === "WORKING" || data.status === "CONNECTED") {
        status = "connected";
      } else if (data.status === "SCAN_QR_CODE" || data.status === "STARTING") {
        status = "connecting";
      }

      return {
        status,
        phoneNumber: data.me?.id?.replace("@c.us", ""),
      };
    } catch (error) {
      console.error("WAHA getInstanceStatus exception:", error);
      return null;
    }
  },

  async getChats(instanceId: string): Promise<ChatInfo[]> {
    try {
      const response = await wahaFetch(
        `/api/sessions/${instanceId}/chats`
      );

      if (!response.ok) {
        console.error("WAHA getChats error:", response.status);
        return [];
      }

      const data = await response.json();

      return (data || []).map((chat: { id: string; name?: string }) => ({
        id: chat.id,
        name: chat.name,
      }));
    } catch (error) {
      console.error("WAHA getChats exception:", error);
      return [];
    }
  },

  verifyWebhook(body: string, signature: string): boolean {
    if (!WAHA_WEBHOOK_SECRET) {
      // If no secret configured, skip verification in development
      console.warn("WAHA_WEBHOOK_SECRET not set, skipping verification");
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", WAHA_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

      // Support both formats: raw hex and "sha256=hex"
      const providedSignature = signature.replace("sha256=", "");
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
      );
    } catch {
      return false;
    }
  },

  parseWebhook(payload: unknown): ParsedWebhook | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = payload as any;

      const event = data.event || "message";
      const instanceId = data.session || "";
      const message = data.payload || data.message;

      if (!message) {
        return null;
      }

      // Handle different WAHA payload formats
      const from = message.from || message.chatId || "";
      const content = message.body || message.text || "";
      const fromMe = message.fromMe ?? false;
      const messageType = message.type || "text";
      const pushName = message.notifyName || message._data?.notifyName;

      // Filter out group messages and own messages
      if (!from || from.includes("@g.us")) {
        return null;
      }

      return {
        instanceId,
        event,
        data: {
          from: from.replace("@c.us", ""),
          pushName,
          content,
          messageType: messageType as "text" | "image" | "audio" | "video" | "document",
          fromMe,
          timestamp: message.timestamp || Date.now(),
        },
      };
    } catch (error) {
      console.error("WAHA parseWebhook error:", error);
      return null;
    }
  },

  parseSessionStatus(payload: unknown): ParsedSessionStatus | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = payload as any;

      const event = data.event;
      if (event !== "session.status") {
        return null;
      }

      const instanceId = data.session || "";
      const status = data.payload?.status || data.status || "";

      // Map WAHA status to our status
      let mappedStatus: "connected" | "disconnected" | "connecting" = "disconnected";
      if (status === "WORKING" || status === "CONNECTED") {
        mappedStatus = "connected";
      } else if (status === "SCAN_QR_CODE" || status === "STARTING") {
        mappedStatus = "connecting";
      }

      return {
        instanceId,
        event: "session.status",
        status,
        mappedStatus,
      };
    } catch (error) {
      console.error("WAHA parseSessionStatus error:", error);
      return null;
    }
  },
};

