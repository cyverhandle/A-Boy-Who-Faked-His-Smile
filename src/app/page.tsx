import { BookCheckout } from "@/components/book-checkout";
import { getBookProduct, isRazorpayConfigured } from "@/lib/book-store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const product = getBookProduct();
  const razorpayConfigured = isRazorpayConfigured();

  const highlights = [
    "Written & self-published by the author",
    "76-page A5 paperback, print-on-order",
    "Secure payments through Razorpay Checkout",
    "Packed and shipped personally by the author",
  ];

  const chapters = [
    {
      title: "The Nine O'Clock Bus",
      body: "It starts on an ordinary school bus — a broken-down engine, a roadside conversation, and two people who don't yet know they've just met the person the rest of the book is about.",
    },
    {
      title: "Two Screens, One Conversation",
      body: "A school-bus romance turns long distance. Late-night calls, small fights, and a promise made at seventeen that gets harder to keep with every kilometre and every year.",
    },
    {
      title: "Learning to Breathe",
      body: "What it takes to come apart quietly, and what it takes to come back — the friends who stayed, the slow, unglamorous work of healing, and a love that finally arrives without a deadline attached.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f1e7] text-stone-950">
      <section className="relative isolate px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.32),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(120,53,15,0.18),transparent_30%),linear-gradient(135deg,#fff7ed_0%,#f8f1e7_45%,#e7d8c6_100%)]" />
        <div className="mx-auto max-w-7xl">
          <nav className="flex items-center justify-between rounded-full border border-white/70 bg-white/60 px-5 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-stone-950 text-lg font-black text-white">♡</span>
              <div>
                <p className="text-sm font-bold leading-none">Sad Person</p>
                <p className="mt-1 text-xs text-stone-500">Direct from the author</p>
              </div>
            </div>
            <a
              href="#order"
              className="rounded-full bg-orange-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-950/10 transition hover:bg-orange-800"
            >
              Buy now
            </a>
          </nav>

          <div className="grid items-center gap-10 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-900/10 bg-white/70 px-4 py-2 text-sm font-semibold text-orange-950 shadow-sm backdrop-blur">
                <span className="size-2 rounded-full bg-emerald-500" /> He smiled in pictures, but cried in silence.
              </div>
              <h1 className="mt-7 max-w-4xl text-[clamp(3rem,8vw,7.8rem)] font-black leading-[0.9] tracking-[-0.08em] text-stone-950">
                {product.title}
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-stone-700 sm:text-2xl sm:leading-9">
                {product.subtitle}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600">{product.description}</p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#order"
                  className="rounded-full bg-stone-950 px-7 py-4 text-base font-bold text-white shadow-2xl shadow-stone-950/20 transition hover:-translate-y-0.5 hover:bg-stone-800"
                >
                  Order for {product.priceLabel}
                </a>
                <a
                  href="#about"
                  className="rounded-full border border-stone-300 bg-white/60 px-7 py-4 text-base font-bold text-stone-900 transition hover:border-stone-950 hover:bg-white"
                >
                  Read details
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-3 rounded-2xl bg-white/65 p-4 shadow-sm backdrop-blur">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-900">✓</span>
                    <span className="text-sm font-semibold text-stone-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
              <div className="absolute -left-7 top-12 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
              <div className="absolute -right-10 bottom-5 h-64 w-64 rounded-full bg-stone-900/10 blur-3xl" />
              <div className="relative mx-auto w-fit rotate-[-3deg] rounded-[1.6rem] bg-stone-950 p-3 shadow-[0_45px_90px_rgba(28,25,23,0.34)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cover-front.jpg"
                  alt={`${product.title} — book cover`}
                  className="h-auto w-full max-w-xs rounded-[1.1rem] sm:max-w-sm"
                />
              </div>
              <div className="relative ml-auto mt-6 max-w-sm rounded-3xl border border-white/80 bg-white/75 p-5 shadow-xl backdrop-blur">
                <p className="text-sm font-bold text-stone-950">Why buy directly from the author</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  No marketplace, no middleman — every copy sold here is packed and dispatched by {product.author} personally, and every order supports the writing directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-900">About the book</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-stone-950 sm:text-5xl">
              This is not just a love story.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-stone-600">
              It&apos;s the story of a boy who wore a smile like a mask, so no one could see the battles he fought
              within — a journey through love, distance, and broken trust, and the slow, quiet work of learning to
              breathe again.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {chapters.map((chapter, index) => (
              <article key={chapter.title} className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
                <span className="grid size-11 place-items-center rounded-full bg-orange-100 text-sm font-black text-orange-900">0{index + 1}</span>
                <h3 className="mt-8 text-xl font-black tracking-[-0.02em] text-stone-950">{chapter.title}</h3>
                <p className="mt-4 text-sm leading-6 text-stone-600">{chapter.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl">
          <blockquote className="rounded-[2rem] border border-orange-900/10 bg-white/70 p-8 shadow-sm backdrop-blur sm:p-10">
            <p className="text-lg italic leading-8 text-stone-700 sm:text-xl">
              &ldquo;This book is for anyone who once loved someone too much. It&apos;s for the nights you rehearsed
              conversations that never happened, for the messages typed and deleted, typed and deleted again — for
              every &lsquo;just this once&rsquo; that turned out to be a lie you told yourself on repeat.&rdquo;
            </p>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.24em] text-orange-900">
              — from the Author&apos;s Note
            </p>
          </blockquote>
        </div>
      </section>

      <section id="order" className="px-5 pb-20 pt-6 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2rem] bg-stone-950 p-7 text-white shadow-2xl shadow-stone-950/20 lg:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-200">Secure checkout</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Pay with Razorpay. Fulfilled by the author.</h2>
            <div className="mt-8 space-y-4 text-stone-300">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-stone-400">Book</p>
                <p className="mt-2 text-2xl font-bold text-white">{product.title}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-stone-400">Price</p>
                  <p className="mt-2 text-2xl font-bold text-white">{product.priceLabel}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-stone-400">Format</p>
                  <p className="mt-2 text-lg font-bold text-white">{product.pages}</p>
                </div>
              </div>
              <p className="rounded-3xl bg-orange-100 p-5 text-sm leading-6 text-orange-950">{product.deliveryNote}</p>
            </div>
          </aside>

          <BookCheckout
            product={{
              title: product.title,
              subtitle: product.subtitle,
              priceInPaise: product.priceInPaise,
              currency: product.currency,
              priceLabel: product.priceLabel,
            }}
            razorpayConfigured={razorpayConfigured}
          />
        </div>
      </section>
    </main>
  );
}
