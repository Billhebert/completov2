import dotenv from 'dotenv';

dotenv.config();
// src/core/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Qdrant
  QDRANT_URL: z.string().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  
  // MinIO
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().transform(Number).default('9000'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_USE_SSL: z.string().transform(val => val === 'true').default('false'),
  MINIO_BUCKET: z.string().default('omni-platform'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4'),
  
  // Ollama
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama2'),

  // AI Mode
  AI_MODE: z.enum(['full', 'auto', 'economico']).default('auto'),

  // Sentry
  SENTRY_DSN: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // Evolution API (WhatsApp)
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3000/api/v1/sso/google/callback'),
  
  MICROSOFT_CLIENT_ID: z.string().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().default(''),
  MICROSOFT_REDIRECT_URI: z.string().default('http://localhost:3000/api/v1/sso/microsoft/callback'),
  
  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  GITHUB_REDIRECT_URI: z.string().default('http://localhost:3000/api/v1/sso/github/callback'),
  
  // Limits
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15min
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('10'),

  // Security
  CSRF_ENABLED: z.string().transform(val => val === 'true').default('true'),
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }
  
  return parsed.data;
}

export const env = loadEnv();
