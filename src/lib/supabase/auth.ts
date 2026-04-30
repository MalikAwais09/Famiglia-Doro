import { supabase } from './client';

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
    type: 'email',
  });
  return { user: data.user, session: data.session, error };
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
