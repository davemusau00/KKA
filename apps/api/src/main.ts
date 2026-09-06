import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { env } from "./platform/env";
import { assignRequestId } from "./platform/request-context/request-id.hook";
import { ZodExceptionFilter } from "./platform/http/zod-exception.filter";

async function bootstrap() {
  const cfg = env();
  const adapter = new FastifyAdapter({
    trustProxy: cfg.TRUST_PROXY,
    logger: {
      level: cfg.LOG_LEVEL
    }
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true
  });

  await app.register(fastifyCookie as any);
  await app.register(fastifyMultipart as any, {
    limits: { fileSize: cfg.MAX_UPLOAD_BYTES, files: 1 }
  });
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false
  });
  await app.register(fastifyRateLimit as any, {
    max: cfg.RATE_LIMIT_MAX,
    timeWindow: cfg.RATE_LIMIT_WINDOW
  });

  (app.getHttpAdapter().getInstance() as any).addHook("onRequest", assignRequestId);
  // Prisma file sizes are bigint; JSON transports them as decimal strings.
  app.getHttpAdapter().getInstance().addHook('preSerialization', async (_request: unknown, _reply: unknown, payload: unknown) =>
    JSON.parse(JSON.stringify(payload, (_key, value: unknown) => typeof value === 'bigint' ? value.toString() : value)) as unknown);
  app.enableCors({
    origin: cfg.WEB_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  });
  app.enableShutdownHooks();
  app.useGlobalFilters(new ZodExceptionFilter());

  const prefix = cfg.API_PREFIX.replace(/^\/+/, "");
  app.setGlobalPrefix(prefix);

  const openApi = new DocumentBuilder()
    .setTitle("Kariuki Kagunda & Co. Advocates OS API")
    .setDescription("Matter-centric backend API for KKA Lawfirm OS")
    .setVersion("1.0")
    .addCookieAuth(cfg.SESSION_COOKIE_NAME)
    .build();
  SwaggerModule.setup(`${prefix}/docs`, app, SwaggerModule.createDocument(app, openApi), {
    swaggerOptions: { persistAuthorization: true }
  });

  await app.listen({ host: cfg.API_HOST, port: cfg.API_PORT });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
