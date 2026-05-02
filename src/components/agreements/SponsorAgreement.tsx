import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SponsorAgreement({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title="Sponsor Agreement"
      legalText={`By proposing a sponsorship, you agree that: the sponsor may fund the designated prize amount; default ROI split is 12% to sponsor and 3% to creator unless otherwise agreed; both parties must confirm before activation; the platform retains its standard fees; sponsorship terms are binding once confirmed; anti-fraud and compliance rules apply.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'read',
          label: 'I have read and agree to the sponsorship collaboration terms above',
          required: true,
        },
      ]}
      confirmLabel="Propose Sponsorship"
      agreementType="sponsor"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
