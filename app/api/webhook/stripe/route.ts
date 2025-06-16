
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader();
  const chunks = [];

  if (!reader) return Buffer.from([]);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}


export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new NextResponse("Missing Stripe signature or webhook secret", { status: 400 });
  }

  const buf = await getRawBody(req);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("✅ Verified event:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("🎉 Checkout session completed:", session);
  }

  return new NextResponse("Webhook received", { status: 200 });
}
