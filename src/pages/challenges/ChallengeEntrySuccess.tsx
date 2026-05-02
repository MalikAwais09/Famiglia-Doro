import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle } from 'lucide-react';
import { formatLocalDateTime } from '@/lib/utils/dateUtils';

export function ChallengeEntrySuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { entry?: { id: string; challengeTitle?: string; entryFee?: number; paymentMethod?: string; enteredAt?: string }; paymentMethod?: string; breakdown?: { winner: number; creator: number; platform: number } } | null;

  return (
    <Container><Section>
      <div className="max-w-md mx-auto text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <CheckCircle size={64} className="mx-auto text-emerald-400 mb-4" />
        </motion.div>
        <h1 className="text-2xl font-bold mb-2">Entry Submitted</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">Your entry has been confirmed.</p>

        {state?.entry && (
          <Card className="text-left mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Entry ID</span><span className="font-mono text-xs">{state.entry.id}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Challenge</span><span>{state.entry.challengeTitle}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Fee</span><span>{state.entry.entryFee || 0} DC</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Payment</span><span className="capitalize">{state.paymentMethod || 'free'}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Date</span><span className="text-xs">{state.entry.enteredAt ? formatLocalDateTime(state.entry.enteredAt) : 'Now'}</span></div>
              {state.breakdown && (
                <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="flex h-2 rounded-full overflow-hidden mb-1">
                    <div className="w-[50%] bg-emerald-500" /><div className="w-[35%] bg-yellow-500" /><div className="w-[15%] bg-gray-500" />
                  </div>
                  <div className="flex justify-between text-xs text-[#9CA3AF]">
                    <span>Winner {state.breakdown.winner.toFixed(0)}</span>
                    <span>Creator {state.breakdown.creator.toFixed(0)}</span>
                    <span>Platform {state.breakdown.platform.toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="bg-[#161618] rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold mb-2">Next Steps</h3>
          <ul className="text-xs text-[#9CA3AF] space-y-1">
            <li>Prepare your submission before the deadline</li>
            <li>Your entry is visible to all participants</li>
            <li>Check the challenge page for updates</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate(`/challenges/${id}`)}>View Challenge</Button>
          <Button variant="secondary" onClick={() => navigate('/my-entries')}>View My Entries</Button>
          <Button variant="ghost" onClick={() => navigate('/challenges')}>Browse More Challenges</Button>
        </div>
      </div>
    </Section></Container>
  );
}
