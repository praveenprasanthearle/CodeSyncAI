import { readFile, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
const root = new URL('../', import.meta.url);
const exists = async url => { try { await access(url); return true; } catch { return false; } };
const secrets = Object.fromEntries(['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'].map(name => [name, randomBytes(32).toString('hex')]));
const backend = new URL('backend/.env', root);
if (!await exists(backend)) {
  let template = await readFile(new URL('backend/.env.example', root), 'utf8');
  for (const [name, value] of Object.entries(secrets)) template = template.replace(new RegExp(`^${name}=.*$`, 'm'), `${name}=${value}`);
  template = template.replace(/^(GEMINI_API_KEY|OPENAI_API_KEY)=.*$/gm, '$1=');
  await writeFile(backend, template, { mode: 0o600, flag: 'wx' });
  console.log('Created backend/.env with unique development secrets.');
} else console.log('Kept existing backend/.env.');
const composeEnv = new URL('.env', root);
if (!await exists(composeEnv)) {
  const content = Object.entries(secrets).map(([key, value]) => `${key}=${value}`).join('\n');
  await writeFile(composeEnv, `# Local Docker demo. Set your HTTPS origin and COOKIE_SECURE=true for public hosting.\nCLIENT_URL=http://localhost\nCOOKIE_SECURE=false\nEXECUTION_MODE=docker\n${content}\n`, { mode: 0o600, flag: 'wx' });
  console.log('Created .env for local Docker configuration.');
} else console.log('Kept existing .env.');
console.log('Run npm run dev. Configure an AI provider in backend/.env or in AI Settings.');
