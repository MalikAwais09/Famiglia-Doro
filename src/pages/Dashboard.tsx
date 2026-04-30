import { useNavigate } from 'react-router-dom';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { useWallet } from '@/context/WalletContext';
import { getStorage } from '@/lib/storage';
import type { Entry } from '@/types';
import { MOCK_CHALLENGES, MOCK_ENTRIES } from '@/lib/mock/data';
import { Swords, Wallet, Zap, Plus, Trophy, LayoutGrid, Crown, Radio } from 'lucide-react';

export function Dashboard() {
  const { userId } = useAuth();
  const { role, isCreator, isElite } = useRole();
  const { balance } = useWallet();
  const navigate = useNavigate();

  const entries = getStorage<Entry[]>('userEntries', MOCK_ENTRIES);
  const activeChallenges = MOCK_CHALLENGES.filter(c => c.status === 'live').length;

  const stats = [
    { icon: Swords, label: 'Challenges Joined', value: entries.length },
    { icon: Wallet, label: 'DoroCoin Balance', value: balance },
    { icon: Zap, label: 'Active Challenges', value: activeChallenges },
  ];

  const quickActions = isElite
    ? [
      { label: 'Host Live Event', icon: Radio, path: '/live-events' },
      { label: 'Create Challenge', icon: Plus, path: '/challenges/create' },
      { label: 'Browse Challenges', icon: LayoutGrid, path: '/challenges' },
      { label: 'Leaderboards', icon: Trophy, path: '/leaderboards' },
    ]
    : isCreator
    ? [
      { label: 'Create Challenge', icon: Plus, path: '/challenges/create' },
      { label: 'Manage Challenges', icon: Swords, path: '/challenges' },
      { label: 'Browse Challenges', icon: LayoutGrid, path: '/challenges' },
      { label: 'Leaderboards', icon: Trophy, path: '/leaderboards' },
    ]
    : [
      { label: 'Browse Challenges', icon: LayoutGrid, path: '/challenges' },
      { label: 'Leaderboards', icon: Trophy, path: '/leaderboards' },
      { label: 'Upgrade Plan', icon: Crown, path: '/pricing' },
    ];

  const featured = MOCK_CHALLENGES.filter(c => c.status === 'live').slice(0, 3);

  return (
    <Container>
      <Section>
        <PageHeader title="Dashboard" subtitle={`Welcome back${userId ? '' : ''}`} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <Card key={i}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/10 flex items-center justify-center"><s.icon size={20} className="text-yellow-500" /></div>
                <div>
                  <p className="text-xs text-[#9CA3AF]">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)} className="flex items-center gap-3 bg-[#1C1C1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 hover:border-[rgba(255,255,255,0.15)] transition-colors text-left">
              <a.icon size={18} className="text-yellow-500" />
              <span className="text-sm font-medium">{a.label}</span>
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-4">Featured Challenges</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {featured.map(c => (
            <Card key={c.id} onClick={() => navigate(`/challenges/${c.id}`)} className="overflow-hidden p-0">
              <img src={c.coverImage} alt="" className="w-full h-32 object-cover" loading="lazy" />
              <div className="p-4">
                <p className="font-semibold text-sm mb-1">{c.title}</p>
                <p className="text-xs text-[#9CA3AF] line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-[#9CA3AF]">{c.currentParticipants} participants</span>
                  {c.entryFee > 0 ? <span className="text-xs font-medium gold-text">{c.entryFee} DC</span> : <span className="text-xs text-emerald-400">Free</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </Container>
  );
}
