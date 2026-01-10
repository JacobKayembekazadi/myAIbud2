import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { inngest } from "@/inngest/client";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-webhook-signature") || 
                     request.headers.get("x-hub-signature-256") || "";
    const body = await request.text();

    if (!whatsapp.verifyWebhook(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Check if this is a session status event
    const sessionStatus = whatsapp.parseSessionStatus(payload);
    if (sessionStatus) {
      // Update instance status in Convex
      await convex.mutation(api.instances.updateInstanceStatus, {
        instanceId: sessionStatus.instanceId,
        status: sessionStatus.mappedStatus,
      });
      console.log(`Session status updated: ${sessionStatus.instanceId} -> ${sessionStatus.mappedStatus}`);
      return NextResponse.json({ status: "ok", event: "session.status" });
    }

    // Handle message events
    const parsed = whatsapp.parseWebhook(payload);
    
    if (!parsed || parsed.data.fromMe) {
      return NextResponse.json({ status: "ignored" });
    }

    const instance = await convex.query(api.instances.getInstance, {
      instanceId: parsed.instanceId,
    });

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    const contactId = await convex.mutation(api.contacts.upsertContact, {
      tenantId: instance.tenantId,
      instanceId: parsed.instanceId,
      phone: parsed.data.from,
      name: parsed.data.pushName,
    });

    await convex.mutation(api.interactions.addInteraction, {
      contactId,
      tenantId: instance.tenantId,
      type: "inbound",
      content: parsed.data.content,
    });

    await inngest.send({
      name: "message.upsert",
      data: {
        contactId: contactId.toString(),
        instanceId: parsed.instanceId,
        tenantId: instance.tenantId.toString(),
        phone: parsed.data.from,
        content: parsed.data.content,
        messageType: parsed.data.messageType,
      },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}
