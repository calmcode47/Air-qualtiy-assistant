import { z } from 'zod';

const ShortText = z.string().trim().min(1).max(500);

export const AdviceRecommendationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,64}$/),
  title: z.string().trim().min(1).max(100),
  action: z.string().trim().min(1).max(700),
  why: z.string().trim().min(1).max(700),
  impact: z.object({
    metric: z.string().trim().min(1).max(100).refine((value) => !/[\p{Number}%‰٪]/u.test(value), 'Impact metrics must stay qualitative.'),
    value: z.string().trim().min(1).max(160).refine((value) => !/[\p{Number}%‰٪]/u.test(value), 'Impact values must stay qualitative.'),
    unit: z.string().trim().min(1).max(160).refine((value) => !/[\p{Number}%‰٪]/u.test(value), 'Impact units must stay qualitative.'),
    confidence: z.literal('low')
  }).strict(),
  assumptions: z.array(z.string().trim().min(1).max(240)).max(5),
  effort: z.int().min(1).max(3)
}).strict();

export const AdviceResponseSchema = z.object({
  summary: ShortText,
  recommendations: z.array(AdviceRecommendationSchema).min(1).max(4),
  followUp: z.string().trim().max(400).nullable()
}).strict().refine((advice) => new Set(advice.recommendations.map((item) => item.id)).size === advice.recommendations.length, 'Recommendation IDs must be unique.');

const HouseholdSchema = z.object({
  adults: z.int().min(0).max(20).optional(),
  children: z.int().min(0).max(20).optional(),
  elderly: z.int().min(0).max(20).optional(),
  conditions: z.array(z.enum(['asthma', 'heart', 'pregnancy'])).max(3).optional(),
  commute: z.enum(['walk', 'cycle', 'two_wheeler', 'car', 'bus_metro', 'wfh']).optional(),
  cookingFuel: z.enum(['lpg', 'electric_induction', 'piped_gas', 'biomass_wood']).optional(),
  homeType: z.enum(['apartment', 'independent_house', 'floor', 'informal']).optional(),
  purifierOwned: z.enum(['none', 'portable', 'diy']).optional(),
  monthlyBudgetBand: z.enum(['low', 'medium', 'high']).optional()
});

const AirDataSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  aqi: z.number().nonnegative().nullable().optional(),
  pm25: z.number().nonnegative().nullable().optional(),
  isLive: z.boolean().optional(),
  isCached: z.boolean().optional(),
  staleHours: z.int().nonnegative().optional(),
  cleanestWindow: z.string().trim().min(1).max(120).nullable().optional(),
  cleanestWindowPeakAqi: z.number().nonnegative().nullable().optional()
});

export const AdviceRequestSchema = z.object({
  message: z.string().trim().min(1).max(600),
  profile: HouseholdSchema.nullable().optional(),
  airData: AirDataSchema.optional(),
  language: z.enum(['en', 'hi', 'pa']).default('en'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(1200)
  }).strict()).max(6).optional(),
  mock: z.boolean().optional(),
  stream: z.boolean().optional()
}).strict();
