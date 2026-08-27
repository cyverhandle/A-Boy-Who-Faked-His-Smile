import { db } from "@/db";
import { bookOrders } from "@/db/schema";
import {
  fetchRazorpayPayment,
  getRazorpayCredentials,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type VerifyPaymentRequest = {
  internalOrderId?: unknown;
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fail(message: string, status = 400) {
  return Response.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  const credentials = getRazorpayCredentials();

  if (!credentials) {
    return fail("Razorpay credentials are missing on the server.", 503);
  }

  let body: VerifyPaymentRequest;

  try {
    body = (await request.json()) as VerifyPaymentRequest;
  } catch {
    return fail("Invalid payment verification payload.");
  }

  const internalOrderId = getString(body.internalOrderId);
  const razorpayOrderId = getString(body.razorpay_order_id);
  const razorpayPaymentId = getString(body.razorpay_payment_id);
  const razorpaySignature = getString(body.razorpay_signature);

  if (!internalOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return fail("Missing Razorpay verification fields.");
  }

  const [order] = await db
    .select()
    .from(bookOrders)
    .where(
      and(
        eq(bookOrders.id, internalOrderId),
        eq(bookOrders.razorpayOrderId, razorpayOrderId),
      ),
    )
    .limit(1);

  if (!order) {
    return fail("Order not found for this payment.", 404);
  }

  const isValidSignature = verifyRazorpayPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
    keySecret: credentials.keySecret,
  });

  if (!isValidSignature) {
    await db
      .update(bookOrders)
      .set({
        status: "failed",
        razorpayPaymentId,
        razorpaySignature,
        failureReason: "Invalid Razorpay payment signature",
        updatedAt: new Date(),
      })
      .where(eq(bookOrders.id, order.id));

    return fail("Payment verification failed. Please contact the author if money was debited.");
  }

  let paymentStatus = "verified";

  try {
    const payment = await fetchRazorpayPayment(credentials, razorpayPaymentId);

    if (payment.order_id !== razorpayOrderId) {
      throw new Error("Payment belongs to a different Razorpay order.");
    }

    if (payment.amount !== order.amount || payment.currency !== order.currency) {
      throw new Error("Payment amount or currency does not match the order.");
    }

    paymentStatus = payment.status;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch payment status.";

    await db
      .update(bookOrders)
      .set({
        status: "verified",
        razorpayPaymentId,
        razorpaySignature,
        razorpayPaymentStatus: "signature_verified",
        failureReason: message.slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(bookOrders.id, order.id));

    return Response.json({
      ok: true,
      status: "verified",
      message:
        "Payment signature is verified. The author should confirm capture status in Razorpay before dispatch.",
      orderId: order.id,
      paymentId: razorpayPaymentId,
    });
  }

  const localStatus =
    paymentStatus === "captured"
      ? "paid"
      : paymentStatus === "authorized"
        ? "authorized"
        : "verified";

  await db
    .update(bookOrders)
    .set({
      status: localStatus,
      razorpayPaymentId,
      razorpaySignature,
      razorpayPaymentStatus: paymentStatus,
      failureReason: null,
      updatedAt: new Date(),
    })
    .where(eq(bookOrders.id, order.id));

  return Response.json({
    ok: true,
    status: localStatus,
    message:
      localStatus === "paid"
        ? "Payment captured successfully. Your order is confirmed."
        : "Payment verified. The author will confirm capture before dispatch.",
    orderId: order.id,
    paymentId: razorpayPaymentId,
  });
}
