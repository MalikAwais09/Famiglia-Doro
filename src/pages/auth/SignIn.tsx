import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { resetPassword } from '@/lib/supabase/auth';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type Form = z.infer<typeof schema>;

export function SignIn() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const forgotEmailRef = useRef<HTMLInputElement>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Sign in failed. Please check your credentials.');
      return;
    }
    toast.success('Signed in successfully');
    navigate('/dashboard');
  };

  const handleForgotPassword = async () => {
    const email = forgotEmailRef.current?.value?.trim();
    if (!email) { toast.error('Please enter your email'); return; }
    setResetLoading(true);
    const { error } = await resetPassword(email);
    setResetLoading(false);
    if (error) { toast.error(error.message || 'Failed to send reset email'); return; }
    toast.success('Password reset email sent — check your inbox');
    setForgotOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-yellow-600 overflow-hidden mx-auto mb-3">
            <img src="https://res.cloudinary.com/drefcs4o2/image/upload/v1775267495/logo-gold_chstxw.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">Welcome back to Famiglia D'Oro</p>
        </div>
        <div className="space-y-4">
          <SocialAuthButtons />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            <span className="text-xs text-[#6B7280]">or continue with email</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Enter password" error={errors.password?.message} {...register('password')} />
            <div className="text-right">
              <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-yellow-500 hover:underline">Forgot password?</button>
            </div>
            <Button type="submit" fullWidth loading={loading}>Sign In</Button>
          </form>
          <p className="text-center text-sm text-[#9CA3AF]">
            Don't have an account? <Link to="/auth/sign-up" className="text-yellow-500 hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset Password">
        <div className="space-y-4">
          <Input ref={forgotEmailRef} label="Email" type="email" placeholder="you@example.com" />
          <Button fullWidth loading={resetLoading} onClick={handleForgotPassword}>Send Reset Link</Button>
        </div>
      </Modal>
    </div>
  );
}
