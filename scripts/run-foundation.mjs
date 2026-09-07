import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream } from 'node:fs';
import { resolve } from 'node:path';

// Local acceptance only. Uses dedicated ports and always tears down its own children.
if (!/^kka_documents_/.test(new URL(process.env.DATABASE_URL || '').pathname.slice(1))) throw new Error('Use an isolated kka_documents_ test database');
const root = resolve(import.meta.dirname, '..');
const env = { ...process.env, API_PORT: '3016', API_PUBLIC_URL: 'http://localhost:3016', WEB_ORIGIN: 'http://localhost:5174',
  VITE_API_URL: 'http://localhost:3016/api/v1', TEST_API_URL: 'http://localhost:3016/api/v1', TEST_WEB_URL: 'http://localhost:5174', CSRF_ENABLED: 'true', ACCEPTANCE_STARTUP_SECONDS: '600' };
mkdirSync(resolve(root, '.artifacts'), { recursive: true });
const children = [];
function background(name, args) {
  const log = createWriteStream(resolve(root, `.artifacts/foundation-${name}.log`));
  const child = spawn(process.execPath, args, { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.pipe(log); child.stderr.pipe(log); children.push(child);
  child.on('error', error => console.error(`${name} failed to start: ${error.message}`));
  child.on('exit', code => { if (code) console.error(`${name} exited ${code}; inspect .artifacts/foundation-${name}.log`); });
  return child;
}
async function run(args, cwd = root) {
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: 'inherit' });
    children.push(child); child.on('error', reject); child.on('exit', code => code === 0 ? done() : reject(new Error(`Acceptance command exited ${code}`)));
  });
}
try {
  background('api', ['apps/api/dist/main.js']);
  background('web', ['apps/web/node_modules/vite/bin/vite.js', 'apps/web', '--port', '5174', '--strictPort', '--host', 'localhost']);
  await run(['scripts/wait-acceptance.mjs']);
  if (process.env.ACCEPTANCE_BROWSER_ONLY !== 'true') await run(['--import', 'tsx', '--test', 'test/document-workflows.test.ts'], resolve(root, 'apps/api'));
  await run(['node_modules/@playwright/test/cli.js', 'test'], resolve(root, 'apps/web'));
  console.log('Acceptance completed successfully.');
} finally { for (const child of children) if (child.exitCode === null) child.kill(); }
