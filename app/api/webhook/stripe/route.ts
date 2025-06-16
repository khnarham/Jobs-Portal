import { JobPostModel } from "@/database/schema/JobPostModel";
import UserModel from "@/database/schema/UserModel";
import { connectDB } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
        console.log("session",session.customer);
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
      console.log("RESULT:",result);
      if (result.modifiedCount === 0) {
        console.warn("⚠️ Job not updated.");
        return new Response("Job update failed", { status: 400 });
      }

      console.log("✅ Job activated successfully");
    } catch (err) {
      console.error("❌ Error handling event:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}