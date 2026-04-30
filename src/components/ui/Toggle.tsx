import { cn } from '@/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn('inline-flex items-start gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <div className="relative mt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            checked ? 'gold-gradient' : 'bg-[#333]'
          )}
        >
          <span className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200',
            checked && 'translate-x-5'
          )} />
        </button>
      </div>
      {(label || description) && (
        <div>
          {label && <span className="text-sm text-[#9CA3AF]">{label}</span>}
          {description && <p className="text-xs text-[#6B7280] mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
}
