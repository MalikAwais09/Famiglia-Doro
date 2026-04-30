import { useParams, useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MOCK_CHALLENGES, MOCK_SUBMISSIONS, MOCK_WINNERS } from '@/lib/mock/data';
import { getStorage } from '@/lib/storage';
import type { Challenge, Submission, WinnerRecord } from '@/types';
import { Trophy, Medal } from 'lucide-react';

export function ChallengeWinners() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allChallenges: Challenge[] = [...MOCK_CHALLENGES, ...getStorage<Challenge[]>('challenges', [])];
  const challenge = allChallenges.find(c => c.id === id);

  const mockWinner = MOCK_WINNERS.find(w => w.challengeId === id);
  const localWinners = getStorage<WinnerRecord[]>('winners', []);
  const localWinner = localWinners.find(w => w.challengeId === id);
  const winnerRecord = localWinner || mockWinner;

  if (!challenge) return <Container><Section><p className="text-center text-[#9CA3AF] py-8">Challenge not found</p></Section></Container>;

  if (!winnerRecord) {
    const subs = [...MOCK_SUBMISSIONS, ...getStorage<Submission[]>('submissions', [])].filter(s => s.challengeId === id).sort((a, b) => b.votes - a.votes);
    return (
      <Container><Section>
        <h1 className="text-3xl font-bold mb-6">{challenge.title} — Winners</h1>
        <div className="space-y-4">
          {subs.slice(0, 3).map((s, i) => (
            <Card key={s.id}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${i === 0 ? 'gold-gradient text-black' : i === 1 ? 'bg-gray-400 text-black' : 'bg-amber-700 text-white'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{s.userName}</p>
                  <p className="text-sm text-[#9CA3AF]">{s.title} — {s.votes} votes</p>
                </div>
              </div>
            </Card>
          ))}
          {subs.length === 0 && <p className="text-center text-[#9CA3AF] py-8">No submissions found</p>}
        </div>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => navigate(`/challenges/${id}`)}>Back to Challenge</Button>
        </div>
      </Section></Container>
    );
  }

  return (
    <Container><Section>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">{challenge.title}</h1>
        <Badge variant="gold">Completed</Badge>
      </div>
      <div className="space-y-4">
        {winnerRecord.winners.map((w, i) => (
          <Card key={i} className={i === 0 ? 'border-yellow-600/30 bg-yellow-600/5' : ''}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${i === 0 ? 'gold-gradient text-black' : i === 1 ? 'bg-gray-400 text-black' : 'bg-amber-700 text-white'}`}>
                {w.position}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{w.name}</p>
                <p className="text-sm text-[#9CA3AF]">{w.votes} votes</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">${w.prizeAmount}</p>
                <Badge variant={w.claimStatus === 'paid' ? 'success' : w.claimStatus === 'pending' ? 'warning' : 'default'}>
                  {w.claimStatus === 'paid' ? 'Paid' : w.claimStatus === 'pending' ? 'Pending' : 'Unclaimed'}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" onClick={() => navigate(`/challenges/${id}`)}>Back to Challenge</Button>
        <Button variant="secondary" onClick={() => navigate('/winners')}>All Winners</Button>
      </div>
    </Section></Container>
  );
}
