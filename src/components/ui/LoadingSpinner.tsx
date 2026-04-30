import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', className, message, fullScreen }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const spinner = <div className={cn('animate-spin rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-yellow-500', sizes[size], className)} />;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          {message && <p className="text-sm text-[#9CA3AF]">{message}</p>}
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        {spinner}
        <p className="text-sm text-[#9CA3AF]">{message}</p>
      </div>
    );
  }

  return spinner;
}
