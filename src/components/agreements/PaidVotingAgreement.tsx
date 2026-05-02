import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  balanceLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PaidVotingAgreement({
  isOpen,
  balanceLabel,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title="Support Your Favorite"
      description="You are about to cast a paid vote using 1 DoroCoin (additional votes)."
      slotBeforeLegal={
        balanceLabel ? (
          <p className="text-xs text-[#9CA3AF]">
            Your balance: <span className="text-yellow-500 font-medium">{balanceLabel}</span>
          </p>
        ) : null
      }
      legalText={`Votes influence rankings but do not guarantee outcomes. All purchases are final. Fraudulent activity may result in account suspension.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'final',
          label:
            'I understand votes are final, non-refundable, and do not guarantee winning',
          required: true,
        },
      ]}
      confirmLabel="Confirm Vote"
      agreementType="paid_voting"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
