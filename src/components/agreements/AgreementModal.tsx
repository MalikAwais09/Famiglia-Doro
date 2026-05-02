import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  logAgreement,
  type AgreementType,
} from '@/lib/supabase/agreements';

export interface AgreementCheckboxItem {
  id: string;
  label: string;
  required: boolean;
}

export interface AgreementModalProps {
  isOpen?: boolean;
  open?: boolean;
  title: string;
  description?: string;
  /** Optional content after header (e.g. legal links). */
  slotBeforeLegal?: ReactNode;
  legalText?: string;
  /** When true (default if legalText present), user must scroll legal text to bottom before confirming. */
  requireScrollToBottom?: boolean;
  checkboxes: AgreementCheckboxItem[];
  confirmLabel: string;
  agreementType: AgreementType;
  onConfirm: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  /** Defaults true — set false when the caller logs after side effects (e.g. signup). */
  logOnConfirm?: boolean;
}

export function AgreementModal({
  isOpen,
  open,
  title,
  description,
  legalText,
  requireScrollToBottom = true,
  checkboxes,
  confirmLabel,
  agreementType,
  onConfirm,
  onCancel,
  cancelLabel = 'Cancel',
  slotBeforeLegal,
  logOnConfirm = true,
}: AgreementModalProps) {
  const visible = !!(open ?? isOpen);

  if (import.meta.env.DEV) {
    console.log('AgreementModal render — visible:', visible, 'open:', open, 'isOpen:', isOpen);
  }

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [logging, setLogging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const needsScroll = Boolean(legalText?.trim()) && requireScrollToBottom;

  useEffect(() => {
    if (!visible) {
      setChecked({});
      setScrolledToBottom(false);
      setLogging(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !needsScroll) setScrolledToBottom(true);
    else setScrolledToBottom(false);
  }, [visible, needsScroll, legalText]);

  const scrollHandler = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 8) setScrolledToBottom(true);
  }, []);

  const requiredMet = useMemo(() => {
    for (const cb of checkboxes) {
      if (cb.required && !checked[cb.id]) return false;
    }
    return true;
  }, [checkboxes, checked]);

  const canConfirm = requiredMet && (!needsScroll || scrolledToBottom);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLogging(true);
    if (logOnConfirm) {
      const res = await logAgreement(agreementType);
      if (res.error) {
        console.warn('Agreement log returned error', res.error);
      }
    }
    setLogging(false);
    onConfirm();
  };

  const handleClose = () => {
    if (onCancel) onCancel();
  };

  if (!visible) return null;

  return (
    <Modal open={visible} onClose={handleClose} title={title} subtitle={description}>
      <div className="space-y-4">
        {slotBeforeLegal}
        {legalText?.trim() ? (
          <div
            ref={scrollRef}
            onScroll={scrollHandler}
            className="max-h-[200px] overflow-y-auto text-sm text-[#9CA3AF] leading-relaxed border border-[rgba(255,255,255,0.05)] rounded-md p-3 bg-[#161618] whitespace-pre-wrap"
          >
            {legalText}
          </div>
        ) : null}

        {needsScroll && !scrolledToBottom && (
          <p className="text-xs text-yellow-600/90">Scroll to the bottom of the agreement to continue.</p>
        )}

        <div className="space-y-3">
          {checkboxes.map((cb) => (
            <label key={cb.id} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!checked[cb.id]}
                onChange={(e) => setChecked((s) => ({ ...s, [cb.id]: e.target.checked }))}
                className="mt-1 accent-yellow-600 shrink-0"
              />
              <span className="text-sm text-[#E5E7EB]">
                {cb.label}
                {cb.required && <span className="text-red-400"> *</span>}
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          {onCancel && (
            <Button variant="secondary" fullWidth onClick={handleClose}>
              {cancelLabel}
            </Button>
          )}
          <Button fullWidth loading={logging} disabled={!canConfirm || logging} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
