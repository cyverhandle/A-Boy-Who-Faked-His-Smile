"use client";

import { type FormEvent, useMemo, useState } from "react";

type CheckoutProduct = {
  title: string;
  subtitle: string;
  priceInPaise: number;
  currency: "INR";
  priceLabel: string;
};

type BookCheckoutProps = {
  product: CheckoutProduct;
  razorpayConfigured: boolean;
};

type CheckoutForm = {
  quantity: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type CreateOrderResponse = {
  ok: boolean;
  message?: string;
  keyId?: string;
  internalOrderId?: string;
  order?: {
    id: string;
    amount: number;
    currency: string;
    receipt: string | null;
  };
  product?: {
    title: string;
    description: string;
    amountLabel: string;
  };
  customer?: {
    name: string;
    email: string;
    contact: string;
  };
};

type VerifyPaymentResponse = {
  ok: boolean;
  status?: string;
  message?: string;
  orderId?: string;
  paymentId?: string;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
    code?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
    backdrop_color: string;
  };
  modal: {
    confirm_close: boolean;
    ondismiss: () => void;
  };
  handler: (response: RazorpaySuccessResponse) => void;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayFailureResponse) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const initialForm: CheckoutForm = {
  quantity: 1,
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

function formatQuantityPrice(priceInPaise: number, quantity: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: priceInPaise % 100 === 0 ? 0 : 2,
  }).format((priceInPaise * quantity) / 100);
}

function getMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") {
      return record.message;
    }
  }

  return fallback;
}

function loadRazorpayCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Checkout is not available on the server."));
      return;
    }

    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-js");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Razorpay failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load."));
    document.body.appendChild(script);
  });
}

export function BookCheckout({ product, razorpayConfigured }: BookCheckoutProps) {
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    type: "idle" | "success" | "error" | "info";
    message: string;
  }>({
    type: razorpayConfigured ? "idle" : "info",
    message: razorpayConfigured
      ? ""
      : "Payments are designed for Razorpay. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to accept live or test payments.",
  });

  const totalLabel = useMemo(
    () => formatQuantityPrice(product.priceInPaise, form.quantity),
    [form.quantity, product.priceInPaise],
  );

  const updateField = (field: keyof CheckoutForm, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function verifyPayment(internalOrderId: string, response: RazorpaySuccessResponse) {
    const verificationResponse = await fetch("/api/checkout/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        internalOrderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });

    const payload = (await verificationResponse.json()) as VerifyPaymentResponse;

    if (!verificationResponse.ok || !payload.ok) {
      throw new Error(payload.message || "Payment verification failed.");
    }

    return payload;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!razorpayConfigured) {
      setNotice({
        type: "error",
        message:
          "Razorpay keys are missing. Configure test or live keys before accepting payments.",
      });
      return;
    }

    setIsSubmitting(true);
    setNotice({ type: "info", message: "Preparing secure Razorpay checkout…" });

    try {
      await loadRazorpayCheckout();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable. Please refresh and try again.");
      }

      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as CreateOrderResponse;

      if (!response.ok || !payload.ok || !payload.order || !payload.keyId || !payload.internalOrderId) {
        throw new Error(getMessage(payload, "Could not create a Razorpay order."));
      }

      const razorpay = new window.Razorpay({
        key: payload.keyId,
        amount: payload.order.amount,
        currency: payload.order.currency,
        name: product.title,
        description: payload.product?.description || product.subtitle,
        order_id: payload.order.id,
        prefill: {
          name: payload.customer?.name || form.name,
          email: payload.customer?.email || form.email,
          contact: payload.customer?.contact || form.phone,
        },
        notes: {
          internal_order_id: payload.internalOrderId,
          book: product.title,
          quantity: String(form.quantity),
        },
        theme: {
          color: "#7c2d12",
          backdrop_color: "#111827",
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsSubmitting(false);
            setNotice({
              type: "info",
              message: "Checkout was closed. Your order is not confirmed until payment succeeds.",
            });
          },
        },
        handler: (paymentResponse) => {
          void (async () => {
            setNotice({ type: "info", message: "Payment received. Verifying securely…" });

            try {
              const verified = await verifyPayment(payload.internalOrderId as string, paymentResponse);
              setNotice({
                type: "success",
                message:
                  verified.message ||
                  `Payment verified. Your order reference is ${verified.orderId || payload.internalOrderId}.`,
              });
              setForm(initialForm);
            } catch (verificationError) {
              setNotice({
                type: "error",
                message:
                  verificationError instanceof Error
                    ? verificationError.message
                    : "Payment verification failed. Please contact the author with your Razorpay payment ID.",
              });
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
      });

      razorpay.on("payment.failed", (failure) => {
        setIsSubmitting(false);
        setNotice({
          type: "error",
          message:
            failure.error?.description ||
            failure.error?.reason ||
            "Payment failed or was cancelled. Please try again.",
        });
      });

      razorpay.open();
    } catch (error) {
      setIsSubmitting(false);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to start checkout.",
      });
    }
  }

  const noticeClass =
    notice.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : notice.type === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-2xl shadow-stone-950/10 sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-800">Direct order</p>
          <h2 className="mt-2 text-2xl font-bold text-stone-950">Buy from the author</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">No marketplace, no ISBN gatekeeping — just a secure direct purchase.</p>
        </div>
        <div className="rounded-2xl bg-stone-950 px-4 py-3 text-right text-white">
          <p className="text-xs text-stone-300">Total</p>
          <p className="text-xl font-bold">{totalLabel}</p>
        </div>
      </div>

      {notice.message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${noticeClass}`}>{notice.message}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          Copies
          <select
            value={form.quantity}
            onChange={(event) => updateField("quantity", Number(event.target.value))}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition focus:border-orange-700 focus:ring-4"
          >
            {[1, 2, 3, 4, 5].map((quantity) => (
              <option key={quantity} value={quantity}>
                {quantity} {quantity === 1 ? "copy" : "copies"}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Full name
          <input
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition placeholder:text-stone-400 focus:border-orange-700 focus:ring-4"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition placeholder:text-stone-400 focus:border-orange-700 focus:ring-4"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-stone-700">
          Phone
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition placeholder:text-stone-400 focus:border-orange-700 focus:ring-4"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-stone-700">
        Delivery address
        <textarea
          required
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="House number, street, area"
          rows={3}
          className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition placeholder:text-stone-400 focus:border-orange-700 focus:ring-4"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-stone-700">
          City
          <input
            required
            value={form.city}
            onChange={(event) => updateField("city", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition focus:border-orange-700 focus:ring-4"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          State
          <input
            required
            value={form.state}
            onChange={(event) => updateField("state", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition focus:border-orange-700 focus:ring-4"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-stone-700">
          PIN code
          <input
            required
            value={form.pincode}
            onChange={(event) => updateField("pincode", event.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none ring-orange-700/20 transition focus:border-orange-700 focus:ring-4"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group w-full rounded-2xl bg-orange-900 px-6 py-4 text-base font-bold text-white shadow-xl shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {isSubmitting ? "Opening secure checkout…" : `Pay ${totalLabel} with Razorpay`}
        <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
      </button>

      <p className="text-center text-xs leading-5 text-stone-500">
        Razorpay returns payment ID, order ID, and signature. This website verifies the signature on the server before confirming the order.
      </p>
    </form>
  );
}
