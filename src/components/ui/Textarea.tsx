import { forwardRef, useState, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCharCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, showCharCount, maxLength, id, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = useState(0);
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          maxLength={maxLength}
          onChange={handleChange}
          rows={4}
          className={cn(
            'w-full px-4 py-3 rounded-md bg-[#161618] border border-[rgba(255,255,255,0.08)] text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-start mt-1">
          <div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
          </div>
          {showCharCount && maxLength && (
            <p className="text-xs text-[#6B7280]">{charCount}/{maxLength}</p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
