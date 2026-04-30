import { supabase } from './client';
import type { Entry, Profile } from './types';

// ── enterChallenge ────────────────────────────────────────────────────────
export async function enterChallenge(challengeId: string): Promise<Entry> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Check challenge state
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('id, phase, entry_fee, current_participants, max_participants, title, created_by')
    .eq('id', challengeId)
    .single();

  if (challengeError || !challenge) throw new Error('Challenge not found');
  if (challenge.phase !== 'entry_open') throw new Error('Challenge is not open for entries');
  if (challenge.max_participants && challenge.current_participants >= challenge.max_participants) {
    throw new Error('Challenge is full');
  }

  // Check if already entered
  const { count } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (count && count > 0) throw new Error('Already entered this challenge');

  // Handle entry fee
  if (challenge.entry_fee > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('dorocoin_balance')
      .eq('id', userId)
      .single();

    if (!profile) throw new Error('Profile not found');
    
    if (profile.dorocoin_balance < challenge.entry_fee) {
      throw Object.assign(new Error('Insufficient DoroCoins'), {
        required: challenge.entry_fee,
        balance: profile.dorocoin_balance,
      });
    }

    const newBalance = profile.dorocoin_balance - challenge.entry_fee;

    // Deduct
    await supabase
      .from('profiles')
      .update({ dorocoin_balance: newBalance })
      .eq('id', userId);

    // Log transaction
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'debit',
      amount: challenge.entry_fee,
      description: `Challenge entry fee: ${challenge.title}`,
      balance_after: newBalance,
    });
  }

  // Insert entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      challenge_id: challengeId,
      entry_fee_paid: challenge.entry_fee,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // Increment participants
  try {
    const { error: rpcError } = await supabase.rpc('increment_participants', { challenge_id: challengeId });
    if (rpcError) throw rpcError;
  } catch (err) {
    console.warn('RPC increment_participants failed, falling back to manual update:', err);
    // Fallback: manual
    await supabase
      .from('challenges')
      .update({ current_participants: (challenge.current_participants || 0) + 1 })
      .eq('id', challengeId);
  }

  // Notify creator (if not self)
  if (challenge.created_by !== userId) {
    const { data: me } = await supabase.from('profiles').select('name').eq('id', userId).single();
    await supabase.from('notifications').insert({
      user_id: challenge.created_by,
      title: 'New Entry',
      message: `${me?.name || 'Someone'} joined your challenge ${challenge.title}`
    });
  }

  return entry as Entry;
}

// ── withdrawEntry ─────────────────────────────────────────────────────────
export async function withdrawEntry(challengeId: string, entryId: string): Promise<{ success: boolean; refunded: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Check phase
  const { data: challenge } = await supabase
    .from('challenges')
    .select('phase, title, current_participants')
    .eq('id', challengeId)
    .single();

  if (!challenge) throw new Error('Challenge not found');
  if (challenge.phase !== 'entry_open') throw new Error('Cannot withdraw after entry phase is closed');

  // Check entry
  const { data: entry } = await supabase
    .from('entries')
    .select('user_id, entry_fee_paid')
    .eq('id', entryId)
    .single();

  if (!entry) throw new Error('Entry not found');
  if (entry.user_id !== userId) throw new Error('Not authorized to withdraw this entry');

  // Refund
  let refunded = 0;
  if (entry.entry_fee_paid > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('dorocoin_balance')
      .eq('id', userId)
      .single();

    if (profile) {
      const newBalance = profile.dorocoin_balance + entry.entry_fee_paid;
      await supabase
        .from('profiles')
        .update({ dorocoin_balance: newBalance })
        .eq('id', userId);

      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        type: 'credit',
        amount: entry.entry_fee_paid,
        description: `Refund for withdrawal: ${challenge.title}`,
        balance_after: newBalance,
      });
      refunded = entry.entry_fee_paid;
    }
  }

  // Delete entry
  const { error } = await supabase.from('entries').delete().eq('id', entryId);
  if (error) throw error;

  // Decrement participants
  try {
    const { error: rpcError } = await supabase.rpc('decrement_participants', { challenge_id: challengeId });
    if (rpcError) throw rpcError;
  } catch (err) {
    console.warn('RPC decrement_participants failed, falling back to manual update:', err);
    await supabase
      .from('challenges')
      .update({ current_participants: Math.max(0, (challenge.current_participants || 0) - 1) })
      .eq('id', challengeId);
  }

  return { success: true, refunded };
}

// ── getMyEntry ────────────────────────────────────────────────────────────
export async function getMyEntry(challengeId: string): Promise<Entry | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as Entry;
}

// ── getChallengeEntries ───────────────────────────────────────────────────
export async function getChallengeEntries(challengeId: string): Promise<(Entry & { user: Profile })[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  // Verify creator
  const { data: challenge } = await supabase
    .from('challenges')
    .select('created_by')
    .eq('id', challengeId)
    .single();

  if (challenge?.created_by !== userId) throw new Error('Only the challenge creator can view all entries');

  const { data, error } = await supabase
    .from('entries')
    .select(`
      *,
      user:profiles (id, name, avatar_url, role)
    `)
    .eq('challenge_id', challengeId);

  if (error) throw error;
  return data as (Entry & { user: Profile })[];
}
