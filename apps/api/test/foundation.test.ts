import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { randomBytes } from 'node:crypto';
import { csrfHook, issueCsrf, validCsrf, CSRF_TTL_SECONDS } from '../src/platform/auth/csrf';
import { EnvSchema } from '../src/platform/env';
import { roleContext } from '../src/platform/auth/role-context';

const config = EnvSchema.parse({ DATABASE_URL: 'postgresql://localhost/test', REDIS_URL: 'redis://localhost',
  APP_ENCRYPTION_KEY_BASE64: randomBytes(32).toString('base64'), CSRF_ENABLED: true,
  SESSION_COOKIE_SECURE: true, WEB_ORIGIN: 'https://os.kariukikagunda.com' });

test('inactive and cross-firm roles cannot grant permissions', () => {
  const role = (firmId: string, active: boolean, key: string) => ({ role: { firmId, active, key, permissions: [{ permission: { key: 'document.view' } }] } });
  assert.deepEqual(roleContext('a', [role('a', true, 'reader'), role('b', true, 'admin'), role('a', false, 'retired')]), { roleKeys: ['reader'], permissions: ['document.view'] });
});

test('CSRF protects login, invite and mutations before handlers; valid tokens work across tabs', async () => {
  const app = Fastify(); await app.register(cookie);
  app.addHook('preHandler', csrfHook(config));
  app.get('/auth/csrf', (request, reply) => issueCsrf(request, reply, config));
  let changes = 0;
  for (const path of ['/auth/login', '/auth/accept-invite', '/document-operations/preview', '/write']) app.post(path, () => ({ changes: ++changes }));
  try {
    for (const url of ['/auth/login', '/auth/accept-invite', '/document-operations/preview', '/write']) {
      const result = await app.inject({ method: 'POST', url });
      assert.equal(result.statusCode, 403); assert.equal(result.json().code, 'CSRF_INVALID');
    }
    assert.equal(changes, 0);
    const first = await app.inject('/auth/csrf');
    const { token } = first.json();
    const sessionCookie = `${config.CSRF_COOKIE_NAME}=${token}`;
    assert.match(String(first.headers['set-cookie']), /HttpOnly/);
    assert.match(String(first.headers['set-cookie']), /Secure/);
    assert.doesNotMatch(String(first.headers['set-cookie']), /Domain=/i);
    assert.equal(first.headers['cache-control'], 'no-store');
    assert.equal((await app.inject({ url: '/auth/csrf', headers: { cookie: sessionCookie } })).json().token, token);
    const headers = { cookie: sessionCookie, 'x-csrf-token': token, origin: config.WEB_ORIGIN };
    assert.equal((await app.inject({ method: 'POST', url: '/write', headers })).statusCode, 200);
    assert.equal(changes, 1);
    assert.equal((await app.inject({ method: 'POST', url: '/write', headers: { ...headers, origin: 'https://evil.example' } })).json().code, 'ORIGIN_DENIED');
    assert.equal((await app.inject({ method: 'POST', url: '/write', headers: { ...headers, cookie: `${config.CSRF_COOKIE_NAME}=forged`, 'x-csrf-token': 'forged' } })).statusCode, 403);
    assert.equal(changes, 1);
    assert.equal(validCsrf(token, config, Date.now() + CSRF_TTL_SECONDS * 1000), false);
    assert.equal(validCsrf(token, { ...config, APP_ENCRYPTION_KEY_BASE64: randomBytes(32).toString('base64') }), false);
  } finally { await app.close(); }
});

test('production configuration refuses disabled CSRF, insecure/shared cookies and missing firm', () => {
  const production = { ...config, NODE_ENV: 'production', API_PUBLIC_URL: 'https://api.kariukikagunda.com', PUBLIC_BRANDING_FIRM_ID: 'reviewed-firm' };
  assert.equal(EnvSchema.safeParse(production).success, true);
  for (const invalid of [{ CSRF_ENABLED: false }, { SESSION_COOKIE_SECURE: false }, { SESSION_COOKIE_DOMAIN: '.kariukikagunda.com' }, { PUBLIC_BRANDING_FIRM_ID: '' }, { WEB_ORIGIN: '*' }, { API_PUBLIC_URL: 'http://localhost' }]) {
    assert.equal(EnvSchema.safeParse({ ...production, ...invalid }).success, false);
  }
});
