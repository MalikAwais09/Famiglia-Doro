import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DoroCoinPurchaseAgreement({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title="Buy DoroCoins"
      legalText={`DoroCoins may be used within the platform for voting, features, and rewards. They are non-transferable and non-refundable unless required by law.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'virtual',
          label:
            'I understand DoroCoins are virtual currency with no guaranteed cash value',
          required: true,
        },
      ]}
      confirmLabel="Continue to Purchase"
      agreementType="dorocoin_purchase"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
