import { useState, useMemo } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWallet } from '@/context/WalletContext';
import { logConsent } from '@/lib/payment';
import { toast } from 'sonner';
import { loadStripe, createPaymentIntent, confirmPayment } from '@/lib/supabase/stripe';
import type { DoroCoinPackage } from '@/lib/supabase/wallet';

function CardCheckout({
  pkg,
  loading,
  setLoading,
  onPaid,
}: {
  pkg: DoroCoinPackage;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { refreshBalance } = useWallet();

  const handlePay = async () => {
    const card = elements?.getElement(CardElement);
    if (!stripe || !card) {
      toast.error('Enter your card details');
      return;
    }
    setLoading(true);
    try {
      const { clientSecret } = await createPaymentIntent(pkg.id);
      const result = await confirmPayment(clientSecret, card);
      if (!result.success) {
        toast.error(result.error ?? 'Payment failed');
        return;
      }
      logConsent('dorocoin_purchase');
      toast.success(`${pkg.coins} DoroCoins added to your wallet`);
      await refreshBalance();
      await new Promise(r => setTimeout(r, 1600));
      await refreshBalance();
      onPaid();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[#161618] p-3">
        <CardElement
          options={{
            style: {
              base: {
                color: '#ffffff',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '16px',
                '::placeholder': { color: '#6B7280' },
              },
              invalid: { color: '#f87171' },
            },
          }}
        />
      </div>
      <p className="text-xs text-[#6B7280]">Payments are processed securely by Stripe.</p>
      <Button fullWidth loading={loading} onClick={handlePay}>
        Pay ${pkg.price}
      </Button>
    </div>
  );
}

export function BuyDoroCoinsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'select' | 'pay'>('select');
  const [selected, setSelected] = useState<number | null>(null);
  const [method, setMethod] = useState<'card' | 'apple' | 'google' | null>(null);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const { balance, packages } = useWallet();

  const stripePromise = useMemo(() => loadStripe(), []);

  const pkg = selected !== null ? packages[selected] : undefined;

  const finishAndClose = () => {
    onClose();
    setStep('select');
    setSelected(null);
    setMethod(null);
    setAgree(false);
  };

  const handleAppleGoogleInfo = () => {
    toast.info('Please use Credit / Debit Card to purchase DoroCoins via Stripe.');
  };

  return (
    <Modal open={open} onClose={onClose} title="Buy DoroCoins">
      {step === 'select' && (
        <div className="space-y-3">
          <p className="text-sm text-[#9CA3AF]">
            Current balance: <span className="text-white font-medium">{balance} DC</span>
          </p>
          {packages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setSelected(i);
                setStep('pay');
              }}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${selected === i ? 'border-yellow-600 bg-yellow-600/10' : 'border-[rgba(255,255,255,0.08)] bg-[#161618] hover:border-[rgba(255,255,255,0.15)]'}`}
            >
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

      {step === 'pay' && pkg && (
        <div className="space-y-4">
          <div className="bg-[#161618] rounded-lg p-3">
            <p className="text-sm">
              {pkg.label} — <span className="font-bold gold-text">${pkg.price}</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Method</p>
            {(['card', 'apple', 'google'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`w-full p-3 rounded-md border text-sm text-left transition-colors ${method === m ? 'border-yellow-600 bg-yellow-600/10' : 'border-[rgba(255,255,255,0.08)] bg-[#161618]'}`}
              >
                {m === 'card' ? 'Credit / Debit Card' : m === 'apple' ? 'Apple Pay' : 'Google Pay'}
              </button>
            ))}
          </div>

          {method === 'card' && (
            <Elements stripe={stripePromise}>
              <CardCheckout pkg={pkg} loading={loading} setLoading={setLoading} onPaid={finishAndClose} />
            </Elements>
          )}

          {(method === 'apple' || method === 'google') && (
            <div className="space-y-3">
              <div className="bg-[#161618] rounded-lg p-4 text-center">
                <p className="text-sm font-medium">{method === 'apple' ? 'Apple Pay' : 'Google Pay'}</p>
                <p className="text-lg font-bold gold-text mt-1">${pkg.price}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{pkg.label}</p>
              </div>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={e => setAgree(e.target.checked)}
                  className="mt-0.5 accent-yellow-600"
                />
                <span className="text-xs text-[#9CA3AF]">
                  I understand DoroCoins are virtual currency and purchases are non-refundable.
                </span>
              </label>
              <Button fullWidth disabled={!agree} onClick={handleAppleGoogleInfo}>
                Confirm Purchase
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              setStep('select');
              setMethod(null);
            }}
          >
            Back
          </Button>
        </div>
      )}
    </Modal>
  );
}
