import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface WalletContextType {
  balance: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  // These are kept for legacy compatibility but should ideally be done via backend
  creditCoins: (amount: number, description?: string) => void;
  deductCoins: (amount: number, description?: string) => boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('dorocoin_balance')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setBalance(data.dorocoin_balance);
      }
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Real state update functions for frontend components
  const creditCoins = useCallback(async (amount: number, description?: string) => {
    if (!user) return;
    
    // Optimistic update
    setBalance(prev => prev + amount);
    
    try {
      // Fetch current
      const { data: profile } = await supabase.from('profiles').select('dorocoin_balance').eq('id', user.id).single();
      if (!profile) return;
      
      const newBalance = profile.dorocoin_balance + amount;
      
      // Update DB
      await supabase.from('profiles').update({ dorocoin_balance: newBalance }).eq('id', user.id);
      
      // Log transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'credit',
        amount,
        description: description || 'DoroCoins purchased/credited',
        balance_after: newBalance,
      });
      
      toast.success(`${amount} DC added to your wallet!`);
    } catch (err) {
      console.error('Failed to credit coins', err);
      // Revert on failure
      refreshBalance();
    }
  }, [user, refreshBalance]);

  const deductCoins = useCallback((amount: number, description?: string): boolean => {
    let success = false;
    setBalance(prev => {
      if (prev < amount) return prev;
      success = true;
      return prev - amount;
    });
    return success;
  }, []);

  return (
    <WalletContext.Provider value={{ balance, loading, refreshBalance, creditCoins, deductCoins }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
