import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, iconPosition = 'left', id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full h-10 px-4 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            className
          )}
          {...props}
        />
        {icon && (
          <div className={cn('absolute top-1/2 -translate-y-1/2 text-[#6B7280]', iconPosition === 'left' ? 'left-3' : 'right-3')}>
            {icon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[#6B7280]">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';
