import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useWallet } from '@/context/WalletContext';
import { DOROCOIN_PACKAGES } from '@/lib/constants';
import { logConsent } from '@/lib/payment';
import { toast } from 'sonner';

export function BuyDoroCoinsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'select' | 'pay' | 'confirm'>('select');
  const [selected, setSelected] = useState<number | null>(null);
  const [method, setMethod] = useState<'card' | 'apple' | 'google' | null>(null);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const { creditCoins, balance } = useWallet();

  const pkg = DOROCOIN_PACKAGES[selected ?? 0];

  const handlePurchase = () => {
    if (!selected && selected !== 0) return;
    setLoading(true);
    setTimeout(() => {
      creditCoins(pkg.coins);
      logConsent('dorocoin_purchase');
      toast.success('DoroCoins added to your wallet');
      setLoading(false);
      onClose();
      setStep('select');
      setSelected(null);
      setMethod(null);
      setAgree(false);
    }, 1200);
  };

  return (
    <Modal open={open} onClose={onClose} title="Buy DoroCoins">
      {step === 'select' && (
        <div className="space-y-3">
          <p className="text-sm text-[#9CA3AF]">Current balance: <span className="text-white font-medium">{balance} DC</span></p>
          {DOROCOIN_PACKAGES.map((p, i) => (
            <button key={i} onClick={() => { setSelected(i); setStep('pay'); }}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${selected === i ? 'border-yellow-600 bg-yellow-600/10' : 'border-[rgba(255,255,255,0.08)] bg-[#161618] hover:border-[rgba(255,255,255,0.15)]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-lg font-bold gold-text">${p.price}</p>
                </div>
                {p.badge && <Badge variant="gold">{p.badge}</Badge>}
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 'pay' && (
        <div className="space-y-4">
          <div className="bg-[#161618] rounded-lg p-3">
            <p className="text-sm">{pkg.label} — <span className="font-bold gold-text">${pkg.price}</span></p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Method</p>
            {(['card', 'apple', 'google'] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className={`w-full p-3 rounded-md border text-sm text-left transition-colors ${method === m ? 'border-yellow-600 bg-yellow-600/10' : 'border-[rgba(255,255,255,0.08)] bg-[#161618]'}`}>
                {m === 'card' ? 'Credit / Debit Card' : m === 'apple' ? 'Apple Pay' : 'Google Pay'}
              </button>
            ))}
          </div>

          {method === 'card' && (
            <div className="space-y-3">
              <Input placeholder="Cardholder Name" />
              <Input placeholder="1234 5678 9012 3456" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="MM/YY" />
                <Input placeholder="CVV" type="password" />
              </div>
              <p className="text-xs text-[#6B7280]">This is a mock checkout for demonstration purposes.</p>
            </div>
          )}

          {(method === 'apple' || method === 'google') && (
            <div className="space-y-3">
              <div className="bg-[#161618] rounded-lg p-4 text-center">
                <p className="text-sm font-medium">{method === 'apple' ? 'Apple Pay' : 'Google Pay'}</p>
                <p className="text-lg font-bold gold-text mt-1">${pkg.price}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{pkg.label}</p>
              </div>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 accent-yellow-600" />
                <span className="text-xs text-[#9CA3AF]">I understand DoroCoins are virtual currency and purchases are non-refundable.</span>
              </label>
              <Button fullWidth loading={loading} disabled={!agree} onClick={handlePurchase}>Confirm Purchase</Button>
            </div>
          )}

          {method === 'card' && (
            <Button fullWidth loading={loading} onClick={handlePurchase}>Pay ${pkg.price}</Button>
          )}

          <Button variant="ghost" fullWidth onClick={() => { setStep('select'); setMethod(null); }}>Back</Button>
        </div>
      )}
    </Modal>
  );
}
