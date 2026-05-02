import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function AntiFraudAcknowledgement({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title="Fair Play Confirmation"
      legalText={`We detected unusual voting activity from this browser session. Continuing confirms that you are not using automation, bots, or coordinated manipulation. Violations may lead to strikes or account suspension.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'honest',
          label:
            'I confirm I have not used bots, fake accounts, or manipulation methods',
          required: true,
        },
      ]}
      confirmLabel="I Confirm"
      agreementType="anti_fraud"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
