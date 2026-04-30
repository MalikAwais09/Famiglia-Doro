import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
  icon?: ReactNode;
}

export function Badge({ children, variant = 'default', size = 'md', className, icon }: BadgeProps) {
  const variants = {
    default: 'bg-[#161618] text-[#9CA3AF] border-[rgba(255,255,255,0.08)]',
    gold: 'gold-gradient text-black font-semibold',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/20 text-red-400 border border-red-500/20',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/20',
  };
  const sizes = { sm: 'px-2 py-0.5 text-xs gap-1', md: 'px-2.5 py-1 text-xs gap-1.5' };
  return (
    <span className={cn('inline-flex items-center rounded-full border', variants[variant], sizes[size], className)}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
