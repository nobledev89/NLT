import { z } from 'zod';

/** Shared: a honeypot field that must stay empty (bots fill it in). */
export const honeypot = z.string().max(0, 'Spam detected').optional().or(z.literal(''));

export const emailSchema = z.string().trim().email('Enter a valid email');
export const phoneSchema = z
  .string()
  .trim()
  .max(40)
  .regex(/^[0-9+\-()\s]*$/, 'Enter a valid phone number')
  .optional()
  .or(z.literal(''));

// ----- auth ----------------------------------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(120),
  email: emailSchema,
  password: z.string().min(8, 'Use at least 8 characters').max(72),
});

export const resetRequestSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Use at least 8 characters').max(72),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: phoneSchema,
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
});

// ----- comments ------------------------------------------------------

export const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(2, 'Say a little more').max(4000),
  website: honeypot, // honeypot
});

// ----- pledge --------------------------------------------------------

export const pledgeSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  email: emailSchema,
  phone: phoneSchema,
  amount: z.coerce.number().positive('Enter an amount greater than zero').max(100_000_000),
  campaignId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  referenceNumber: z.string().trim().max(120).optional().or(z.literal('')),
  consent: z.literal(true, { errorMap: () => ({ message: 'Please accept the privacy notice' }) }),
  website: honeypot,
});

// ----- RSVP ----------------------------------------------------------

export const rsvpSchema = z.object({
  eventId: z.string().uuid(),
  guestName: z.string().trim().min(2, 'Enter your name').max(120).optional().or(z.literal('')),
  guestEmail: emailSchema.optional().or(z.literal('')),
  guestPhone: phoneSchema,
  partySize: z.coerce.number().int().min(1).max(20).default(1),
  website: honeypot,
});

// ----- seat booking --------------------------------------------------

export const seatBookingSchema = z.object({
  eventId: z.string().uuid(),
  // comma-separated seat labels from the picker, e.g. "12-A,13-A"
  seats: z
    .string()
    .trim()
    .min(1, 'Please select at least one seat')
    .transform((s) => s.split(',').map((v) => v.trim()).filter(Boolean))
    .pipe(
      z
        .array(z.string().max(12))
        .min(1, 'Please select at least one seat')
        .max(10, 'You can reserve up to 10 seats at once')
    ),
  guestName: z.string().trim().min(2, 'Enter your name').max(120).optional().or(z.literal('')),
  guestEmail: emailSchema.optional().or(z.literal('')),
  guestPhone: phoneSchema,
  website: honeypot,
});

// ----- dynamic connection form --------------------------------------

/**
 * Connection-form submissions are validated dynamically against their field
 * definitions at submit time (see actions). This base just enforces the
 * envelope + honeypot.
 */
export const connectionSubmissionBase = z.object({
  formId: z.string().uuid(),
  website: honeypot,
});

// ----- admin content schemas ----------------------------------------

const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens');

export const postInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  excerpt: z.string().trim().max(400).optional().or(z.literal('')),
  contentHtml: z.string().default(''),
  featuredImageUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']),
  commentsEnabled: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  scheduledFor: z.string().optional().or(z.literal('')),
  categoryIds: z.array(z.string().uuid()).default([]),
  seoTitle: z.string().trim().max(70).optional().or(z.literal('')),
  seoDescription: z.string().trim().max(180).optional().or(z.literal('')),
});

export const eventInputSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug,
  descriptionHtml: z.string().optional().or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().optional().or(z.literal('')),
  venue: z.string().trim().max(200).optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  mapsUrl: z.string().url().optional().or(z.literal('')),
  organizer: z.string().trim().max(120).optional().or(z.literal('')),
  contactEmail: emailSchema.optional().or(z.literal('')),
  isPublic: z.boolean().default(true),
  rsvpEnabled: z.boolean().default(false),
  guestRsvpAllowed: z.boolean().default(false),
  rsvpCapacity: z.coerce.number().int().positive().optional().nullable(),
  rsvpDeadline: z.string().optional().or(z.literal('')),
  seatingEnabled: z.boolean().default(false),
  category: z.string().trim().max(60).optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
  status: z.enum(['draft', 'published']),
});

export const ministryInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  shortDescription: z.string().trim().max(280).optional().or(z.literal('')),
  longDescriptionHtml: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  leaderName: z.string().trim().max(120).optional().or(z.literal('')),
  leaderContact: z.string().trim().max(160).optional().or(z.literal('')),
  meetingSchedule: z.string().trim().max(160).optional().or(z.literal('')),
  location: z.string().trim().max(160).optional().or(z.literal('')),
  externalUrl: z.string().url().optional().or(z.literal('')),
  published: z.boolean().default(true),
});

export const campaignInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug,
  descriptionHtml: z.string().optional().or(z.literal('')),
  goalAmount: z.coerce.number().positive().optional().nullable(),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().default(false),
});

export const merchInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug,
  descriptionHtml: z.string().optional().or(z.literal('')),
  priceDisplay: z.string().trim().max(80).optional().or(z.literal('')),
  suggestedDonation: z.coerce.number().nonnegative().optional().nullable(),
  category: z.string().trim().max(60).optional().or(z.literal('')),
  availabilityLabel: z.string().trim().max(60).optional().or(z.literal('')),
  externalUrl: z.string().url().optional().or(z.literal('')),
  contactToOrder: z.boolean().default(true),
  status: z.enum(['draft', 'published']),
});

export type PostInput = z.infer<typeof postInputSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
export type MinistryInput = z.infer<typeof ministryInputSchema>;
export type CampaignInput = z.infer<typeof campaignInputSchema>;
export type MerchInput = z.infer<typeof merchInputSchema>;
