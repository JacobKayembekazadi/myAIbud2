"use server";

import { whatsapp } from "@/lib/whatsapp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function fetchQRCode(instanceId: string) {
  try {
    const result = await whatsapp.getQRCode(instanceId);
    if (result.error) {
      return { error: result.error };
    }
    return { qr: result.base64 };
  } catch (error) {
    console.error("Failed to fetch QR code:", error);
    return { error: error instanceof Error ? error.message : "Failed to fetch QR code" };
  }
}

export async function createWhatsAppInstance(name: string) {
  try {
    const result = await whatsapp.createInstance(name);
    if (!result.success) {
      return { error: result.error };
    }
    return { instance: result.instance };
  } catch (error) {
    console.error("Failed to create instance:", error);
    return { error: error instanceof Error ? error.message : "Failed to create instance" };
  }
}

export async function deleteWhatsAppInstance(instanceId: string) {
  try {
    const result = await whatsapp.deleteInstance(instanceId);
    if (!result.success) {
      return { error: result.error };
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete instance:", error);
    return { error: error instanceof Error ? error.message : "Failed to delete instance" };
  }
}

export async function getInstanceStatus(instanceId: string) {
  try {
    const result = await whatsapp.getInstanceStatus(instanceId);
    if (!result) {
      console.log(`[getInstanceStatus] No result for ${instanceId}, returning disconnected`);
      return { status: "disconnected" as const };
    }
    console.log(`[getInstanceStatus] ${instanceId} -> ${result.status}`);
    return {
      status: result.status, // Can be "connected", "disconnected", or "connecting"
      phoneNumber: result.phoneNumber
    };
  } catch (error) {
    console.error("Failed to get instance status:", error);
    return { status: "disconnected" as const };
  }
}

export async function syncChats(instanceId: string, tenantId: string) {
  try {
    // Fetch chats from WAHA
    const chats = await whatsapp.getChats(instanceId);

    let importedCount = 0;
    for (const chat of chats) {
      // Skip groups for now
      if (chat.id.includes("@g.us")) continue;

      // Extract phone number
      const phone = chat.id.replace("@c.us", "");

      // Upsert contact
      await convex.mutation(api.contacts.upsertContact, {
        tenantId: tenantId as any,
        instanceId: instanceId,
        phone: phone,
        name: chat.name || undefined,
      });

      importedCount++;
    }

    return { success: true, importedCount };
  } catch (error) {
    console.error("Failed to sync chats:", error);
    return { error: error instanceof Error ? error.message : "Failed to sync chats" };
  }
}

// Create instance with Convex storage (for onboarding)
export async function createInstance(tenantId: Id<"tenants">, name: string) {
  try {
    // Create instance in WAHA
    const result = await whatsapp.createInstance(name);
    if (!result.success || !result.instance) {
      return { success: false, error: result.error || "Failed to create instance" };
    }

    // Store in Convex
    await convex.mutation(api.instances.createInstance, {
      tenantId,
      name,
      instanceId: result.instance.instanceId,
    });

    return { success: true, instanceId: result.instance.instanceId };
  } catch (error) {
    console.error("Failed to create instance:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create instance" };
  }
}

// Get QR code for scanning (for onboarding)
export async function getQRCode(instanceId: string) {
  try {
    // First check if already connected
    const status = await whatsapp.getInstanceStatus(instanceId);
    if (status?.status === "connected") {
      return { success: true, connected: true };
    }

    // Get QR code
    const result = await whatsapp.getQRCode(instanceId);
    if (result.error) {
      return { success: false, error: result.error };
    }
    
    return { success: true, qrCode: result.base64 };
  } catch (error) {
    console.error("Failed to get QR code:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to get QR code" };
  }
}

// Check instance connection status (for onboarding)
export async function checkInstanceStatus(instanceId: string) {
  try {
    const result = await whatsapp.getInstanceStatus(instanceId);
    return {
      connected: result?.status === "connected",
      status: result?.status || "disconnected",
    };
  } catch (error) {
    console.error("Failed to check instance status:", error);
    return { connected: false, status: "disconnected" };
  }
}
