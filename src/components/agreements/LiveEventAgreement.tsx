import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LiveEventAgreement({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title="Join Live Event Challenge"
      legalText={`Live events may involve public display of your participation. Technical interruptions can occur; follow host instructions and event-specific rules.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'risk',
          label: 'I agree to participate at my own risk',
          required: true,
        },
        {
          id: 'record',
          label: 'I consent to being recorded and broadcast',
          required: true,
        },
        {
          id: 'rules',
          label: 'I agree to event rules and ticketing terms',
          required: true,
        },
      ]}
      confirmLabel="Join Event"
      agreementType="live_event"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
