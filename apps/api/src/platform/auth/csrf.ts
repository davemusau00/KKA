import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppEnv } from '../env';

export const CSRF_TTL_SECONDS = 3600;
type Config = Pick<AppEnv, 'CSRF_ENABLED' | 'CSRF_COOKIE_NAME' | 'WEB_ORIGIN' | 'SESSION_COOKIE_SECURE' | 'SESSION_COOKIE_SAME_SITE' | 'APP_ENCRYPTION_KEY_BASE64'>;
const sign = (value: string, config: Config) => createHmac('sha256', Buffer.from(config.APP_ENCRYPTION_KEY_BASE64, 'base64')).update(`csrf:${value}`).digest('base64url');
const equal = (a: string, b: string) => Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export function validCsrf(token: string | undefined, config: Config, now = Date.now()): boolean {
  if (!token || !/^\d{13}\.[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [timestamp, nonce, signature] = token.split('.') as [string, string, string];
  const age = now - Number(timestamp);
  return age >= 0 && age < CSRF_TTL_SECONDS * 1000 && equal(signature, sign(`${timestamp}.${nonce}`, config));
}

export function issueCsrf(request: FastifyRequest, reply: FastifyReply, config: Config) {
  const existing = request.cookies[config.CSRF_COOKIE_NAME];
  const value = `${Date.now()}.${randomBytes(32).toString('base64url')}`;
  // Reuse an unexpired cookie so a second tab cannot invalidate the first tab.
  const token = validCsrf(existing, config) ? existing! : `${value}.${sign(value, config)}`;
  const expiresAt = Number(token.split('.')[0]) + CSRF_TTL_SECONDS * 1000;
  reply.header('Cache-Control', 'no-store').setCookie(config.CSRF_COOKIE_NAME, token, {
    httpOnly: true, secure: config.SESSION_COOKIE_SECURE, sameSite: config.SESSION_COOKIE_SAME_SITE,
    path: '/', maxAge: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)),
  });
  return { token, expiresAt };
}

export function csrfHook(config: Config) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!config.CSRF_ENABLED || ['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
    const origins = config.WEB_ORIGIN.split(',').map(origin => origin.trim());
    if (request.headers.origin && !origins.includes(request.headers.origin)) {
      return reply.code(403).send({ code: 'ORIGIN_DENIED', message: 'Request origin is not permitted' });
    }
    const cookie = request.cookies[config.CSRF_COOKIE_NAME];
    const header = request.headers['x-csrf-token'];
    if (!validCsrf(cookie, config) || typeof header !== 'string' || !equal(cookie!, header)) {
      return reply.code(403).send({ code: 'CSRF_INVALID', message: 'Secure session token expired or missing' });
    }
  };
}
