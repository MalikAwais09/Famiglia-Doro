import { supabase } from './client';
import type { WalletTransaction } from './types';

export interface DoroCoinPackage {
  id: string;
  coins: number;
  price: number;
  label: string;
  currency: string;
  popular?: boolean;
  /** Kept so existing UI can show the gold badge without layout changes */
  badge?: string | null;
}

export interface WalletTransactionsPage {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export type DeductCoinsResult =
  | { success: true; newBalance: number }
  | { success: false; error: string };

// ── getBalance ────────────────────────────────────────────────────────────
export async function getBalance(): Promise<number> {
  if (import.meta.env.DEV) {
    console.log('getBalance called');
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return 0;

  const { data, error } = await supabase
    .from('profiles')
    .select('dorocoin_balance')
    .eq('id', user.id)
    .single();

  if (import.meta.env.DEV) {
    console.log('getBalance result:', data, error);
  }
  if (error) return 0;
  return data?.dorocoin_balance ?? 0;
}

// ── getTransactions ──────────────────────────────────────────────────────
export async function getTransactions(
  page: number = 1,
  limit: number = 20,
): Promise<WalletTransactionsPage> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { transactions: [], total: 0, page, limit };
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('getTransactions error:', error);
    return { transactions: [], total: 0, page, limit };
  }

  return {
    transactions: (data ?? []) as WalletTransaction[],
    total: count ?? 0,
    page,
    limit,
  };
}

// ── creditCoins ───────────────────────────────────────────────────────────
export async function creditCoins(
  userId: string,
  amount: number,
  description: string,
  stripePaymentId?: string,
): Promise<number> {
  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('dorocoin_balance')
    .eq('id', userId)
    .single();

  if (readError) throw readError;
  if (!profile) throw new Error('Profile not found');

  const newBalance = profile.dorocoin_balance + amount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ dorocoin_balance: newBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  const { error: insertError } = await supabase.from('wallet_transactions').insert({
    user_id: userId,
    type: 'credit',
    amount,
    description,
    balance_after: newBalance,
    stripe_payment_id: stripePaymentId ?? null,
  });

  if (insertError) throw insertError;

  return newBalance;
}

// ── deductCoins ───────────────────────────────────────────────────────────
export async function deductCoins(
  userId: string,
  amount: number,
  description: string,
): Promise<DeductCoinsResult> {
  const { data: profile, error: readError } = await supabase
    .from('profiles')
    .select('dorocoin_balance')
    .eq('id', userId)
    .single();

  if (readError) return { success: false, error: readError.message };
  if (!profile) return { success: false, error: 'Profile not found' };

  if (profile.dorocoin_balance < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  const newBalance = profile.dorocoin_balance - amount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ dorocoin_balance: newBalance })
    .eq('id', userId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: insertError } = await supabase.from('wallet_transactions').insert({
    user_id: userId,
    type: 'debit',
    amount,
    description,
    balance_after: newBalance,
  });

  if (insertError) return { success: false, error: insertError.message };

  return { success: true, newBalance };
}

// ── getDoroCoinPackages ───────────────────────────────────────────────────
export function getDoroCoinPackages(): DoroCoinPackage[] {
  return [
    { id: '100', coins: 100, price: 9.99, label: 'Starter', currency: 'USD', badge: null },
    {
      id: '500',
      coins: 500,
      price: 39.99,
      label: 'Best Value',
      currency: 'USD',
      popular: true,
      badge: 'Best Value',
    },
    { id: '1000', coins: 1000, price: 69.99, label: 'Pro Pack', currency: 'USD', badge: null },
  ];
}
