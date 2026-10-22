import { JobPostModel, JobPostStatus } from '@/database/schema/JobPostModel';
import { connectDB } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log("⚡ [WEBHOOK] Request received from Stripe!");

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error("❌ [WEBHOOK] Missing stripe-signature header");
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("❌ [WEBHOOK] Signature verification failed:", err.message);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log("✅ [WEBHOOK] Event verified successfully:", event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const jobId = session.metadata?.jobId;

      console.log("📦 [WEBHOOK] Extracted Job ID:", jobId);

      if (!jobId) {
        console.error("❌ [WEBHOOK] No jobId found in session metadata.");
        return new NextResponse("Missing jobId", { status: 400 });
      }

      console.log("🔌 [WEBHOOK] Connecting to Database...");
      await connectDB();
      console.log("✅ [WEBHOOK] Database connected successfully!");

      console.log("🔄 [WEBHOOK] Updating Job Status to ACTIVE...");
      const result = await JobPostModel.updateOne(
        { _id: jobId },
        { $set: { status: JobPostStatus.ACTIVE } }
      );

      console.log("📝 [WEBHOOK] Update Result object:", result);

      if (result.matchedCount === 0) {
        console.error("❌ [WEBHOOK] Job not found in DB for ID:", jobId);
        return new NextResponse("Job not found", { status: 404 });
      }

      console.log("🎉 [WEBHOOK] Job activated successfully!");
    }

    return new NextResponse("OK", { status: 200 });

  } catch (err: any) {
    console.error("🔥 [WEBHOOK CRASH] Caught unhandled exception:", err.message);
    console.error("🔥 [WEBHOOK CRASH STACK]:", err.stack);
    return new NextResponse(`Internal Server Error: ${err.message}`, { status: 500 });
  }
}