import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

export function Success() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleContinue = () => {
    const name = sessionStorage.getItem('signup_name') || 'New User';
    const email = sessionStorage.getItem('signup_email') || 'user@example.com';
    localStorage.setItem('authProvider', 'email');
    localStorage.setItem('userRole', localStorage.getItem('userRole') || 'free');
    signIn(email, name);
    sessionStorage.removeItem('signup_name');
    sessionStorage.removeItem('signup_email');
    toast.success('Welcome to Famiglia D\'Oro');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Account Created Successfully</h1>
        <p className="text-sm text-[#9CA3AF] mb-8">Welcome to Famiglia D'Oro</p>
        <Button fullWidth onClick={handleContinue}>Continue to Dashboard</Button>
      </div>
    </div>
  );
}
