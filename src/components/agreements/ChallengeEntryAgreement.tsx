import type { Challenge, ChallengeRule } from '@/lib/supabase/types';
import { AgreementModal } from './AgreementModal';

interface Props {
  challenge: Challenge;
  isPaid: boolean;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function rulesBody(rules?: ChallengeRule[] | null): string {
  const list = Array.isArray(rules) ? rules.map((r) => r?.rule_text).filter(Boolean) : [];
  return list.length > 0 ? list.map((t, i) => `${i + 1}. ${t}`).join('\n') : 'No additional rules listed for this challenge.';
}

export function ChallengeEntryAgreement({ challenge, isPaid, isOpen, onConfirm, onCancel }: Props) {
  const box = `${challenge.description ?? ''}\n\nChallenge rules:\n${rulesBody(challenge.rules)}`;

  const checkboxes = [
    {
      id: 'rules',
      label: 'I agree to the Challenge Rules, Voting Policy, and Prize Terms',
      required: true,
    },
    ...(isPaid
      ? [
          {
            id: 'refund',
            label: 'I understand this entry fee is non-refundable',
            required: true,
          },
        ]
      : []),
  ];

  return (
    <AgreementModal
      isOpen={isOpen}
      title="Enter Challenge"
      description={challenge.title}
      legalText={box}
      checkboxes={checkboxes}
      confirmLabel="Enter Challenge"
      agreementType="challenge_entry"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
