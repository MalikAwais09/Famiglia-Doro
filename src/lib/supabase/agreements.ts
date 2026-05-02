import { supabase } from './client';
import type { AgreementType } from './types';

export const AGREEMENT_VERSION = '1.0';

export type { AgreementType };

export const ENTRY_AGREEMENT_SESSION_PREFIX = 'fdoro_entry_agreement_';
export const PAID_VOTE_ACK_PREFIX = 'fdoro_paid_vote_ack_';
export const GEO_COMPLIANCE_SESSION_KEY = 'fdoro_geo_compliance_ack';

export function setEntryAgreementSession(challengeId: string) {
  sessionStorage.setItem(`${ENTRY_AGREEMENT_SESSION_PREFIX}${challengeId}`, '1');
}

export function hasEntryAgreementSession(challengeId: string): boolean {
  return sessionStorage.getItem(`${ENTRY_AGREEMENT_SESSION_PREFIX}${challengeId}`) === '1';
}

export function paidVoteAckKey(challengeId: string) {
  return `${PAID_VOTE_ACK_PREFIX}${challengeId}`;
}

export function hasPaidVoteAckThisSession(challengeId: string): boolean {
  return sessionStorage.getItem(paidVoteAckKey(challengeId)) === '1';
}

export function setPaidVoteAckThisSession(challengeId: string) {
  sessionStorage.setItem(paidVoteAckKey(challengeId), '1');
}

async function fetchClientIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function logAgreement(
  agreementType: AgreementType,
  version: string = AGREEMENT_VERSION
): Promise<{ success?: true; error?: string | object }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const ipAddress = await fetchClientIp();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  const { error } = await supabase.from('agreements').insert({
    user_id: user.id,
    agreement_type: agreementType,
    version,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    console.error('Agreement log failed:', error);
    return { error };
  }

  return { success: true };
}

export async function hasAgreed(agreementType: AgreementType): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('agreements')
    .select('id')
    .eq('user_id', user.id)
    .eq('agreement_type', agreementType)
    .eq('version', AGREEMENT_VERSION)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function getMyAgreements() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('agreements')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}
