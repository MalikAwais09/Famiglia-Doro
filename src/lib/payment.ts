import { appendToList, getStorage } from './storage';
import { detectRegion } from './utils';

export function logConsent(agreementType: string) {
  const userId = localStorage.getItem('userId') || 'anonymous';
  appendToList('consent_log', {
    agreementType,
    userId,
    timestamp: new Date().toISOString(),
    version: '1.0',
    ip: 'mock',
  });
}

export function shouldShowGeo(): boolean {
  const shown = sessionStorage.getItem('fdoro_geo_shown');
  if (shown) return false;
  return true;
}

export function getGeoMessage(): { region: string; message: string } {
  const region = detectRegion();
  const messages: Record<string, string> = {
    US: 'No purchase necessary where required by law.',
    EU: 'By continuing, you consent to data processing under GDPR.',
    CA: 'A skill-testing question may be required to claim prizes.',
    RESTRICTED: 'Certain monetization features may be limited in your region.',
  };
  sessionStorage.setItem('fdoro_geo_shown', 'true');
  return { region, message: messages[region] || messages.US };
}

export function getFreeVoteKey(userId: string, challengeId: string): string {
  return `fdoro_free_vote_${userId}_${challengeId}`;
}

export function hasUsedFreeVoteToday(userId: string, challengeId: string): boolean {
  const key = getFreeVoteKey(userId, challengeId);
  const val = localStorage.getItem(key);
  const today = new Date().toISOString().split('T')[0];
  return val === today;
}

export function recordFreeVote(userId: string, challengeId: string): void {
  const key = getFreeVoteKey(userId, challengeId);
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(key, today);
}

export function getVoteCount(): number {
  return getStorage<number>('daily_vote_trackers', 0);
}

export function incrementVoteCount(): void {
  const count = getVoteCount() + 1;
  const key = 'daily_vote_trackers';
  localStorage.setItem('fdoro_' + key, JSON.stringify(count));
}
