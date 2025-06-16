import { JobPostModel } from '@/database/schema/JobPostModel';
import UserModel from '@/database/schema/UserModel';
import { connectDB } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { NextRequest } from 'next/server';
import { Readable } from 'stream';

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const rawBody = await buffer(req.body as any);
  const signature = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('✅ Stripe Event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const customerId = session.customer;
      const jobId = session.metadata?.jobId;

      if (!jobId) {
        console.error("❌ No jobId found in metadata.");
        return new Response("Missing jobId", { status: 400 });
      }

      await connectDB();

      const user = await UserModel.findOne({ stripeCustomerId: customerId });

      if (!user) {
        console.error("❌ User not found with Stripe Customer ID:", customerId);
        return new Response("User not found", { status: 404 });
      }

      const result = await JobPostModel.updateOne(
        { _id: jobId, user: user._id },
        { $set: { status: "ACTIVE" } }
      );

      console.log("RESULT:", result);

      if (result.modifiedCount === 0) {
        console.warn("⚠️ Job not updated.");
        return new Response("Job update failed", { status: 400 });
      }

      console.log("✅ Job activated successfully");
    }

    return new Response("OK", { status: 200 });

  } catch (err: any) {
    console.error("❌ Stripe webhook error:", err.message || err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
