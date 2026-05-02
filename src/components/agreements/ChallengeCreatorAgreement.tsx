import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ChallengeCreatorAgreement({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title="Create a Challenge"
      legalText={`Publishing a challenge means you comply with Famiglia D'Oro creator policies, including fair judging, lawful content, and platform revenue share where applicable.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'fair',
          label: 'I agree to create a fair and lawful challenge',
          required: true,
        },
        {
          id: 'prize',
          label: 'I understand I am responsible for prize fulfillment if applicable',
          required: true,
        },
        {
          id: 'creator_policy',
          label: 'I agree to the Creator Policy and Revenue Share Terms',
          required: true,
        },
      ]}
      confirmLabel="Publish Challenge"
      agreementType="creator"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
