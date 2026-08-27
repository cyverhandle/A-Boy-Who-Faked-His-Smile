import { db } from "@/db";
import { bookOrders } from "@/db/schema";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type RazorpayWebhookPayment = {
  id?: unknown;
  order_id?: unknown;
  status?: unknown;
  error_description?: unknown;
};

type RazorpayWebhookPayload = {
  event?: unknown;
  payload?: {
    payment?: {
      entity?: RazorpayWebhookPayment;
    };
  };
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return Response.json(
      { ok: false, message: "Webhook secret is not configured." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  const verified = verifyRazorpayWebhookSignature({
    rawBody,
    signature,
    webhookSecret,
  });

  if (!verified) {
    return Response.json({ ok: false, message: "Invalid signature." }, { status: 400 });
  }

  let payload: RazorpayWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const event = asString(payload.event);
  const payment = payload.payload?.payment?.entity;
  const razorpayOrderId = asString(payment?.order_id);
  const razorpayPaymentId = asString(payment?.id);
  const paymentStatus = asString(payment?.status);
  const errorDescription = asString(payment?.error_description);

  if (!razorpayOrderId || !razorpayPaymentId) {
    return Response.json({ ok: true, ignored: true });
  }

  const localStatus = event === "payment.captured" || paymentStatus === "captured"
    ? "paid"
    : event === "payment.failed" || paymentStatus === "failed"
      ? "failed"
      : event === "payment.authorized" || paymentStatus === "authorized"
        ? "authorized"
        : "verified";

  await db
    .update(bookOrders)
    .set({
      status: localStatus,
      razorpayPaymentId,
      razorpayPaymentStatus: paymentStatus || event,
      failureReason: errorDescription || null,
      updatedAt: new Date(),
    })
    .where(eq(bookOrders.razorpayOrderId, razorpayOrderId));

  return Response.json({ ok: true });
}
