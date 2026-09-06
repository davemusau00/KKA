function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const workerEnv = {
  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: required("REDIS_URL"),
  APP_ENCRYPTION_KEY_BASE64: required("APP_ENCRYPTION_KEY_BASE64"),
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT ?? "/srv/kklaw/data/documents",
  MAIL_QUEUE_CONCURRENCY: Number(process.env.MAIL_QUEUE_CONCURRENCY ?? 4),
  NOTIFICATION_QUEUE_CONCURRENCY: Number(process.env.NOTIFICATION_QUEUE_CONCURRENCY ?? 8),
  DOCUMENT_QUEUE_CONCURRENCY: Number(process.env.DOCUMENT_QUEUE_CONCURRENCY ?? 2),
  AUTOMATION_QUEUE_CONCURRENCY: Number(process.env.AUTOMATION_QUEUE_CONCURRENCY ?? 4),
  WEBHOOK_QUEUE_CONCURRENCY: Number(process.env.WEBHOOK_QUEUE_CONCURRENCY ?? 4)
};
