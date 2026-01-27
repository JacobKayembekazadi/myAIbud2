export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface QRCodeResult {
  base64?: string;
  error?: string;
}

export interface CreateInstanceResult {
  success: boolean;
  instance?: {
    instanceId: string;
    name: string;
  };
  error?: string;
}

export interface DeleteInstanceResult {
  success: boolean;
  error?: string;
}

export interface InstanceStatus {
  status: "connected" | "disconnected" | "connecting";
  phoneNumber?: string;
}

export interface ChatInfo {
  id: string;
  name?: string;
  lastMessage?: string;
  timestamp?: number;
}

export interface ParsedWebhook {
  instanceId: string;
  event: string;
  data: {
    from: string;
    pushName?: string;
    content: string;
    messageType: "text" | "image" | "audio" | "video" | "document";
    fromMe: boolean;
    timestamp: number;
  };
}

export interface ParsedSessionStatus {
  instanceId: string;
  event: "session.status";
  status: "WORKING" | "CONNECTED" | "SCAN_QR_CODE" | "STARTING" | "STOPPED" | "FAILED";
  mappedStatus: "connected" | "disconnected" | "connecting";
}

export interface WhatsAppProvider {
  sendText(instanceId: string, phone: string, message: string): Promise<SendMessageResult>;
  getQRCode(instanceId: string): Promise<QRCodeResult>;
  createInstance(name: string): Promise<CreateInstanceResult>;
  deleteInstance(instanceId: string): Promise<DeleteInstanceResult>;
  getInstanceStatus(instanceId: string): Promise<InstanceStatus | null>;
  getChats(instanceId: string): Promise<ChatInfo[]>;
  verifyWebhook(body: string, signature: string): boolean;
  parseWebhook(payload: unknown): ParsedWebhook | null;
  parseSessionStatus(payload: unknown): ParsedSessionStatus | null;
}

