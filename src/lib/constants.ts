export const APP_NAME = "Famiglia D'Oro";
export const APP_SUBTITLE = 'Challenge Suite';

export const CATEGORIES = [
  'Art & Design',
  'Music',
  'Gaming',
  'Photography',
  'Writing',
  'Dance',
  'Comedy',
  'Cooking',
  'Fitness',
  'Technology',
  'Fashion',
  'Film & Video',
  'Education',
  'Sports',
] as const;

export const SCORING_SYSTEMS = [
  { value: 'single', label: '1 Rounder' },
  { value: 'bo3', label: 'Best of 3' },
  { value: 'bo5', label: 'Best of 5' },
  { value: 'bo7', label: 'Best of 7' },
  { value: 'points', label: 'Points Based' },
] as const;

export const JUDGING_METHODS = [
  { value: 'community', label: 'Community Vote' },
  { value: 'creator', label: 'Creator Decision' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

export const LOCATION_FORMATS = [
  { value: 'virtual', label: 'Virtual / Online' },
  { value: 'inperson', label: 'In-Person Event' },
] as const;

export const SUBMISSION_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Image' },
  { value: 'text', label: 'Text' },
  { value: 'link', label: 'Link' },
  { value: 'file', label: 'File' },
] as const;

export const PREDEFINED_RULES = [
  'Standard platform rules apply.',
  'No toxic or abusive behavior allowed.',
  'Late submissions will be disqualified.',
  'No plagiarism or unauthorized content.',
  'All decisions by judges or vote count are final.',
  'Participants must be 18 or older unless age restriction is configured.',
] as const;

export const DOROCOIN_PACKAGES = [
  { coins: 100, price: 9.99, label: '100 DoroCoins', badge: null },
  { coins: 500, price: 39.99, label: '500 DoroCoins', badge: 'Best Value' },
  { coins: 1000, price: 69.99, label: '1000 DoroCoins', badge: null },
] as const;

export const AGREEMENT_TYPES = {
  master_account: 'Master Account Agreement',
  challenge_entry: 'Challenge Entry Agreement',
  paid_voting: 'Paid Voting Agreement',
  dorocoin_purchase: 'DoroCoin Purchase Agreement',
  creator: 'Creator Agreement',
  sponsor: 'Sponsor Agreement',
  live_event: 'Live Event Agreement',
  winner_claim: 'Winner Claim Agreement',
  anti_fraud: 'Anti-Fraud Acknowledgement',
  geo_compliance: 'Geo-Based Compliance',
} as const;

export const GEO_MESSAGES: Record<string, string> = {
  US: 'No purchase necessary where required by law.',
  EU: 'By continuing, you consent to data processing under GDPR.',
  CA: 'A skill-testing question may be required to claim prizes.',
  RESTRICTED: 'Certain monetization features may be limited in your region.',
};
