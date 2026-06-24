import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  WAHA_API_URL: z.string().url().optional(),
  WAHA_API_KEY: z.string().optional(),

  N8N_WEBHOOK_URL: z.string().url().optional(),
  N8N_API_KEY: z.string().optional(),

  SCRAPER_RATE_LIMIT_MS: z.coerce.number().default(1000),
  SCRAPER_MAX_RETRIES: z.coerce.number().default(3),
  SCRAPER_TIMEOUT_MS: z.coerce.number().default(30000),

  SCORE_WEIGHT_LINKEDIN: z.coerce.number().default(20),
  SCORE_WEIGHT_COMPANY: z.coerce.number().default(15),
  SCORE_WEIGHT_EMAIL: z.coerce.number().default(10),
  SCORE_WEIGHT_WEBSITE: z.coerce.number().default(5),
  SCORE_WEIGHT_PHONE: z.coerce.number().default(5),

  JWT_SECRET: z.string().optional(),
  AUTH_EMAIL: z.string().optional(),
  AUTH_PASSWORD: z.string().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

export type Env = z.infer<typeof envSchema>;
