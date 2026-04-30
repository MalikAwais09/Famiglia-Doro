import { useState } from 'react';
import { Container } from '@/layout/Container';
import { Section } from '@/layout/Section';
import { PageHeader } from '@/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MOCK_TOURNAMENT } from '@/lib/mock/data';
import { motion } from 'framer-motion';

const TABS = ['Single Elimination', 'Double Elimination', 'Round Robin'];

export function Tournaments() {
  const [tab, setTab] = useState('Single Elimination');
  const tour = MOCK_TOURNAMENT;

  return (
    <Container><Section>
      <PageHeader title="Tournaments" subtitle="Compete in bracket-style competitions" />
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${tab === t ? 'gold-gradient text-black font-semibold border-transparent' : 'border-[rgba(255,255,255,0.08)] text-[#9CA3AF]'}`}>
            {t}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{tour.name}</h2>
            <Badge variant="info">{tour.status}</Badge>
          </div>

          {tab === 'Single Elimination' && (
            <div className="overflow-x-auto">
              <div className="flex gap-8 min-w-max">
                {tour.rounds.map(round => (
                  <div key={round.round} className="flex flex-col gap-4">
                    <p className="text-xs font-semibold text-[#9CA3AF] mb-2">{round.label}</p>
                    {round.matches.map(match => (
                      <div key={match.id} className="bg-[#161618] border border-[rgba(255,255,255,0.08)] rounded-md p-3 w-48">
                        <div className={`flex items-center justify-between text-sm ${match.winner === match.participant1 ? 'font-semibold text-yellow-500' : 'text-[#9CA3AF]'}`}>
                          <span className="truncate">{match.participant1}</span>
                          <span>{match.score1}</span>
                        </div>
                        <div className="h-px bg-[rgba(255,255,255,0.08)] my-1" />
                        <div className={`flex items-center justify-between text-sm ${match.winner === match.participant2 ? 'font-semibold text-yellow-500' : 'text-[#9CA3AF]'}`}>
                          <span className="truncate">{match.participant2}</span>
                          <span>{match.score2}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
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
                        <div key={match.id} className="bg-[#161618] border border-emerald-500/20 rounded-md p-3 w-44 mb-3">
                          <div className={`text-xs ${match.winner === match.participant1 ? 'text-emerald-400 font-medium' : 'text-[#9CA3AF]'}`}>{match.participant1} — {match.score1}</div>
                          <div className={`text-xs mt-1 ${match.winner === match.participant2 ? 'text-emerald-400 font-medium' : 'text-[#9CA3AF]'}`}>{match.participant2} — {match.score2}</div>
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
                    <div key={round.round}>
                      <p className="text-xs text-[#9CA3AF] mb-2">{round.label} (L)</p>
                      {round.matches.map(match => (
                        <div key={match.id} className="bg-[#161618] border border-red-500/20 rounded-md p-3 w-44 mb-3">
                          <div className={`text-xs ${match.winner === match.participant1 ? 'text-red-400 font-medium' : 'text-[#9CA3AF]'}`}>{match.participant1} — {match.score1}</div>
                          <div className={`text-xs mt-1 ${match.winner === match.participant2 ? 'text-red-400 font-medium' : 'text-[#9CA3AF]'}`}>{match.participant2} — {match.score2}</div>
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.08)]">
                    <th className="text-left text-xs text-[#9CA3AF] px-3 py-2">Player</th>
                    {tour.participants.map(p => <th key={p} className="text-center text-xs text-[#9CA3AF] px-2 py-2">{p.split(' ')[0]}</th>)}
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
                      <td className="text-center px-3 py-2 text-sm font-bold gold-text">{tour.participants.length - 1 - Math.floor(i / 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </Section></Container>
  );
}
