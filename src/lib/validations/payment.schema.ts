import { z } from 'zod';

export const CardPaymentSchema = z.object({
  cardholderName: z.string().min(2, 'Cardholder name required'),
  cardNumber: z.string().min(13, 'Card number required').max(19),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format must be MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3-4 digits'),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
});

export const ApplePayConfirmSchema = z.object({
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
});

export const GooglePayConfirmSchema = z.object({
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
});

export type CardPaymentFormData = z.infer<typeof CardPaymentSchema>;
