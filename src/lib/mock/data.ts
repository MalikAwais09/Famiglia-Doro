import type { User, Challenge, Submission, LiveEvent, TournamentData, Notification, WalletTransaction, WinnerRecord, PricingTier, Entry } from '@/types';

export const MOCK_USERS: User[] = [
  { id: 'user_1', name: 'Marcus Gold', email: 'marcus@example.com', role: 'creatorPro', points: 12450, wins: 23, challenges: 67, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus' },
  { id: 'user_2', name: 'Sofia Rivera', email: 'sofia@example.com', role: 'eliteHost', points: 11200, wins: 19, challenges: 54, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia' },
  { id: 'user_3', name: 'James Chen', email: 'james@example.com', role: 'free', points: 8900, wins: 12, challenges: 45, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
  { id: 'user_4', name: 'Amara Johnson', email: 'amara@example.com', role: 'creatorPro', points: 8700, wins: 15, challenges: 39, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara' },
  { id: 'user_5', name: 'Leo Martinez', email: 'leo@example.com', role: 'free', points: 7800, wins: 9, challenges: 34, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
  { id: 'user_6', name: 'Nina Petrova', email: 'nina@example.com', role: 'free', points: 7350, wins: 11, challenges: 42, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina' },
  { id: 'user_7', name: 'David Kim', email: 'david@example.com', role: 'creatorPro', points: 6900, wins: 8, challenges: 28, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
  { id: 'user_8', name: 'Elena Vasquez', email: 'elena@example.com', role: 'free', points: 6500, wins: 7, challenges: 31, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena' },
  { id: 'user_9', name: 'Ryan Thompson', email: 'ryan@example.com', role: 'free', points: 6100, wins: 6, challenges: 25, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan' },
  { id: 'user_10', name: 'Zara Ahmed', email: 'zara@example.com', role: 'free', points: 5800, wins: 5, challenges: 22, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara' },
  { id: 'user_11', name: 'Carlos Diaz', email: 'carlos@example.com', role: 'creatorPro', points: 5400, wins: 10, challenges: 38, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos' },
  { id: 'user_12', name: 'Maya Singh', email: 'maya@example.com', role: 'free', points: 5100, wins: 4, challenges: 19, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya' },
  { id: 'user_13', name: 'Tyler Brooks', email: 'tyler@example.com', role: 'free', points: 4800, wins: 3, challenges: 17, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tyler' },
  { id: 'user_14', name: 'Lily Zhang', email: 'lily@example.com', role: 'free', points: 4500, wins: 6, challenges: 29, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily' },
  { id: 'user_15', name: 'Omar Hassan', email: 'omar@example.com', role: 'free', points: 4200, wins: 4, challenges: 21, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar' },
  { id: 'user_16', name: 'Chloe Evans', email: 'chloe@example.com', role: 'free', points: 3900, wins: 3, challenges: 15, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe' },
  { id: 'user_17', name: 'Andre Williams', email: 'andre@example.com', role: 'free', points: 3600, wins: 5, challenges: 24, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andre' },
  { id: 'user_18', name: 'Isabella Cruz', email: 'isabella@example.com', role: 'free', points: 3300, wins: 2, challenges: 13, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella' },
  { id: 'user_19', name: 'Kai Nakamura', email: 'kai@example.com', role: 'free', points: 3000, wins: 4, challenges: 20, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai' },
  { id: 'user_20', name: 'Ava Mitchell', email: 'ava@example.com', role: 'free', points: 2700, wins: 2, challenges: 11, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava' },
  { id: 'user_21', name: 'Diego Flores', email: 'diego@example.com', role: 'free', points: 2400, wins: 3, challenges: 16, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego' },
  { id: 'user_22', name: 'Hannah Lee', email: 'hannah@example.com', role: 'free', points: 2100, wins: 1, challenges: 9, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah' },
  { id: 'user_23', name: 'Felix Braun', email: 'felix@example.com', role: 'free', points: 1800, wins: 2, challenges: 12, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'user_24', name: 'Priya Sharma', email: 'priya@example.com', role: 'free', points: 1500, wins: 1, challenges: 8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { id: 'user_25', name: 'Lucas Moreau', email: 'lucas@example.com', role: 'free', points: 1200, wins: 1, challenges: 7, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
  { id: 'user_26', name: 'Sara Okafor', email: 'sara@example.com', role: 'free', points: 900, wins: 0, challenges: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara' },
  { id: 'user_27', name: 'Tom Anderson', email: 'tom@example.com', role: 'free', points: 600, wins: 0, challenges: 3, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
  { id: 'user_28', name: 'Yuki Tanaka', email: 'yuki@example.com', role: 'free', points: 400, wins: 0, challenges: 2, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki' },
  { id: 'user_29', name: 'Nadia Volkov', email: 'nadia@example.com', role: 'free', points: 200, wins: 0, challenges: 1, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia' },
  { id: 'user_30', name: 'Ben Cooper', email: 'ben@example.com', role: 'free', points: 100, wins: 0, challenges: 1, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben' },
];

const base = new Date();
const d = (days: number) => new Date(base.getTime() + days * 86400000).toISOString();
const p = (days: number) => new Date(base.getTime() - days * 86400000).toISOString();

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'ch_1', title: 'Street Photography Showdown', description: 'Capture the essence of urban life in a single photograph. Show us the streets through your lens with raw, unfiltered perspective.', category: 'Photography',
    coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600', format: '1v1', phase: 'entry_open', prizeType: 'cash', prizeDescription: '$500 Cash Prize',
    entryFee: 10, maxParticipants: 100, currentParticipants: 67, createdBy: 'user_1', createdByName: 'Marcus Gold',
    registrationDeadline: d(3), startDate: d(5), endDate: d(10), votingEndDate: d(13), resultsDate: d(15),
    rules: ['Standard platform rules apply.', 'No AI-generated images.', 'Must be original work.', 'Late submissions will be disqualified.'],
    scoringSystem: 'bo3', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'live', createdAt: p(7),
  },
  {
    id: 'ch_2', title: 'Beat Battle Championship', description: 'Produce an original beat in 48 hours. Producers compete head-to-head in this bracket-style tournament.', category: 'Music',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600', format: 'tournament', phase: 'voting', prizeType: 'cash', prizeDescription: '$1,000 Grand Prize',
    entryFee: 25, maxParticipants: 32, currentParticipants: 32, createdBy: 'user_2', createdByName: 'Sofia Rivera',
    registrationDeadline: p(2), startDate: p(1), endDate: d(1), votingEndDate: d(3), resultsDate: d(5),
    rules: ['Standard platform rules apply.', 'Must use original sounds only.', 'No toxic or abusive behavior allowed.', 'All decisions by vote count are final.'],
    scoringSystem: 'bo3', isPrivate: false, sponsorshipEnabled: true, hasTwoStep: false, locationFormat: 'virtual', status: 'live', createdAt: p(14),
  },
  {
    id: 'ch_3', title: 'Comedy Short Film Festival', description: 'Create a 3-minute comedy short film. Make us laugh, make us think, make us vote for you.', category: 'Film & Video',
    coverImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600', format: 'group', phase: 'entry_open', prizeType: 'digital', prizeDescription: 'Pro Camera Kit + Software License',
    entryFee: 15, maxParticipants: 50, currentParticipants: 28, createdBy: 'user_4', createdByName: 'Amara Johnson',
    registrationDeadline: d(5), startDate: d(7), endDate: d(14), votingEndDate: d(17), resultsDate: d(19),
    rules: ['Standard platform rules apply.', 'Maximum 3 minutes runtime.', 'No copyrighted music.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'points', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: true, locationFormat: 'virtual', status: 'live', createdAt: p(5),
  },
  {
    id: 'ch_4', title: 'Digital Art Masters', description: 'Create a digital artwork on the theme "Future Cities". All styles welcome - from photorealism to abstract.', category: 'Art & Design',
    coverImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600', format: 'group', phase: 'upcoming', prizeType: 'cash', prizeDescription: '$750 Cash Prize',
    entryFee: 20, maxParticipants: 80, currentParticipants: 12, createdBy: 'user_7', createdByName: 'David Kim',
    registrationDeadline: d(7), startDate: d(10), endDate: d(20), votingEndDate: d(23), resultsDate: d(25),
    rules: ['Standard platform rules apply.', 'Theme: Future Cities.', 'Any digital medium accepted.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'bo5', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'upcoming', createdAt: p(3),
  },
  {
    id: 'ch_5', title: 'Freestyle Rap Battle', description: '1v1 rap battles. Two emcees enter, one leaves victorious. Bars over beats, pure skill.', category: 'Music',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600', format: '1v1', phase: 'completed', prizeType: 'cash', prizeDescription: '$300 Cash Prize',
    entryFee: 5, maxParticipants: 16, currentParticipants: 16, createdBy: 'user_1', createdByName: 'Marcus Gold',
    registrationDeadline: p(20), startDate: p(18), endDate: p(15), votingEndDate: p(12), resultsDate: p(10),
    rules: ['Standard platform rules apply.', 'Original verses only.', 'No toxic or abusive behavior allowed.', 'All decisions by vote count are final.'],
    scoringSystem: 'bo3', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'ended', createdAt: p(30),
  },
  {
    id: 'ch_6', title: 'Fitness Transformation Challenge', description: '30-day fitness journey. Document your progress and inspire the community with your dedication.', category: 'Fitness',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', format: 'group', phase: 'entry_open', prizeType: 'physical', prizeDescription: 'Premium Fitness Equipment Package',
    entryFee: 0, maxParticipants: 200, currentParticipants: 89, createdBy: 'user_11', createdByName: 'Carlos Diaz',
    registrationDeadline: d(2), startDate: d(4), endDate: d(34), votingEndDate: d(37), resultsDate: d(39),
    rules: ['Standard platform rules apply.', 'Document progress weekly.', 'No performance-enhancing substances.', 'Must be 18 or older.'],
    scoringSystem: 'points', isPrivate: false, sponsorshipEnabled: true, hasTwoStep: false, locationFormat: 'virtual', status: 'live', createdAt: p(10),
  },
  {
    id: 'ch_7', title: 'Coding Challenge: AI Innovation', description: 'Build an innovative AI-powered application in 72 hours. Impress our community with your technical skills.', category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600', format: 'group', phase: 'closed', prizeType: 'cash', prizeDescription: '$2,000 Cash Prize',
    entryFee: 30, maxParticipants: 40, currentParticipants: 40, createdBy: 'user_2', createdByName: 'Sofia Rivera',
    registrationDeadline: p(1), startDate: d(1), endDate: d(4), votingEndDate: d(7), resultsDate: d(9),
    rules: ['Standard platform rules apply.', '72-hour build time.', 'Open source required.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'bo5', isPrivate: false, sponsorshipEnabled: true, hasTwoStep: true, locationFormat: 'virtual', status: 'live', createdAt: p(8),
  },
  {
    id: 'ch_8', title: 'Creative Writing: Short Stories', description: 'Write a compelling short story under 2,000 words. Theme: "The Last Message".', category: 'Writing',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600', format: 'group', phase: 'completed', prizeType: 'digital', prizeDescription: 'E-Reader + Publishing Deal',
    entryFee: 5, maxParticipants: 60, currentParticipants: 45, createdBy: 'user_6', createdByName: 'Nina Petrova',
    registrationDeadline: p(25), startDate: p(23), endDate: p(18), votingEndDate: p(15), resultsDate: p(13),
    rules: ['Standard platform rules apply.', 'Max 2,000 words.', 'Theme: The Last Message.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'points', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'ended', createdAt: p(35),
  },
  {
    id: 'ch_9', title: 'Dance Battle Royale', description: 'Show your best moves in this 1v1 dance battle. All styles welcome - hip-hop, contemporary, ballet, and more.', category: 'Dance',
    coverImage: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=600', format: '1v1', phase: 'entry_open', prizeType: 'cash', prizeDescription: '$400 Cash Prize',
    entryFee: 8, maxParticipants: 24, currentParticipants: 14, createdBy: 'user_4', createdByName: 'Amara Johnson',
    registrationDeadline: d(4), startDate: d(6), endDate: d(9), votingEndDate: d(11), resultsDate: d(13),
    rules: ['Standard platform rules apply.', 'Video submissions only.', '30-90 seconds per routine.', 'No toxic or abusive behavior allowed.'],
    scoringSystem: 'bo3', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'live', createdAt: p(6),
  },
  {
    id: 'ch_10', title: 'Gaming Tournament: Strategy Masters', description: 'Compete in a round-robin strategy gaming tournament. Show your tactical brilliance.', category: 'Gaming',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600', format: 'tournament', phase: 'upcoming', prizeType: 'cash', prizeDescription: '$1,500 Prize Pool',
    entryFee: 15, maxParticipants: 8, currentParticipants: 5, createdBy: 'user_7', createdByName: 'David Kim',
    registrationDeadline: d(6), startDate: d(8), endDate: d(15), votingEndDate: d(17), resultsDate: d(19),
    rules: ['Standard platform rules apply.', 'Tournament bracket format.', 'No cheating or exploits.', 'All decisions by judges are final.'],
    scoringSystem: 'bo5', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'upcoming', createdAt: p(4),
  },
  {
    id: 'ch_11', title: 'Cooking Challenge: Global Flavors', description: 'Prepare a dish representing your cultural heritage. Share the recipe and the story behind it.', category: 'Cooking',
    coverImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', format: 'group', phase: 'completed', prizeType: 'physical', prizeDescription: 'Premium Cookware Set',
    entryFee: 0, maxParticipants: 100, currentParticipants: 73, createdBy: 'user_11', createdByName: 'Carlos Diaz',
    registrationDeadline: p(30), startDate: p(28), endDate: p(22), votingEndDate: p(19), resultsDate: p(17),
    rules: ['Standard platform rules apply.', 'Must include full recipe.', 'Video or photo proof required.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'points', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'ended', createdAt: p(40),
  },
  {
    id: 'ch_12', title: 'Fashion Design Sprint', description: 'Design and showcase an outfit in 48 hours. Sketch, create, and present your fashion vision.', category: 'Fashion',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', format: 'group', phase: 'voting', prizeType: 'cash', prizeDescription: '$600 Cash Prize',
    entryFee: 12, maxParticipants: 30, currentParticipants: 30, createdBy: 'user_1', createdByName: 'Marcus Gold',
    registrationDeadline: p(5), startDate: p(3), endDate: p(1), votingEndDate: d(2), resultsDate: d(4),
    rules: ['Standard platform rules apply.', 'Original designs only.', 'Photo evidence required.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'bo3', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'live', createdAt: p(12),
  },
  {
    id: 'ch_13', title: 'Photography: Golden Hour', description: 'Submit your best golden hour photograph. Any subject, any location - just capture that magical light.', category: 'Photography',
    coverImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600', format: 'group', phase: 'entry_open', prizeType: 'bragging', prizeDescription: 'Leaderboard Ranking',
    entryFee: 0, maxParticipants: 500, currentParticipants: 156, createdBy: 'user_3', createdByName: 'James Chen',
    registrationDeadline: d(10), startDate: d(12), endDate: d(22), votingEndDate: d(25), resultsDate: d(27),
    rules: ['Standard platform rules apply.', 'Must be taken during golden hour.', 'No AI-enhanced images.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'points', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'live', createdAt: p(2),
  },
  {
    id: 'ch_14', title: 'VIP Comedy Night', description: 'An exclusive private comedy competition. Invitation only. Bring your best 5-minute set.', category: 'Comedy',
    coverImage: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600', format: '1v1', phase: 'upcoming', prizeType: 'cash', prizeDescription: '$800 Cash Prize',
    entryFee: 50, maxParticipants: 8, currentParticipants: 3, createdBy: 'user_2', createdByName: 'Sofia Rivera',
    registrationDeadline: d(8), startDate: d(10), endDate: d(12), votingEndDate: d(14), resultsDate: d(16),
    rules: ['Standard platform rules apply.', 'VIP invite only.', '5-minute maximum set.', 'No toxic or abusive behavior allowed.'],
    scoringSystem: 'bo3', isPrivate: true, inviteCode: 'VIP2026', visibility: 'invite_only', sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'upcoming', createdAt: p(1),
  },
  {
    id: 'ch_15', title: 'Education Content Creator', description: 'Create an educational video that teaches a complex topic in under 10 minutes. Make learning engaging.', category: 'Education',
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600', format: 'group', phase: 'entry_open', prizeType: 'digital', prizeDescription: 'Course Platform Annual Subscription',
    entryFee: 0, maxParticipants: 80, currentParticipants: 34, createdBy: 'user_6', createdByName: 'Nina Petrova',
    registrationDeadline: d(6), startDate: d(8), endDate: d(18), votingEndDate: d(21), resultsDate: d(23),
    rules: ['Standard platform rules apply.', 'Under 10 minutes.', 'Must be educational.', 'No plagiarism or unauthorized content.'],
    scoringSystem: 'points', isPrivate: false, sponsorshipEnabled: false, hasTwoStep: false, locationFormat: 'virtual', status: 'live', createdAt: p(4),
  },
];

export const MOCK_SUBMISSIONS: Submission[] = [
  // ch_5 - Freestyle Rap Battle (completed)
  { id: 'sub_1', challengeId: 'ch_5', userId: 'user_3', userName: 'James Chen', userAvatar: MOCK_USERS[2].avatar, type: 'video', title: 'Midnight Freestyle', description: 'Bars over beats, pure flow', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', votes: 234, submittedAt: p(16) },
  { id: 'sub_2', challengeId: 'ch_5', userId: 'user_5', userName: 'Leo Martinez', userAvatar: MOCK_USERS[4].avatar, type: 'video', title: 'Street Cypher Vol. 2', description: 'Raw talent from the block', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', votes: 189, submittedAt: p(16) },
  { id: 'sub_3', challengeId: 'ch_5', userId: 'user_8', userName: 'Elena Vasquez', userAvatar: MOCK_USERS[7].avatar, type: 'video', title: 'Flow State', description: 'Deep in the zone', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', votes: 156, submittedAt: p(15) },
  { id: 'sub_4', challengeId: 'ch_5', userId: 'user_9', userName: 'Ryan Thompson', userAvatar: MOCK_USERS[8].avatar, type: 'video', title: 'Real Talk', description: 'No filter, just truth', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', votes: 98, submittedAt: p(15) },
  // ch_8 - Creative Writing (completed)
  { id: 'sub_5', challengeId: 'ch_8', userId: 'user_10', userName: 'Zara Ahmed', userAvatar: MOCK_USERS[9].avatar, type: 'text', title: 'The Last Transmission', description: 'A story about final words', content: 'The screen flickered one last time. She typed the words she had been holding back for years: "I always loved you." The signal reached the edge of the atmosphere and dissolved into static. Somewhere, light-years away, a receiver hummed with the echo of a message that would never be answered.', votes: 312, submittedAt: p(19) },
  { id: 'sub_6', challengeId: 'ch_8', userId: 'user_12', userName: 'Maya Singh', userAvatar: MOCK_USERS[11].avatar, type: 'text', title: 'Signal Lost', description: 'When communication fails', content: 'Dear Future, I write to you from a time when messages still meant something. Every word carried weight. Every pause held meaning. This is my last message to you: remember us as we were, not as we became.', votes: 267, submittedAt: p(19) },
  { id: 'sub_7', challengeId: 'ch_8', userId: 'user_14', userName: 'Lily Zhang', userAvatar: MOCK_USERS[13].avatar, type: 'text', title: 'Letters Never Sent', description: 'The weight of unsent words', content: 'She found the draft folder full of messages she had written but never sent. Each one a fragment of courage that had faltered at the send button. The last message was dated today. It said simply: "Goodbye."', votes: 201, submittedAt: p(18) },
  // ch_11 - Cooking Challenge (completed)
  { id: 'sub_8', challengeId: 'ch_11', userId: 'user_15', userName: 'Omar Hassan', userAvatar: MOCK_USERS[14].avatar, type: 'image', title: 'Grandma\'s Lamb Tagine', description: 'A family recipe passed down three generations', content: 'https://images.unsplash.com/photo-1511690743698-d9d18f7e20f1?w=600', votes: 289, submittedAt: p(23) },
  { id: 'sub_9', challengeId: 'ch_11', userId: 'user_17', userName: 'Andre Williams', userAvatar: MOCK_USERS[16].avatar, type: 'image', title: 'Southern Gumbo', description: 'Cajun heritage in a bowl', content: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600', votes: 245, submittedAt: p(23) },
  { id: 'sub_10', challengeId: 'ch_11', userId: 'user_19', userName: 'Kai Nakamura', userAvatar: MOCK_USERS[18].avatar, type: 'image', title: 'Ramen From Scratch', description: '36-hour broth, handmade noodles', content: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', votes: 198, submittedAt: p(22) },
  // ch_12 - Fashion Design (voting)
  { id: 'sub_11', challengeId: 'ch_12', userId: 'user_1', userName: 'Marcus Gold', userAvatar: MOCK_USERS[0].avatar, type: 'image', title: 'Urban Luxe Collection', description: 'Street meets high fashion', content: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600', votes: 178, submittedAt: p(2) },
  { id: 'sub_12', challengeId: 'ch_12', userId: 'user_4', userName: 'Amara Johnson', userAvatar: MOCK_USERS[3].avatar, type: 'image', title: 'Afrofuturism Line', description: 'Future meets heritage', content: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600', votes: 156, submittedAt: p(2) },
  { id: 'sub_13', challengeId: 'ch_12', userId: 'user_6', userName: 'Nina Petrova', userAvatar: MOCK_USERS[5].avatar, type: 'image', title: 'Minimalist Elegance', description: 'Less is more', content: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600', votes: 134, submittedAt: p(1) },
  // ch_2 - Beat Battle (voting)
  { id: 'sub_14', challengeId: 'ch_2', userId: 'user_3', userName: 'James Chen', userAvatar: MOCK_USERS[2].avatar, type: 'link', title: 'Neon Dreams Beat', description: 'Synthwave inspired production', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', votes: 201, submittedAt: p(1) },
  { id: 'sub_15', challengeId: 'ch_2', userId: 'user_5', userName: 'Leo Martinez', userAvatar: MOCK_USERS[4].avatar, type: 'link', title: 'Lo-Fi Kingdom', description: 'Chill beats to compete to', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', votes: 187, submittedAt: p(1) },
  { id: 'sub_16', challengeId: 'ch_2', userId: 'user_8', userName: 'Elena Vasquez', userAvatar: MOCK_USERS[7].avatar, type: 'link', title: 'Bass Drop Symphony', description: 'Heavy bass, heavy vibes', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', votes: 165, submittedAt: p(0) },
];

export const MOCK_LEADERBOARD = MOCK_USERS.slice(0, 12).map((u, i) => ({ ...u, rank: i + 1 }));

export const MOCK_WINNERS: WinnerRecord[] = [
  {
    challengeId: 'ch_5', challengeTitle: 'Freestyle Rap Battle',
    announcedAt: p(10),
    winners: [
      { userId: 'user_3', name: 'James Chen', avatar: MOCK_USERS[2].avatar, position: 1, votes: 234, prizeAmount: 150, claimStatus: 'paid', verified: true },
      { userId: 'user_5', name: 'Leo Martinez', avatar: MOCK_USERS[4].avatar, position: 2, votes: 189, prizeAmount: 90, claimStatus: 'paid', verified: true },
      { userId: 'user_8', name: 'Elena Vasquez', avatar: MOCK_USERS[7].avatar, position: 3, votes: 156, prizeAmount: 60, claimStatus: 'pending', verified: false },
    ],
  },
  {
    challengeId: 'ch_8', challengeTitle: 'Creative Writing: Short Stories',
    announcedAt: p(13),
    winners: [
      { userId: 'user_10', name: 'Zara Ahmed', avatar: MOCK_USERS[9].avatar, position: 1, votes: 312, prizeAmount: 250, claimStatus: 'not_claimed', verified: false },
      { userId: 'user_12', name: 'Maya Singh', avatar: MOCK_USERS[11].avatar, position: 2, votes: 267, prizeAmount: 150, claimStatus: 'not_claimed', verified: false },
      { userId: 'user_14', name: 'Lily Zhang', avatar: MOCK_USERS[13].avatar, position: 3, votes: 201, prizeAmount: 100, claimStatus: 'not_claimed', verified: false },
    ],
  },
  {
    challengeId: 'ch_11', challengeTitle: 'Cooking Challenge: Global Flavors',
    announcedAt: p(17),
    winners: [
      { userId: 'user_15', name: 'Omar Hassan', avatar: MOCK_USERS[14].avatar, position: 1, votes: 289, prizeAmount: 250, claimStatus: 'not_claimed', verified: false },
      { userId: 'user_17', name: 'Andre Williams', avatar: MOCK_USERS[16].avatar, position: 2, votes: 245, prizeAmount: 150, claimStatus: 'not_claimed', verified: false },
      { userId: 'user_19', name: 'Kai Nakamura', avatar: MOCK_USERS[18].avatar, position: 3, votes: 198, prizeAmount: 100, claimStatus: 'not_claimed', verified: false },
    ],
  },
  {
    challengeId: 'ch_mock_1', challengeTitle: 'Spring Photography Contest',
    announcedAt: p(20),
    winners: [
      { userId: 'user_1', name: 'Marcus Gold', avatar: MOCK_USERS[0].avatar, position: 1, votes: 456, prizeAmount: 500, claimStatus: 'paid', verified: true },
      { userId: 'user_2', name: 'Sofia Rivera', avatar: MOCK_USERS[1].avatar, position: 2, votes: 389, prizeAmount: 300, claimStatus: 'paid', verified: true },
      { userId: 'user_3', name: 'James Chen', avatar: MOCK_USERS[2].avatar, position: 3, votes: 312, prizeAmount: 200, claimStatus: 'paid', verified: true },
    ],
  },
  {
    challengeId: 'ch_mock_2', challengeTitle: 'Dance Off Championship',
    announcedAt: p(25),
    winners: [
      { userId: 'user_4', name: 'Amara Johnson', avatar: MOCK_USERS[3].avatar, position: 1, votes: 523, prizeAmount: 400, claimStatus: 'paid', verified: true },
      { userId: 'user_6', name: 'Nina Petrova', avatar: MOCK_USERS[5].avatar, position: 2, votes: 445, prizeAmount: 240, claimStatus: 'pending', verified: false },
      { userId: 'user_9', name: 'Ryan Thompson', avatar: MOCK_USERS[8].avatar, position: 3, votes: 378, prizeAmount: 160, claimStatus: 'paid', verified: true },
    ],
  },
  {
    challengeId: 'ch_mock_3', challengeTitle: 'Tech Innovation Hackathon',
    announcedAt: p(15),
    winners: [
      { userId: 'user_7', name: 'David Kim', avatar: MOCK_USERS[6].avatar, position: 1, votes: 389, prizeAmount: 1000, claimStatus: 'paid', verified: true },
      { userId: 'user_11', name: 'Carlos Diaz', avatar: MOCK_USERS[10].avatar, position: 2, votes: 345, prizeAmount: 600, claimStatus: 'paid', verified: true },
      { userId: 'user_13', name: 'Tyler Brooks', avatar: MOCK_USERS[12].avatar, position: 3, votes: 298, prizeAmount: 400, claimStatus: 'paid', verified: true },
    ],
  },
  {
    challengeId: 'ch_mock_4', challengeTitle: 'Voice Acting Competition',
    announcedAt: p(22),
    winners: [
      { userId: 'user_16', name: 'Chloe Evans', avatar: MOCK_USERS[15].avatar, position: 1, votes: 412, prizeAmount: 350, claimStatus: 'not_claimed', verified: false },
      { userId: 'user_18', name: 'Isabella Cruz', avatar: MOCK_USERS[17].avatar, position: 2, votes: 367, prizeAmount: 210, claimStatus: 'not_claimed', verified: false },
      { userId: 'user_20', name: 'Ava Mitchell', avatar: MOCK_USERS[19].avatar, position: 3, votes: 289, prizeAmount: 140, claimStatus: 'not_claimed', verified: false },
    ],
  },
  {
    challengeId: 'ch_mock_5', challengeTitle: 'Graphic Design Grand Prix',
    announcedAt: p(18),
    winners: [
      { userId: 'user_21', name: 'Diego Flores', avatar: MOCK_USERS[20].avatar, position: 1, votes: 478, prizeAmount: 600, claimStatus: 'pending', verified: false },
      { userId: 'user_23', name: 'Felix Braun', avatar: MOCK_USERS[22].avatar, position: 2, votes: 401, prizeAmount: 360, claimStatus: 'pending', verified: false },
      { userId: 'user_25', name: 'Lucas Moreau', avatar: MOCK_USERS[24].avatar, position: 3, votes: 334, prizeAmount: 240, claimStatus: 'pending', verified: false },
    ],
  },
];

export const MOCK_LIVE_EVENTS: LiveEvent[] = [
  {
    id: 'live_1', title: 'Beat Battle Finals - Live', description: 'Watch the top 4 producers battle it out live for the $1,000 grand prize. Live commentary and audience reactions.',
    thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'Music', status: 'live', isPremiumOnly: false, startTime: p(0.5), endTime: d(2), viewerCount: 1243, hostName: 'Sofia Rivera',
  },
  {
    id: 'live_2', title: 'Art Battle: Live Canvas', description: 'Four artists, one canvas each, 60 minutes. Watch creativity unfold in real-time.',
    thumbnail: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'Art & Design', status: 'upcoming', isPremiumOnly: true, startTime: d(2), endTime: d(2), viewerCount: 0, hostName: 'David Kim',
  },
  {
    id: 'live_3', title: 'Coding Marathon: AI Challenge', description: '72-hour live coding marathon. Watch teams build AI solutions from scratch.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    category: 'Technology', status: 'upcoming', isPremiumOnly: false, startTime: d(5), endTime: d(8), viewerCount: 0, hostName: 'Sofia Rivera',
  },
];

export const MOCK_TOURNAMENT: TournamentData = {
  id: 'tour_1', name: 'Strategy Masters Tournament', type: 'single',
  participants: ['Marcus Gold', 'Sofia Rivera', 'James Chen', 'Amara Johnson', 'Leo Martinez', 'Nina Petrova', 'David Kim', 'Elena Vasquez'],
  status: 'In Progress',
  rounds: [
    {
      round: 1, label: 'Quarter Finals',
      matches: [
        { id: 'm1', participant1: 'Marcus Gold', participant2: 'Sofia Rivera', score1: 3, score2: 2, winner: 'Marcus Gold' },
        { id: 'm2', participant1: 'James Chen', participant2: 'Amara Johnson', score1: 1, score2: 3, winner: 'Amara Johnson' },
        { id: 'm3', participant1: 'Leo Martinez', participant2: 'Nina Petrova', score1: 3, score2: 0, winner: 'Leo Martinez' },
        { id: 'm4', participant1: 'David Kim', participant2: 'Elena Vasquez', score1: 2, score2: 3, winner: 'Elena Vasquez' },
      ],
    },
    {
      round: 2, label: 'Semi Finals',
      matches: [
        { id: 'm5', participant1: 'Marcus Gold', participant2: 'Amara Johnson', score1: 3, score2: 1, winner: 'Marcus Gold' },
        { id: 'm6', participant1: 'Leo Martinez', participant2: 'Elena Vasquez', score1: 2, score2: 3, winner: 'Elena Vasquez' },
      ],
    },
    {
      round: 3, label: 'Finals',
      matches: [
        { id: 'm7', participant1: 'Marcus Gold', participant2: 'Elena Vasquez', score1: 0, score2: 0, winner: '' },
      ],
    },
  ],
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Challenge Starting Soon', message: 'Street Photography Showdown starts in 2 days. Get ready!', type: 'info', read: false, createdAt: p(0.5), link: '/challenges/ch_1' },
  { id: 'n2', title: 'Vote Results In', message: 'Fashion Design Sprint voting has ended. Check the results!', type: 'success', read: false, createdAt: p(1), link: '/challenges/ch_12' },
  { id: 'n3', title: 'New Challenge Available', message: 'A new challenge in your favorite category has been posted.', type: 'info', read: false, createdAt: p(2), link: '/challenges' },
  { id: 'n4', title: 'DoroCoins Credited', message: '50 DoroCoins have been added to your wallet.', type: 'success', read: false, createdAt: p(3) },
  { id: 'n5', title: 'Submission Approved', message: 'Your submission to Beat Battle Championship has been approved.', type: 'success', read: true, createdAt: p(5), link: '/challenges/ch_2' },
];

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: 'wt1', type: 'credit', amount: 100, description: 'Purchased 100 DoroCoins', balance: 100, createdAt: p(10) },
  { id: 'wt2', type: 'debit', amount: 10, description: 'Entry fee: Street Photography Showdown', balance: 90, createdAt: p(7) },
  { id: 'wt3', type: 'debit', amount: 5, description: 'Paid vote: Beat Battle Championship', balance: 85, createdAt: p(3) },
  { id: 'wt4', type: 'credit', amount: 50, description: 'Reward: Contest participation bonus', balance: 135, createdAt: p(1) },
  { id: 'wt5', type: 'debit', amount: 8, description: 'Entry fee: Dance Battle Royale', balance: 127, createdAt: p(0.5) },
];

export const MOCK_PRICING_TIERS: PricingTier[] = [
  {
    name: 'Member', role: 'free', price: 'Free', priceNumber: 0,
    features: ['Join challenges', 'Vote (1 free/day)', 'Buy DoroCoins', 'View leaderboards', 'View winners', 'View tournaments'],
  },
  {
    name: 'Creator Pro', role: 'creatorPro', price: '$19.99/month', priceNumber: 19.99,
    features: ['Everything in Member', 'Create monetized challenges', 'Manage challenges', 'View earnings', 'Priority support', 'Custom branding'],
    recommended: true, badge: 'Creator Pro',
  },
  {
    name: 'Elite Host', role: 'eliteHost', price: '$49.99/month', priceNumber: 49.99,
    features: ['Everything in Creator Pro', 'Host live events', 'Premium placement', 'Advanced analytics', 'Exclusive tournaments', 'Dedicated support'],
    badge: 'Elite Host',
  },
];

export const MOCK_ENTRIES: Entry[] = [
  { id: 'entry_1', challengeId: 'ch_1', userId: 'user_current', entryFee: 10, paymentMethod: 'dorocoin', status: 'active', enteredAt: p(2), challengeTitle: 'Street Photography Showdown', challengeImage: MOCK_CHALLENGES[0].coverImage, challengeCategory: 'Photography', challengePhase: 'entry_open' },
  { id: 'entry_2', challengeId: 'ch_6', userId: 'user_current', entryFee: 0, paymentMethod: 'dorocoin', status: 'active', enteredAt: p(5), challengeTitle: 'Fitness Transformation Challenge', challengeImage: MOCK_CHALLENGES[5].coverImage, challengeCategory: 'Fitness', challengePhase: 'entry_open' },
  { id: 'entry_3', challengeId: 'ch_2', userId: 'user_current', entryFee: 25, paymentMethod: 'card', status: 'submitted', enteredAt: p(8), challengeTitle: 'Beat Battle Championship', challengeImage: MOCK_CHALLENGES[1].coverImage, challengeCategory: 'Music', challengePhase: 'voting' },
];
