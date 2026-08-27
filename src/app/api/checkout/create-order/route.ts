import { db } from "@/db";
import { bookOrders } from "@/db/schema";
import { formatCurrency, getBookProduct } from "@/lib/book-store";
import {
  createRazorpayOrder,
  createReceiptId,
  getRazorpayCredentials,
} from "@/lib/razorpay";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type CheckoutRequest = {
  quantity?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  pincode?: unknown;
};

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function sanitizeMultiline(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s{3,}/g, "  ").slice(0, maxLength);
}

function getQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
    return null;
  }

  return quantity;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validationError(message: string) {
  return Response.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  const credentials = getRazorpayCredentials();

  if (!credentials) {
    return Response.json(
      {
        ok: false,
        message:
          "Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments.",
      },
      { status: 503 },
    );
  }

  let body: CheckoutRequest;

  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return validationError("Please submit a valid checkout form.");
  }

  const quantity = getQuantity(body.quantity);
  const name = sanitizeText(body.name, 160);
  const email = sanitizeText(body.email, 320).toLowerCase();
  const phone = sanitizeText(body.phone, 32);
  const address = sanitizeMultiline(body.address, 600);
  const city = sanitizeText(body.city, 120);
  const state = sanitizeText(body.state, 120);
  const pincode = sanitizeText(body.pincode, 20);

  if (!quantity) {
    return validationError("Choose between 1 and 5 copies.");
  }

  if (name.length < 2) {
    return validationError("Please enter your full name.");
  }

  if (!isEmail(email)) {
    return validationError("Please enter a valid email address.");
  }

  if (!/^\+?[0-9\s-]{8,18}$/.test(phone)) {
    return validationError("Please enter a valid phone number.");
  }

  if (address.length < 10 || city.length < 2 || state.length < 2 || pincode.length < 4) {
    return validationError("Please enter a complete delivery address.");
  }

  const product = getBookProduct();
  const amount = product.priceInPaise * quantity;
  const receipt = createReceiptId();

  try {
    const [savedOrder] = await db
      .insert(bookOrders)
      .values({
        receipt,
        bookTitle: product.title,
        quantity,
        amount,
        currency: product.currency,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        shippingAddress: address,
        shippingCity: city,
        shippingState: state,
        shippingPincode: pincode,
        status: "initializing",
      })
      .returning({ id: bookOrders.id });

    const razorpayOrder = await createRazorpayOrder(credentials, {
      amount,
      currency: product.currency,
      receipt,
      notes: {
        internal_order_id: savedOrder.id,
        book: product.title.slice(0, 250),
        quantity: String(quantity),
      },
    });

    await db
      .update(bookOrders)
      .set({
        razorpayOrderId: razorpayOrder.id,
        razorpayPaymentStatus: razorpayOrder.status,
        status: "created",
        updatedAt: new Date(),
      })
      .where(eq(bookOrders.id, savedOrder.id));

    return Response.json({
      ok: true,
      keyId: credentials.keyId,
      internalOrderId: savedOrder.id,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
      product: {
        title: product.title,
        description: `${quantity} ${quantity === 1 ? "copy" : "copies"} of ${product.title}`,
        amountLabel: formatCurrency(amount, product.currency),
      },
      customer: {
        name,
        email,
        contact: phone,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payment order.";

    await db
      .update(bookOrders)
      .set({
        status: "failed",
        failureReason: message.slice(0, 500),
        updatedAt: new Date(),
      })
      .where(eq(bookOrders.receipt, receipt));

    return Response.json(
      {
        ok: false,
        message: "Payment could not be started. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
