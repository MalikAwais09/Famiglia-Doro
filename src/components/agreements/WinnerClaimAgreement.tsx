import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WinnerClaimAgreement({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title="Claim Your Prize"
      legalText={`Prize awards are subject to identity verification, anti-fraud review, and applicable law. Incorrect information may void eligibility.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'identity',
          label: 'I confirm my identity information is accurate',
          required: true,
        },
        {
          id: 'tax',
          label: 'I understand I am responsible for applicable taxes on this prize',
          required: true,
        },
        {
          id: 'verify',
          label: 'I agree to verification requirements before payout',
          required: true,
        },
      ]}
      confirmLabel="Claim Prize"
      agreementType="winner_claim"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
