import { useState, useEffect, useMemo, useCallback } from 'react';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  getTournaments,
  getTournamentBracket,
  initializeTournamentBracket,
  advanceToNextRound,
  resolveBracketParticipantNames,
  type TournamentBracketData,
  type ChallengeWithTournament,
} from '@/lib/supabase/tournaments';

const TABS = ['Single Elimination', 'Double Elimination', 'Round Robin'];

type UiMatch = {
  id: string;
  participant1: string;
  participant2: string;
  score1: number;
  score2: number;
  winner: string;
};

type UiRound = { round: number; label: string; matches: UiMatch[] };

export function Tournaments() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('Single Elimination');
  const [items, setItems] = useState<ChallengeWithTournament[]>([]);
  const [bracket, setBracket] = useState<TournamentBracketData | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getTournaments();
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, []);

  const selected = items[0];
  const challenge = selected?.challenge;
  const tournament = selected?.tournament;

  useEffect(() => {
    if (!challenge?.id) {
      setBracket(null);
      return;
    }
    let cancelled = false;
    getTournamentBracket(challenge.id).then(b => {
      if (!cancelled) setBracket(b.bracket_data);
    });
    return () => {
      cancelled = true;
    };
  }, [challenge?.id]);

  useEffect(() => {
    if (!bracket) {
      setNames(new Map());
      return;
    }
    resolveBracketParticipantNames(bracket).then(setNames).catch(console.error);
  }, [bracket]);

  const tour = useMemo(() => {
    const name = challenge?.title ?? 'Tournament';
    const status = challenge?.phase ?? '—';
    const rounds: UiRound[] =
      bracket?.rounds.map(r => ({
        round: r.round,
        label: `Round ${r.round}`,
        matches: r.matches.map(m => ({
          id: m.id,
          participant1: m.participant1Id ? names.get(m.participant1Id) ?? '—' : '—',
          participant2: m.participant2Id ? names.get(m.participant2Id) ?? '—' : '—',
          score1: m.votes1,
          score2: m.votes2,
          winner: m.winnerId ? names.get(m.winnerId) ?? '' : '',
        })),
      })) ?? [];

    const pidSet = new Set<string>();
    bracket?.rounds.forEach(r =>
      r.matches.forEach(m => {
        if (m.participant1Id) pidSet.add(m.participant1Id);
        if (m.participant2Id) pidSet.add(m.participant2Id);
      }),
    );
    const participants = [...pidSet].map(id => names.get(id) ?? id);

    return { name, status, rounds, participants };
  }, [challenge?.title, challenge?.phase, bracket, names]);

  const handleInit = async () => {
    if (!challenge?.id) return;
    setActionLoading(true);
    try {
      await initializeTournamentBracket(challenge.id);
      toast.success('Bracket initialized');
      await loadList();
      const b = await getTournamentBracket(challenge.id);
      setBracket(b.bracket_data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not initialize bracket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvance = async () => {
    if (!challenge?.id) return;
    setActionLoading(true);
    try {
      const next = await advanceToNextRound(challenge.id);
      setBracket(next);
      toast.success('Round advanced');
      await loadList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not advance round');
    } finally {
      setActionLoading(false);
    }
  };

  const isCreator = profile?.id && challenge?.created_by === profile.id;

  if (loading) {
    return (
      <Container>
        <Section>
          <PageHeader title="Tournaments" subtitle="Compete in bracket-style competitions" />
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" message="Loading tournaments…" />
          </div>
        </Section>
      </Container>
    );
  }

  if (!items.length) {
    return (
      <Container>
        <Section>
          <PageHeader title="Tournaments" subtitle="Compete in bracket-style competitions" />
          <p className="text-center text-sm text-[#6B7280] py-16">No tournament challenges yet.</p>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Section>
        <PageHeader title="Tournaments" subtitle="Compete in bracket-style competitions" />
        <div className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${tab === t ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF]'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          <Card>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{tour.name}</h2>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {isCreator && !tournament && (
                  <Button size="sm" loading={actionLoading} onClick={handleInit}>
                    Initialize Bracket
                  </Button>
                )}
                {isCreator && tournament && (
                  <Button size="sm" variant="secondary" loading={actionLoading} onClick={handleAdvance}>
                    Advance Round
                  </Button>
                )}
                <Badge variant="info">{tour.status}</Badge>
              </div>
            </div>

            {tab === 'Single Elimination' && (
              <div className="overflow-x-auto">
                {tour.rounds.length === 0 ? (
                  <p className="text-sm text-[#6B7280] py-6 text-center">No bracket data yet.</p>
                ) : (
                  <div className="flex gap-8 min-w-max">
                    {tour.rounds.map(round => (
                      <div key={round.round} className="flex flex-col gap-4">
                        <p className="text-xs font-semibold text-[#9CA3AF] mb-2">{round.label}</p>
                        {round.matches.map(match => (
                          <div
                            key={match.id}
                            className="bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-md p-3 w-48"
                          >
                            <div
                              className={`flex items-center justify-between text-sm ${match.winner === match.participant1 ? 'font-semibold text-yellow-500' : 'text-[#9CA3AF]'}`}
                            >
                              <span className="truncate">{match.participant1}</span>
                              <span>{match.score1}</span>
                            </div>
                            <div className="h-px bg-[rgba(255,255,255,0.08)] my-1" />
                            <div
                              className={`flex items-center justify-between text-sm ${match.winner === match.participant2 ? 'font-semibold text-yellow-500' : 'text-[#9CA3AF]'}`}
                            >
                              <span className="truncate">{match.participant2}</span>
                              <span>{match.score2}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'Double Elimination' && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 mb-3">Winners Bracket</p>
                  <div className="flex gap-6 overflow-x-auto pb-2">
                    {tour.rounds.slice(0, 2).map(round => (
                      <div key={round.round}>
                        <p className="text-xs text-[#9CA3AF] mb-2">{round.label}</p>
                        {round.matches.map(match => (
                          <div
                            key={match.id}
                            className="bg-[#161618] border border-emerald-500/20 rounded-md p-3 w-44 mb-3"
                          >
                            <div
                              className={`text-xs ${match.winner === match.participant1 ? 'text-emerald-400 font-medium' : 'text-[#9CA3AF]'}`}
                            >
                              {match.participant1} — {match.score1}
                            </div>
                            <div
                              className={`text-xs mt-1 ${match.winner === match.participant2 ? 'text-emerald-400 font-medium' : 'text-[#9CA3AF]'}`}
                            >
                              {match.participant2} — {match.score2}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-3">Losers Bracket</p>
                  <div className="flex gap-6 overflow-x-auto pb-2">
                    {tour.rounds.slice(1).map(round => (
                      <div key={`${round.round}-L`}>
                        <p className="text-xs text-[#9CA3AF] mb-2">
                          {round.label} (L)
                        </p>
                        {round.matches.map(match => (
                          <div
                            key={`${match.id}-L`}
                            className="bg-[#161618] border border-red-500/20 rounded-md p-3 w-44 mb-3"
                          >
                            <div
                              className={`text-xs ${match.winner === match.participant1 ? 'text-red-400 font-medium' : 'text-[#9CA3AF]'}`}
                            >
                              {match.participant1} — {match.score1}
                            </div>
                            <div
                              className={`text-xs mt-1 ${match.winner === match.participant2 ? 'text-red-400 font-medium' : 'text-[#9CA3AF]'}`}
                            >
                              {match.participant2} — {match.score2}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'Round Robin' && (
              <div className="overflow-x-auto">
                {tour.participants.length === 0 ? (
                  <p className="text-sm text-[#6B7280] py-6 text-center">No participants in bracket.</p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.08)]">
                        <th className="text-left text-xs text-[#9CA3AF] px-3 py-2">Player</th>
                        {tour.participants.map(p => (
                          <th key={p} className="text-center text-xs text-[#9CA3AF] px-2 py-2">
                            {p.split(' ')[0]}
                          </th>
                        ))}
                        <th className="text-center text-xs text-[#9CA3AF] px-3 py-2">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tour.participants.map((p, i) => (
                        <tr key={p} className="border-b border-[rgba(255,255,255,0.05)]">
                          <td className="px-3 py-2 text-sm font-medium">{p}</td>
                          {tour.participants.map((_, j) => (
                            <td key={j} className="text-center px-2 py-2 text-xs text-[#9CA3AF]">
                              {i === j ? '-' : i > j ? 'W' : 'L'}
                            </td>
                          ))}
                          <td className="text-center px-3 py-2 text-sm font-bold gold-text">
                            {tour.participants.length - 1 - Math.floor(i / 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </Section>
    </Container>
  );
}
