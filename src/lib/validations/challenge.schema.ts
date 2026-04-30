import { z } from 'zod';

export const ChallengeStep1Schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  category: z.string().min(1, 'Select a category'),
  customCategory: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
});

export const ChallengeStep2Schema = z.object({
  format: z.enum(['1v1', 'group', 'tournament']),
  scoringSystem: z.enum(['1_rounder', 'best_of_3', 'best_of_5', 'best_of_7', 'points_based']),
  hasTimeLimit: z.boolean(),
  timeLimitHours: z.number().min(0).optional(),
  timeLimitMinutes: z.number().min(0).optional(),
  hasUploadTimeLimit: z.boolean(),
  uploadTimeLimitMinutes: z.number().min(0).optional(),
  has2StepFormat: z.boolean(),
  judge2StepMethod: z.enum(['community_vote', 'creator_decision', 'hybrid']).optional(),
});

export const ChallengeStep3Schema = z.object({
  prizeType: z.enum(['cash', 'digital', 'physical', 'bragging_rights']),
  prizeDescription: z.string().optional(),
  entryFee: z.number().min(0),
  sponsorshipEnabled: z.boolean(),
  locationFormat: z.enum(['virtual', 'in_person']),
});

export const ChallengeStep4Schema = z.object({
  registrationDeadline: z.string().min(1, 'Registration deadline required'),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
}).refine(
  data => !data.registrationDeadline || !data.startDate || data.registrationDeadline < data.startDate,
  { message: 'Registration deadline must be before start date', path: ['registrationDeadline'] }
).refine(
  data => !data.startDate || !data.endDate || data.startDate < data.endDate,
  { message: 'Start date must be before end date', path: ['startDate'] }
);

export const ChallengeStep5Schema = z.object({
  selectedRules: z.array(z.string()).min(1, 'Select at least one rule'),
  customRules: z.string().optional(),
  hasAgeRestriction: z.boolean(),
  ageRestrictionMin: z.number().min(0).max(120).optional(),
  ageRestrictionMax: z.number().min(0).max(120).optional(),
  isPrivate: z.boolean(),
  inviteCode: z.string().optional(),
  privateVisibility: z.enum(['invite_only', 'hidden', 'unlisted']).optional(),
});

export const SubmissionSchema = z.object({
  type: z.enum(['video', 'image', 'text', 'link', 'file']),
  title: z.string().min(1, 'Title required').max(100),
  description: z.string().max(500).optional().default(''),
  content: z.string().min(1, 'Content required'),
});

export type ChallengeStep1Data = z.infer<typeof ChallengeStep1Schema>;
export type ChallengeStep2Data = z.infer<typeof ChallengeStep2Schema>;
export type ChallengeStep3Data = z.infer<typeof ChallengeStep3Schema>;
export type ChallengeStep4Data = z.infer<typeof ChallengeStep4Schema>;
export type ChallengeStep5Data = z.infer<typeof ChallengeStep5Schema>;
export type SubmissionFormData = z.infer<typeof SubmissionSchema>;
