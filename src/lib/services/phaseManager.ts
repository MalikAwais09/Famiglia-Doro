import type { Challenge } from '@/types';
import { computeChallengePhase, getPhaseLabel } from '@/lib/utils';

export const phaseManager = {
  getPhase: (challenge: Challenge): Challenge['phase'] => {
    return computeChallengePhase(challenge);
  },

  getPhaseSequence: (): Challenge['phase'][] => {
    return ['upcoming', 'entry_open', 'entry_closed', 'voting', 'pending_verification', 'completed'];
  },

  canTransition: (from: Challenge['phase'], to: Challenge['phase']): boolean => {
    const sequence = phaseManager.getPhaseSequence();
    return sequence.indexOf(to) > sequence.indexOf(from);
  },

  getNextPhase: (current: Challenge['phase']): Challenge['phase'] | null => {
    const sequence = phaseManager.getPhaseSequence();
    const idx = sequence.indexOf(current);
    return idx < sequence.length - 1 ? sequence[idx + 1] : null;
  },

  getPhaseLabel: (phase: Challenge['phase']): string => getPhaseLabel(phase),

  getPhaseDescription: (phase: Challenge['phase']): string => {
    const descriptions: Record<Challenge['phase'], string> = {
      upcoming: 'Challenge not yet open for registration',
      entry_open: 'Now accepting entries',
      entry_closed: 'No longer accepting entries',
      voting: 'Community voting is active',
      pending_verification: 'Winners pending verification',
      completed: 'Challenge has ended',
    };
    return descriptions[phase];
  },

  getPhaseColor: (phase: Challenge['phase']): string => {
    const colors: Record<Challenge['phase'], string> = {
      upcoming: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      entry_open: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      entry_closed: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      voting: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      pending_verification: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[phase];
  },

  allowsEntries: (phase: Challenge['phase']): boolean => phase === 'entry_open',

  allowsSubmissions: (phase: Challenge['phase']): boolean => ['entry_open', 'entry_closed'].includes(phase),

  allowsVoting: (phase: Challenge['phase']): boolean => phase === 'voting',

  isActive: (challenge: Challenge): boolean => {
    const now = Date.now();
    return now >= new Date(challenge.startDate).getTime() && now < new Date(challenge.endDate).getTime();
  },

  isUpcoming: (challenge: Challenge): boolean => Date.now() < new Date(challenge.registrationDeadline).getTime(),

  isCompleted: (challenge: Challenge): boolean => Date.now() > new Date(challenge.endDate).getTime(),
};
