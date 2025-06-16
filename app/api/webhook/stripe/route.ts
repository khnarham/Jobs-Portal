import { buffer } from "micro";
import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"] as string;
  const buf = await buffer(req);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret!);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Verified event:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("🎉 Checkout session completed:", session);
  }

  res.status(200).json({ received: true });
}
