import { z } from "zod";

const boolish = z.preprocess(
  (value) => typeof value === "string" ? ["1", "true", "yes", "on"].includes(value.toLowerCase()) : value,
  z.boolean()
);

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("KKA Lawfirm OS"),
  APP_URL: z.string().url().default("http://localhost:8080"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().default("/api/v1"),
  TRUST_PROXY: boolish.default(true),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().default("kka_sid"),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28800),
  SESSION_COOKIE_SECURE: boolish.default(false),
  SESSION_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(65536),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().positive().default(1),
  INVITE_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(48),
  APP_ENCRYPTION_KEY_BASE64: z.string().min(32),
  ENCRYPTION_KEY_VERSION: z.coerce.number().int().positive().default(1),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_ROOT: z.string().default("/srv/kklaw/data/documents"),
  MARK_STORAGE_ROOT: z.string().default("/srv/kklaw/data/marks"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(52428800),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: boolish.default(true),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW: z.string().default("1 minute"),
  LOG_LEVEL: z.string().default("info")
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: AppEnv | undefined;

export function env(): AppEnv {
  if (!cached) cached = EnvSchema.parse(process.env);
  return cached;
}
