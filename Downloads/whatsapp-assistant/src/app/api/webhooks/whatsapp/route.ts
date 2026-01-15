import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { inngest } from "@/inngest/client";
import { whatsapp } from "@/lib/whatsapp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple in-memory rate limiter
// In production, use Upstash Redis for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // New window or expired window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60"
          }
        }
      );
    }

    const signature = request.headers.get("x-webhook-signature") ||
                     request.headers.get("x-hub-signature-256") || "";
    const body = await request.text();

    if (!whatsapp.verifyWebhook(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log("📨 Webhook payload received:", JSON.stringify(payload, null, 2));

    // Check if this is a session status event
    const sessionStatus = whatsapp.parseSessionStatus(payload);
    if (sessionStatus) {
      // Update instance status in Convex
      await convex.mutation(api.instances.updateInstanceStatus, {
        instanceId: sessionStatus.instanceId,
        status: sessionStatus.mappedStatus,
      });
      console.log(`✅ Session status updated: ${sessionStatus.instanceId} -> ${sessionStatus.mappedStatus}`);
      return NextResponse.json({ status: "ok", event: "session.status" });
    }

    // Handle message events
    const parsed = whatsapp.parseWebhook(payload);
    
    if (!parsed || parsed.data.fromMe) {
      console.log("⏭️ Webhook ignored - not a valid message or fromMe:", parsed?.data?.fromMe);
      return NextResponse.json({ status: "ignored" });
    }

    console.log("💬 Parsed webhook:", {
      instanceId: parsed.instanceId,
      from: parsed.data.from,
      content: parsed.data.content?.substring(0, 50),
    });

    const instance = await convex.query(api.instances.getInstance, {
      instanceId: parsed.instanceId,
    });

    if (!instance) {
      console.error("❌ Instance not found:", parsed.instanceId);
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    console.log("👤 Upserting contact...");
    const contactId = await convex.mutation(api.contacts.upsertContact, {
      tenantId: instance.tenantId,
      instanceId: parsed.instanceId,
      phone: parsed.data.from,
      name: parsed.data.pushName,
    });

    console.log("📝 Logging interaction...");
    await convex.mutation(api.interactions.addInteraction, {
      contactId,
      tenantId: instance.tenantId,
      type: "inbound",
      content: parsed.data.content,
    });

    console.log("🚀 Triggering Inngest event...");

    // Send to Inngest with error handling
    try {
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

      console.log("📤 Sending Inngest event:", JSON.stringify(eventData, null, 2));
      console.log("🔑 Inngest config check:", {
        eventKey: process.env.INNGEST_EVENT_KEY ? "✅ SET" : "❌ MISSING",
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "❌ MISSING",
      });
      
      const result = await inngest.send(eventData);
      
      console.log("✅ Inngest event sent successfully:", result);
    } catch (inngestError) {
      console.error("❌ Inngest send failed:", inngestError);
      console.error("Inngest error details:", {
        message: inngestError instanceof Error ? inngestError.message : String(inngestError),
        stack: inngestError instanceof Error ? inngestError.stack : undefined,
        eventKey: process.env.INNGEST_EVENT_KEY ? "SET" : "MISSING",
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      });
      // Don't fail the webhook - we still want to log the message
      // but log the Inngest error for debugging
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("❌ Webhook error:", error);
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
