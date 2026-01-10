import { wahaProvider } from "./waha";

// Export the WAHA provider as the default WhatsApp integration
export const whatsapp = wahaProvider;

// Re-export types for convenience
export type {
  SendMessageResult,
  QRCodeResult,
  CreateInstanceResult,
  DeleteInstanceResult,
  InstanceStatus,
  ChatInfo,
  ParsedWebhook,
  ParsedSessionStatus,
  WhatsAppProvider,
} from "./types";

