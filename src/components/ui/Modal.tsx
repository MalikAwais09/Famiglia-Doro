import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ open, isOpen, onClose, title, subtitle, children, maxWidth, size, className }: ModalProps) {
  const visible = open ?? isOpen ?? false;
  const sizeClasses: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-xl', xl: 'max-w-2xl' };
  const widthClass = maxWidth || (size ? sizeClasses[size] : 'max-w-lg');

  useEffect(() => {
    if (visible) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(`relative w-full ${widthClass} bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg shadow-xl max-h-[85vh] flex flex-col`, className)}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  {title && <h3 className="text-base font-semibold">{title}</h3>}
                  {subtitle && <p className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors mt-0.5"><X size={18} /></button>
              </div>
            )}
            <div className="overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
