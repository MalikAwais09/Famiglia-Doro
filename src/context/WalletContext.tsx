import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getBalance,
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
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const packages = getDoroCoinPackages();

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextBalance = await getBalance();
      setBalance(nextBalance);
      const page = await getTransactions(1, 20);
      setTransactions(page.transactions);
    } catch (err) {
      console.error('Failed to refresh wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const deductCoins = useCallback(
    async (amount: number, description?: string): Promise<boolean> => {
      if (!user?.id) return false;
      const result = await walletDeductCoins(user.id, amount, description ?? '');
      if (result.success) {
        setBalance(result.newBalance);
        try {
          const page = await getTransactions(1, 20);
          setTransactions(page.transactions);
        } catch {
          /* ignore list refresh errors */
        }
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