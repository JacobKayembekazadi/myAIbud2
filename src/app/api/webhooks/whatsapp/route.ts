import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { inngest } from "@/inngest/client";
import { whatsapp } from "@/lib/whatsapp";
import { webhookRateLimiter, getRateLimitIdentifier } from "@/lib/ratelimit";
import { logger, logWebhook, logSecurity } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = getRateLimitIdentifier(request);
    const { success, limit, remaining, reset } = await webhookRateLimiter.limit(identifier);

    if (!success) {
      logSecurity("rate_limit", { ip: identifier, endpoint: "/api/webhooks/whatsapp" });
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
          },
        }
      );
    }

    const signature = request.headers.get("x-webhook-signature") ||
                     request.headers.get("x-hub-signature-256") || "";
    const body = await request.text();

    if (!whatsapp.verifyWebhook(body, signature)) {
      logSecurity("invalid_signature", { ip: identifier, endpoint: "/api/webhooks/whatsapp" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    logWebhook("received", { instanceId: payload.session });

    // Check if this is a session status event
    const sessionStatus = whatsapp.parseSessionStatus(payload);
    if (sessionStatus) {
      // Update instance status in Convex
      await convex.mutation(api.instances.updateInstanceStatus, {
        instanceId: sessionStatus.instanceId,
        status: sessionStatus.mappedStatus,
      });
      logger.info({ instanceId: sessionStatus.instanceId, status: sessionStatus.mappedStatus }, "Session status updated");
      return NextResponse.json({ status: "ok", event: "session.status" });
    }

    // Handle message events
    const parsed = whatsapp.parseWebhook(payload);

    if (!parsed || parsed.data.fromMe) {
      logger.debug({ fromMe: parsed?.data?.fromMe }, "Webhook ignored");
      return NextResponse.json({ status: "ignored" });
    }

    logWebhook("verified", {
      instanceId: parsed.instanceId,
      from: parsed.data.from,
      messageType: parsed.data.messageType,
    });

    const instance = await convex.query(api.instances.getInstance, {
      instanceId: parsed.instanceId,
    });

    if (!instance) {
      logger.error({ instanceId: parsed.instanceId }, "Instance not found");
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    logger.debug({ phone: parsed.data.from }, "Upserting contact");
    const contactId = await convex.mutation(api.contacts.upsertContact, {
      tenantId: instance.tenantId,
      instanceId: parsed.instanceId,
      phone: parsed.data.from,
      name: parsed.data.pushName,
    });

    logger.debug({ contactId: contactId.toString() }, "Logging interaction");
    await convex.mutation(api.interactions.addInteraction, {
      contactId,
      tenantId: instance.tenantId,
      type: "inbound",
      content: parsed.data.content,
    });

    logger.debug("Triggering Inngest event");

    // Send to Inngest with error handling
    const eventData = {
      name: "message.upsert",
      data: {
        contactId: contactId.toString(),
        instanceId: parsed.instanceId,
        tenantId: instance.tenantId.toString(),
        phone: parsed.data.from,
        content: parsed.data.content,
        messageType: parsed.data.messageType,
      },
    };

    try {
      logger.debug({ eventName: eventData.name, contactId: eventData.data.contactId }, "Sending Inngest event");

      const result = await inngest.send(eventData);

      logger.info({ result }, "Inngest event sent successfully");
      logWebhook("processed", { instanceId: parsed.instanceId, from: parsed.data.from });
    } catch (inngestError) {
      logger.error({ error: inngestError, contactId: eventData.data.contactId }, "Inngest send failed");
      logWebhook("failed", {
        instanceId: parsed.instanceId,
        from: parsed.data.from,
        error: inngestError
      });
      // Don't fail the webhook - we still want to log the message
      // but log the Inngest error for debugging
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    logger.error({ error }, "Webhook processing error");
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
