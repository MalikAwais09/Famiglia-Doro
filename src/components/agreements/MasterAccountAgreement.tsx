import { Link } from 'react-router-dom';
import { AgreementModal } from './AgreementModal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MasterAccountAgreement({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <AgreementModal
      isOpen={isOpen}
      title={`Welcome to Famiglia D'Oro Creator Suite`}
      slotBeforeLegal={
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <Link to="/legal/terms" className="text-yellow-500 hover:underline" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </Link>
          <Link to="/legal/community-guidelines" className="text-yellow-500 hover:underline" target="_blank" rel="noopener noreferrer">
            Community Guidelines
          </Link>
          <Link to="/legal/privacy" className="text-yellow-500 hover:underline" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </Link>
        </div>
      }
      legalText={`By creating an account, you agree to be legally bound by Famiglia D'Oro's Terms, including participation in challenges, monetization features, and platform rules.`}
      requireScrollToBottom={false}
      checkboxes={[
        {
          id: 'tos',
          label:
            'I agree to the Terms of Service, Community Guidelines, and Privacy Policy',
          required: true,
        },
      ]}
      confirmLabel="Create Account"
      agreementType="master_account"
      logOnConfirm={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
