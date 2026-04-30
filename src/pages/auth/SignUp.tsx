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

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  agree: z.literal(true),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type Form = z.infer<typeof schema>;

export function SignUp() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const { error } = await signUp(data.name, data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error(error.message || 'Sign up failed. Please try again.');
      return;
    }
    // Store email so VerifyCode page can use it for OTP verification
    sessionStorage.setItem('signup_email', data.email);
    sessionStorage.setItem('signup_name', data.name);
    toast.success('Account created — check your email for a verification code');
    navigate('/auth/verify-code');
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-yellow-600 overflow-hidden mx-auto mb-3">
            <img src="https://res.cloudinary.com/drefcs4o2/image/upload/v1775267495/logo-gold_chstxw.jpg" alt="" className="w-full h-full object-cover" />
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
            <Input label="Password" type="password" placeholder="Min 8 chars, uppercase, number" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <label className="flex items-start gap-2">
              <input type="checkbox" {...register('agree')} className="mt-0.5 accent-yellow-600" />
              <span className="text-xs text-[#9CA3AF]">I agree to the Terms of Service, Privacy Policy, and Community Guidelines</span>
            </label>
            {errors.agree && <p className="text-xs text-red-400">You must agree to continue</p>}
            <Button type="submit" fullWidth loading={loading}>Create Account</Button>
          </form>
          <p className="text-center text-sm text-[#9CA3AF]">
            Already have an account? <Link to="/auth/sign-in" className="text-yellow-500 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
