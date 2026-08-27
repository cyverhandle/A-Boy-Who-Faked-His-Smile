const DEFAULT_PRICE_INR = 299;

export type BookProduct = {
  title: string;
  subtitle: string;
  author: string;
  description: string;
  priceInPaise: number;
  currency: "INR";
  priceLabel: string;
  pages: string;
  format: string;
  deliveryNote: string;
};

function readPositivePriceInPaise() {
  const rawPrice = process.env.BOOK_PRICE_INR;
  const parsedPrice = rawPrice ? Number(rawPrice) : DEFAULT_PRICE_INR;

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return DEFAULT_PRICE_INR * 100;
  }

  return Math.round(parsedPrice * 100);
}

export function formatCurrency(amountInPaise: number, currency: "INR" = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amountInPaise % 100 === 0 ? 0 : 2,
  }).format(amountInPaise / 100);
}

export function getBookProduct(): BookProduct {
  const priceInPaise = readPositivePriceInPaise();

  return {
    title: process.env.BOOK_TITLE?.trim() || "A Boy Who Faked His Smile",
    subtitle:
      process.env.BOOK_SUBTITLE?.trim() ||
      "A story of love, distance, and broken trust.",
    author: process.env.BOOK_AUTHOR?.trim() || "Sad Person",
    description:
      process.env.BOOK_DESCRIPTION?.trim() ||
      "He smiled in pictures, but cried in silence. A boy who faked his smile is a journey through love, loneliness, and the pieces of a heart that tried to stay strong — for everyone who ever loved someone across a distance, and for everyone still learning, quietly and patiently, how to breathe normally again.",
    priceInPaise,
    currency: "INR",
    priceLabel: formatCurrency(priceInPaise),
    pages: process.env.BOOK_PAGES?.trim() || "76 pages · A5 Paperback",
    format: process.env.BOOK_FORMAT?.trim() || "Print copy shipped anywhere in India",
    deliveryNote:
      process.env.BOOK_DELIVERY_NOTE?.trim() ||
      "Orders are verified after successful Razorpay payment. Every copy is packed and dispatched personally by the author, with care.",
  };
}

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
