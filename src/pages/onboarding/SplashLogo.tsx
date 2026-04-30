import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export function SplashLogo() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboard', { replace: true });
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="w-24 h-24 mx-auto rounded-full border-2 border-yellow-600 overflow-hidden mb-4">
          <img src="https://res.cloudinary.com/drefcs4o2/image/upload/v1775267495/logo-gold_chstxw.jpg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold gold-text">Famiglia D'Oro</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">Challenge Suite</p>
      </motion.div>
    </div>
  );
}
