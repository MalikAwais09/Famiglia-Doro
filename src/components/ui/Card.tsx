import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'ghost' | 'outline' | 'elevated';
  hoverable?: boolean;
}

export function Card({ children, className, onClick, variant = 'default', hoverable = false }: CardProps) {
  const variants = {
    default: 'bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)]',
    ghost: 'bg-transparent',
    outline: 'border border-[rgba(255,255,255,0.12)] bg-[#1C1C1F]/50',
    elevated: 'bg-[#1C1C1F] border border-[rgba(255,255,255,0.1)] shadow-lg shadow-black/20',
  };
  return (
    <div
      className={cn(
        'rounded-lg p-4 transition-all duration-200',
        variants[variant],
        onClick && 'cursor-pointer',
        hoverable && 'hover:shadow-lg hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-0.5',
        onClick && 'hover:border-[rgba(255,255,255,0.15)]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
