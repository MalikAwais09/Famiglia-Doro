import { loadStripe as loadStripeJs, type Stripe, type StripeCardElement } from '@stripe/stripe-js';
import { supabase } from './client';

let stripePromise: Promise<Stripe | null> | null = null;

/** Initialize Stripe.js with publishable key (singleton). Returns null if env key is missing. */
export function loadStripe(): Promise<Stripe | null> {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  if (!key) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripeJs(key);
  }
  return stripePromise;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  amount: number;
  currency: string;
}

export async function createPaymentIntent(packageId: string): Promise<CreatePaymentIntentResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke<CreatePaymentIntentResult>(
    'create-payment-intent',
    {
      body: { packageId, userId: session.user.id },
    },
  );

  if (error) {
    throw new Error(error.message || 'Failed to create payment intent');
  }
  if (!data?.clientSecret) {
    throw new Error('Invalid response from payment service');
  }
  return data;
}

export async function confirmPayment(
  clientSecret: string,
  cardElement: StripeCardElement | null,
): Promise<{ success: boolean; error?: string }> {
  const stripe = await loadStripe();
  if (!stripe || !cardElement) {
    return { success: false, error: 'Stripe not loaded or card missing' };
  }

  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: cardElement },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (paymentIntent?.status !== 'succeeded') {
    return { success: false, error: 'Payment was not completed' };
  }

  return { success: true };
}
