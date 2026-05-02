import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { verifyOtp, resendOtp } from '@/lib/supabase/auth';
import { getOrCreateProfile } from '@/lib/supabase/auth';

export function VerifyCode() {
  const [codes, setCodes] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Read email set by SignUp page
  const email = sessionStorage.getItem('signup_email') || '';

  useEffect(() => {
    if (!email) {
      // If no email in session, redirect back to sign up
      navigate('/auth/sign-up');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCodes = [...codes];
    newCodes[index] = value.slice(-1);
    setCodes(newCodes);
    if (value && index < 5) refs.current[index + 1]?.focus();
  }, [codes]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }, [codes]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCodes(text.split(''));
      refs.current[5]?.focus();
    }
  }, []);

  const allFilled = codes.every(c => c.length === 1);

  const handleVerify = async () => {
    if (!email) { toast.error('Email not found. Please sign up again.'); return; }
    setLoading(true);
    const token = codes.join('');
    const { error, user } = await verifyOtp(email, token);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Invalid or expired code. Please try again.');
      return;
    }

    if (user) {
      const fallbackName =
        user.user_metadata?.name ||
        (sessionStorage.getItem('signup_name') || '') ||
        email.split('@')[0];
      const avatar =
        (user.user_metadata as any)?.avatar_url ||
        (user.user_metadata as any)?.picture ||
        undefined;
      await getOrCreateProfile(user.id, fallbackName || 'User', avatar);
    }
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_name');
    toast.success('Email verified');
    navigate('/auth/success');
  };

  const handleResend = async () => {
    if (!email) return;
    const { error } = await resendOtp(email);
    if (error) { toast.error(error.message || 'Failed to resend code'); return; }
    setResendTimer(30);
    toast.success('Verification code resent');
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
        <p className="text-sm text-[#9CA3AF] mb-8">Enter the 6-digit code sent to your email</p>
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {codes.map((c, i) => (
            <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
              value={c} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-lg font-bold bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-yellow-500" />
          ))}
        </div>
        <Button fullWidth loading={loading} disabled={!allFilled} onClick={handleVerify}>Verify</Button>
        <div className="mt-4">
          {resendTimer > 0 ? (
            <p className="text-sm text-[#6B7280]">Resend in {resendTimer}s</p>
          ) : (
            <button onClick={handleResend} className="text-sm text-yellow-500 hover:underline">Resend Code</button>
          )}
        </div>
      </div>
    </div>
  );
}
