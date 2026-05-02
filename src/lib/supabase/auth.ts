import { supabase } from './client';
import type { Profile } from './types';

// ── Sign Up with email + password ──────────────────────────────────────────
export async function signUp(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });
  return { user: data.user, error };
}

// ── Sign In with email + password ──────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

// ── Google OAuth ───────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { data, error };
}

// ── Apple OAuth ────────────────────────────────────────────────────────────
export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin,
    },
  });
  return { data, error };
}

// ── Sign Out ───────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ── Get current user ───────────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

// ── Get current session ────────────────────────────────────────────────────
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

// ── Send password reset email ──────────────────────────────────────────────
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { data, error };
}

// ── Update password (after reset) ─────────────────────────────────────────
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { user: data.user, error };
}

// ── Verify OTP (email token) ───────────────────────────────────────────────
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });
  return { user: data.user, session: data.session, error };
}

// ── Profiles: create/fetch fallback (when trigger fails) ────────────────────
export async function createProfile(userId: string, name: string, avatarUrl?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name,
      avatar_url: avatarUrl ?? null,
      role: 'free',
      points: 0,
      wins: 0,
      challenges_count: 0,
      dorocoin_balance: 0,
      is_banned: false,
    })
    .select()
    .single();

  // If profile already exists — ignore conflict (23505 unique_violation)
  if (error && (error as any).code !== '23505') {
    console.error('Profile creation failed:', error);
    return { error };
  }

  return { success: true, profile: (data as Profile | null) ?? null };
}

export async function getOrCreateProfile(userId: string, name: string, avatarUrl?: string) {
  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existingError) {
    console.warn('getOrCreateProfile: fetch error:', existingError);
  }

  if (existing) return { profile: existing as Profile };

  const created = await createProfile(userId, name, avatarUrl);
  if ((created as any).error) return created as any;

  const { data: fresh } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return { profile: (fresh as Profile | null) ?? null };
}

// ── Resend OTP ─────────────────────────────────────────────────────────────
export async function resendOtp(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  return { data, error };
}

// ── Listen for auth state changes ──────────────────────────────────────────
export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback);
}
