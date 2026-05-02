import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  signInWithGoogle as authSignInWithGoogle,
  signInWithApple as authSignInWithApple,
  getOrCreateProfile,
} from '@/lib/supabase/auth';
import { toast } from 'sonner';

// ── Profile type (mirrors our profiles table) ─────────────────────────────
export interface UserProfile {
  id: string;
  name: string | null;
  role: 'free' | 'creatorPro' | 'eliteHost' | 'admin';
  points: number;
  wins: number;
  challenges_count: number;
  avatar_url: string | null;
  dorocoin_balance: number;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

// ── Context shape ─────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Helper: fetch profile from DB ─────────────────────────────────────────
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('Profile fetch error (might not exist yet):', error.message);
      return null;
    }
    return data as UserProfile;
  } catch (err) {
    console.error('Unexpected error in fetchProfile:', err);
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (u: User): Promise<UserProfile | null> => {
    const name =
      (u.user_metadata as any)?.name ||
      (u.user_metadata as any)?.full_name ||
      u.email?.split('@')[0] ||
      'User';
    const avatar =
      (u.user_metadata as any)?.avatar_url ||
      (u.user_metadata as any)?.picture ||
      undefined;

    const { profile: p } = await getOrCreateProfile(u.id, name, avatar);
    const prof = (p as UserProfile | null) ?? null;
    if (prof?.is_banned) {
      await supabase.auth.signOut();
      toast.error('Your account has been suspended. Contact support.');
      setUser(null);
      setProfile(null);
      return null;
    }
    return prof;
  }, []);

  // Load session on mount + subscribe to auth changes (do not depend on `loading` — avoids duplicate listeners)
  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        const sess = data.session;
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);
        if (sess?.user) {
          ensureProfile(sess.user).then((prof) => {
            if (!cancelled) setProfile(prof);
          });
        }
      })
      .catch((err) => {
        console.error('Error getting session:', err);
        if (!cancelled) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        const prof = await ensureProfile(sess.user);
        setProfile(prof);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const safety = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn('Auth loading safety timeout hit - forcing load');
        return false;
      });
    }, 2500);

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, [ensureProfile]);

  // Realtime profile updates (balance, role, ban flag, etc.)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if ((import.meta as any)?.env?.DEV) {
            console.log('Profile updated:', payload.new);
          }
          setProfile(payload.new as UserProfile);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ── signIn ──────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    const { user: authUser, session: authSession, error } = await authSignIn(email, password);
    if (authUser) {
      setUser(authUser);
      setSession(authSession);
      const p = await ensureProfile(authUser);
      setProfile(p);
    }
    return { error: error as Error | null };
  }, [ensureProfile]);

  // ── signUp ──────────────────────────────────────────────────────────────
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { user: authUser, error } = await authSignUp(name, email, password);
    if (authUser) {
      setUser(authUser);
    }
    return { error: error as Error | null };
  }, []);

  // ── signOut ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    console.log('Sign out initiated');
    try {
      await authSignOut();
    } catch (e) {
      console.warn('Supabase sign out error (ignoring):', e);
    }
    // Force clear state regardless of API success
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem('supabase.auth.token'); // Clear possible legacy tokens
    
    console.log('Sign out complete, redirecting...');
    window.location.href = '/auth/sign-in';
  }, []);

  // ── Google OAuth ────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const { error } = await authSignInWithGoogle();
    return { error: error as Error | null };
  }, []);

  // ── Apple OAuth ─────────────────────────────────────────────────────────
  const signInWithApple = useCallback(async () => {
    const { error } = await authSignInWithApple();
    return { error: error as Error | null };
  }, []);

  // ── refreshProfile ───────────────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithApple,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
