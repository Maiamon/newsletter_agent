import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['dev', 'prod', 'test']).default('dev'),
  
  // Database configuration
  DATABASE_URL: z.string().url(),
  PGHOST: z.string().default('localhost'),
  PGPORT: z.coerce.number().default(5432),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
  PGDATABASE: z.string(),
  
  // Gemini AI configuration
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('models/gemini-2.5-flash'),
  
  // News curation configuration
  RELEVANCE_SCORE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables.');
}

export const env = _env.data;