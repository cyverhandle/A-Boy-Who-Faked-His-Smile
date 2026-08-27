import crypto from "node:crypto";

export type RazorpayCredentials = {
  keyId: string;
  keySecret: string;
};

export type RazorpayOrderResponse = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: string;
  attempts: number;
  notes?: Record<string, string>;
  created_at: number;
};

export type RazorpayPaymentResponse = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string | null;
  method?: string;
  email?: string;
  contact?: string;
  captured?: boolean;
  error_description?: string | null;
};

export function getRazorpayCredentials(): RazorpayCredentials | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return { keyId, keySecret };
}

function encodeCredentials(credentials: RazorpayCredentials) {
  return Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64");
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const error = record.error;

    if (typeof error === "object" && error !== null) {
      const errorRecord = error as Record<string, unknown>;
      if (typeof errorRecord.description === "string") {
        return errorRecord.description;
      }
      if (typeof errorRecord.reason === "string") {
        return errorRecord.reason;
      }
    }

    if (typeof record.message === "string") {
      return record.message;
    }
  }

  return fallback;
}

async function razorpayRequest<T>(
  credentials: RazorpayCredentials,
  path: string,
  init: RequestInit = {},
) {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${encodeCredentials(credentials)}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, `Razorpay request failed with ${response.status}`));
  }

  return payload as T;
}

export function createReceiptId() {
  return `bk_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

export async function createRazorpayOrder(
  credentials: RazorpayCredentials,
  input: {
    amount: number;
    currency: "INR";
    receipt: string;
    notes: Record<string, string>;
  },
) {
  return razorpayRequest<RazorpayOrderResponse>(credentials, "/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      partial_payment: false,
    }),
  });
}

export async function fetchRazorpayPayment(
  credentials: RazorpayCredentials,
  paymentId: string,
) {
  return razorpayRequest<RazorpayPaymentResponse>(
    credentials,
    `/payments/${encodeURIComponent(paymentId)}`,
  );
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}) {
  const expectedSignature = crypto
    .createHmac("sha256", input.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(input.signature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export function verifyRazorpayWebhookSignature(input: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}) {
  const expectedSignature = crypto
    .createHmac("sha256", input.webhookSecret)
    .update(input.rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(input.signature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
