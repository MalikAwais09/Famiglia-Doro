import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (req) => {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  if (!stripeSecret || !webhookSecret || !serviceRoleKey || !supabaseUrl) {
    console.error('Missing env for stripe-webhook');
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata?.userId;
      const packageId = paymentIntent.metadata?.packageId;
      const coinsRaw = paymentIntent.metadata?.coins;
      const coins = coinsRaw ? parseInt(coinsRaw, 10) : NaN;

      if (!userId || !packageId || !Number.isFinite(coins) || coins <= 0) {
        console.error('Missing metadata on payment_intent', paymentIntent.id);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const { data: existing } = await admin
        .from('wallet_transactions')
        .select('id')
        .eq('stripe_payment_id', paymentIntent.id)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const { data: profile, error: profileErr } = await admin
        .from('profiles')
        .select('dorocoin_balance')
        .eq('id', userId)
        .single();

      if (profileErr || !profile) {
        console.error('Profile fetch failed', profileErr);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const newBalance = profile.dorocoin_balance + coins;

      const { error: upErr } = await admin
        .from('profiles')
        .update({ dorocoin_balance: newBalance })
        .eq('id', userId);

      if (upErr) {
        console.error('Profile update failed', upErr);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const { error: wtErr } = await admin.from('wallet_transactions').insert({
        user_id: userId,
        type: 'credit',
        amount: coins,
        description: `DoroCoin purchase (${packageId} pack)`,
        balance_after: newBalance,
        stripe_payment_id: paymentIntent.id,
      });

      if (wtErr) {
        console.error('wallet_transactions insert failed', wtErr);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      await admin.from('notifications').insert({
        user_id: userId,
        title: 'Purchase successful!',
        message: `${coins} DoroCoins added to your wallet.`,
        type: 'success',
        is_read: false,
      });
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata?.userId;

      if (userId) {
        await admin.from('notifications').insert({
          user_id: userId,
          title: 'Payment failed',
          message: 'Payment failed. Please try again.',
          type: 'error',
          is_read: false,
        });
      }
    }
  } catch (e) {
    console.error('Webhook handler error:', e);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
