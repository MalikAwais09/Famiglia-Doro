import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { MailCheck } from 'lucide-react';

export function Success() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <MailCheck size={64} className="mx-auto text-yellow-500 mb-4" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
        <p className="text-sm text-[#9CA3AF] mb-8">We've sent a secure confirmation link to your email address. Click the link to instantly verify your account and access your dashboard.</p>
        <Button fullWidth variant="secondary" onClick={() => navigate('/auth/sign-in')}>Return to Sign In</Button>
      </div>
    </div>
  );
}
