import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, isLoading, fullWidth, disabled, children, icon, iconPosition = 'left', ...props }, ref) => {
    const isLoadingState = loading || isLoading;
    const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:ring-1 focus:ring-yellow-500 focus:outline-none disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
    const variants = {
      primary: 'gold-gradient text-black font-semibold hover:opacity-90',
      secondary: 'bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] text-white hover:bg-[#222225]',
      outline: 'border border-[rgba(255,255,255,0.12)] text-white hover:bg-[rgba(255,255,255,0.05)]',
      ghost: 'bg-transparent text-white hover:bg-[rgba(255,255,255,0.05)]',
      danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/20',
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    };
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)} disabled={disabled || isLoadingState} {...props}>
        {isLoadingState ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
