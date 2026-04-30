import { useState } from 'react';
import { useAgreement } from '@/context/AgreementContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const AGREEMENTS: Record<string, { title: string; content: string }> = {
  master: {
    title: 'Master Account Agreement',
    content: `By creating an account on Famiglia D'Oro Challenge Suite, you agree to:

1. Comply with all platform rules and community guidelines
2. Provide accurate and truthful information
3. Not engage in fraudulent or deceptive practices
4. Respect intellectual property rights of others
5. Not harass, abuse, or threaten other users
6. Keep your account secure and confidential
7. Accept our Terms of Service and Privacy Policy

These terms govern your use of our platform and services.`,
  },
  challenge_entry: {
    title: 'Challenge Entry Agreement',
    content: `By entering a challenge, you agree to:

1. Submit only original work that you own or have rights to
2. Accept the challenge rules and judging criteria
3. Allow your submission to be displayed publicly on the platform
4. Accept the prize distribution terms (50% winner, 35% creator, 15% platform)
5. Understand that entry fees are non-refundable
6. Accept that winners are determined by community votes or creator decision
7. Comply with all challenge-specific rules`,
  },
  paid_voting: {
    title: 'Paid Voting Agreement',
    content: `Before purchasing votes with DoroCoins:

1. You understand that votes are non-refundable
2. One free vote per challenge per day is included with your account
3. Additional votes cost 1 DoroCoin each
4. Votes are recorded immediately and cannot be reversed
5. You agree not to engage in vote manipulation or fraud
6. The platform reserves the right to void fraudulent votes
7. DoroCoins have no monetary value outside this platform`,
  },
  doro_purchase: {
    title: 'DoroCoin Purchase Agreement',
    content: `By purchasing DoroCoins:

1. You understand DoroCoins are virtual currency for this platform only
2. Purchases are final and non-refundable
3. DoroCoins have no real-world monetary value
4. You are responsible for your account security
5. Unused DoroCoins do not expire but may be forfeited if account is terminated
6. Prices may change at any time
7. The platform reserves the right to adjust coin values`,
  },
  creator: {
    title: 'Creator Policy & Revenue Share',
    content: `By publishing a challenge:

1. You agree to the 35% creator revenue share
2. The platform takes 15% as operational fees
3. 50% of entry fees go to the prize pool
4. You are responsible for challenge moderation
5. You must not create misleading or fraudulent challenges
6. Winners are determined by the chosen judging method
7. You agree to resolve disputes fairly
8. The platform can remove challenges that violate policies`,
  },
  sponsor: {
    title: 'Sponsorship Collaboration Agreement',
    content: `By enabling sponsorships:

1. A sponsor may fund the prize pool
2. Default ROI split: 12% to sponsor, 3% to creator
3. Terms are negotiable through the platform
4. Sponsor approval is required before activation
5. Sponsor branding may be displayed on the challenge
6. Both parties must agree to terms before activation
7. Dispute resolution handled by platform team`,
  },
  live_event: {
    title: 'Live Event Agreement',
    content: `By joining a live event:

1. You may be recorded and content may be reused
2. You grant the platform rights to broadcast your participation
3. Live events are subject to technical issues
4. No refunds for technical difficulties
5. Inappropriate behavior may result in removal
6. Premium-only events require active subscription
7. Event schedules may change`,
  },
  winner_claim: {
    title: 'Winner Claim Agreement',
    content: `By claiming a prize:

1. You confirm your identity is accurate
2. You agree to verification before payout
3. Prizes are awarded per the challenge distribution
4. Payment may take 5-7 business days
5. Tax responsibility is yours if applicable
6. You cannot claim prizes obtained through fraud
7. The platform reserves the right to void fraudulent claims`,
  },
  anti_fraud: {
    title: 'Anti-Fraud Acknowledgement',
    content: `You acknowledge:

1. Fraudulent voting, entries, or submissions are prohibited
2. Vote manipulation will result in account suspension
3. Duplicate accounts to circumvent limits are forbidden
4. Prizes may be revoked if fraud is detected
5. The platform has right to investigate suspicious activity
6. Severe violations may result in permanent ban
7. Law enforcement may be contacted for criminal activity`,
  },
  geo_compliance: {
    title: 'Geographic & Legal Compliance',
    content: `Depending on your location:

UNITED STATES: No purchase necessary where required by law. Complies with state gaming regulations.

EUROPEAN UNION: By continuing, you consent to GDPR data processing. Your data is protected under EU regulations.

CANADA: A skill-testing question may be required for prizes. Complies with provincial regulations.

OTHER REGIONS: Certain features may be unavailable in your region. Check local laws before participating.`,
  },
};

export function AgreementModal() {
  const { currentAgreement, acceptAgreement, hideAgreement, hasAccepted } = useAgreement();
  const [agreed, setAgreed] = useState(false);

  if (!currentAgreement || hasAccepted(currentAgreement)) return null;
  const agreement = AGREEMENTS[currentAgreement];
  if (!agreement) return null;

  return (
    <Modal open={!!currentAgreement} onClose={hideAgreement} title={agreement.title} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="max-h-60 overflow-y-auto text-sm text-[#9CA3AF] leading-relaxed border border-[rgba(255,255,255,0.05)] rounded-md p-4 bg-[#161618] whitespace-pre-line">
          {agreement.content}
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 accent-yellow-600" />
          <span className="text-sm">I have read and agree to the {agreement.title.toLowerCase()}</span>
        </label>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={hideAgreement}>Decline</Button>
          <Button fullWidth disabled={!agreed} onClick={() => { acceptAgreement(currentAgreement); setAgreed(false); }}>I Agree</Button>
        </div>
      </div>
    </Modal>
  );
}
