import { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { BuyDoroCoinsModal } from './BuyDoroCoinsModal';
import { getStorage } from '@/lib/storage';
import type { WalletTransaction } from '@/types';
import { timeAgo } from '@/lib/utils';

export function WalletDropdown({ balance: _balance }: { balance: number }) {
  const [open, setOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { balance } = useWallet();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const txns = getStorage<WalletTransaction[]>('wallet_transactions', []);

  return (
    <>
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-md px-3 h-9 text-sm hover:bg-[#222225] transition-colors">
          <Wallet size={14} className="text-yellow-500" />
          <span>{balance}</span>
          <span className="text-[#9CA3AF] text-xs">DC</span>
          <ChevronDown size={14} className="text-[#9CA3AF]" />
        </button>
        {open && (
          <div className="absolute right-0 top-10 w-72 bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl z-50">
            <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
              <p className="text-xs text-[#9CA3AF]">Balance</p>
              <p className="text-2xl font-bold gold-text">{balance} DoroCoins</p>
            </div>
            <div className="p-3">
              <button onClick={() => { setOpen(false); setBuyOpen(true); }} className="w-full gold-gradient text-black text-sm font-semibold h-9 rounded-md">Buy DoroCoins</button>
            </div>
            {txns.length > 0 && (
              <div className="border-t border-[rgba(255,255,255,0.08)] max-h-40 overflow-y-auto">
                {txns.slice(-5).reverse().map(t => (
                  <div key={t.id} className="px-4 py-2 border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{t.description}</span>
                      <span className={`text-xs font-medium ${t.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'credit' ? '+' : '-'}{t.amount}
                      </span>
                    </div>
                    <span className="text-xs text-[#6B7280]">{timeAgo(t.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <BuyDoroCoinsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </>
  );
}
