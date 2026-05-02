import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getTransactions,
  getDoroCoinPackages,
  deductCoins as walletDeductCoins,
  type DoroCoinPackage,
} from '@/lib/supabase/wallet';
import type { WalletTransaction } from '@/lib/supabase/types';

interface WalletContextType {
  balance: number;
  transactions: WalletTransaction[];
  loading: boolean;
  packages: DoroCoinPackage[];
  refreshBalance: () => Promise<void>;
  deductCoins: (amount: number, description?: string) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const packages = getDoroCoinPackages();

  // Balance comes directly from AuthContext profile to avoid stuck spinners / extra queries.
  const balance = profile?.dorocoin_balance ?? 0;
  const loading = authLoading;

  if (import.meta.env.DEV) {
    console.log('=== WALLET DEBUG ===');
    console.log('User:', user?.id);
    console.log('Loading:', loading);
    console.log('Balance:', balance);
  }

  const refreshTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }
    try {
      const page = await getTransactions(1, 20);
      setTransactions(page.transactions);
    } catch (err) {
      console.error('Failed to refresh wallet transactions:', err);
      setTransactions([]);
    }
  }, [user]);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    // Re-fetch profile so dorocoin_balance updates immediately in UI.
    await refreshProfile();
    // Keep transactions fresh too (used in dropdown).
    await refreshTransactions();
  }, [user, refreshProfile, refreshTransactions]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTransactions([]);
      return;
    }
    void refreshTransactions();
  }, [user, authLoading, refreshTransactions]);

  const deductCoins = useCallback(
    async (amount: number, description?: string): Promise<boolean> => {
      if (!user?.id) return false;
      const result = await walletDeductCoins(user.id, amount, description ?? '');
      if (result.success) {
        // Balance will be pushed by profile refresh / realtime; update transactions optimistically.
        try {
          const page = await getTransactions(1, 20);
          setTransactions(page.transactions);
        } catch {}
        return true;
      }
      return false;
    },
    [user],
  );

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        loading,
        packages,
        refreshBalance,
        deductCoins,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}



// sdhfks