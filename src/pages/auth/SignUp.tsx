import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { logAgreement } from '@/lib/supabase/agreements';
import { MasterAccountAgreement } from '@/components/agreements/MasterAccountAgreement';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email required'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof schema>;

export function SignUp() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({ resolver: zodResolver(schema) });

  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<SignUpFormData | null>(null);

  const navigate = useNavigate();
  const { signUp } = useAuth();

  const onSubmit = (data: SignUpFormData) => {
    setPendingFormData(data);
    setShowAgreement(true);
  };

  /** Runs only after Master Account checkbox + confirm inside the modal. */
  const handleAgreementConfirmed = async () => {
    setShowAgreement(false);
    const data = pendingFormData;
    setPendingFormData(null);
    if (!data) return;

    setLoading(true);
    const { error } = await signUp(data.name, data.email, data.password);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Sign up failed. Please try again.');
      return;
    }

    await logAgreement('master_account').catch(() => {
      console.warn('master_account agreement log skipped or failed — profile may not be ready yet');
    });

    sessionStorage.setItem('signup_email', data.email);
    sessionStorage.setItem('signup_name', data.name);
    toast.success('Account created! Please check your email for a confirmation link.');
    navigate('/auth/success');
  };

  return (
    <>
      <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full border-2 border-yellow-600 overflow-hidden mx-auto mb-3">
              <img
                src="https://res.cloudinary.com/drefcs4o2/image/upload/v1775267495/logo-gold_chstxw.jpg"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
          </div>
          <div className="space-y-4">
            <SocialAuthButtons />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
              <span className="text-xs text-[#6B7280]">or sign up with email</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Input
                label="Password"
                type="password"
                placeholder="Min 8 chars, uppercase, number"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <p className="text-[11px] text-[#6B7280]">
                You will review our{' '}
                <Link to="/legal/terms" className="text-yellow-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  Terms
                </Link>
                ,{' '}
                <Link to="/legal/privacy" className="text-yellow-500 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
                , and{' '}
                <Link
                  to="/legal/community-guidelines"
                  className="text-yellow-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Community Guidelines
                </Link>{' '}
                before account creation completes.
              </p>
              <Button type="submit" fullWidth loading={loading}>
                Create Account
              </Button>
            </form>
            <p className="text-center text-sm text-[#9CA3AF]">
              Already have an account?{' '}
              <Link to="/auth/sign-in" className="text-yellow-500 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <MasterAccountAgreement
        isOpen={showAgreement}
        onConfirm={handleAgreementConfirmed}
        onCancel={() => {
          setShowAgreement(false);
          setPendingFormData(null);
        }}
      />
    </>
  );
}
