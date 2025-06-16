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
  } catch (err: any) {
    console.error('❌ Stripe webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('✅ Stripe Event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('🎉 Payment completed for session:', session.id);
  }

  return new Response('Webhook received', { status: 200 });
}
