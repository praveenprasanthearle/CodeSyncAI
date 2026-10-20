import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const frontendRequire = createRequire(new URL('../frontend/package.json', import.meta.url));
const vite = path.join(path.dirname(frontendRequire.resolve('vite/package.json')), 'bin/vite.js');
const backendPort = 5055, frontendPort = 5175;
const base = `http://127.0.0.1:${frontendPort}`;
const artifacts = process.env.CODESYNC_QA_DIR || path.join(root, 'test-results/demo-smoke');
const secret = randomBytes(32).toString('hex');
const children = [], browsers = [], pages = [], pageErrors = [], checks = [];
let serverLog = '';
await mkdir(artifacts, { recursive: true });

function start(script, args, cwd, env) {
  const child = spawn(process.execPath, [script, ...args], { cwd, env: { ...process.env, ...env }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { serverLog = (serverLog + chunk.toString()).slice(-12000); });
  return child;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer(url) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (response.ok) return; } catch { /* Starting. */ }
    if (children.some(child => child.exitCode !== null)) throw new Error(`A test server exited.\n${serverLog}`);
    await pause(150);
  }
  throw new Error(`Test server did not start.\n${serverLog}`);
}
async function newPage() {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: process.env.CODESYNC_BROWSER_SINGLE_PROCESS === 'true' ? ['--no-sandbox', '--no-zygote', '--single-process'] : [],
  });
  browsers.push(browser);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000); pages.push(page);
  page.on('pageerror', error => pageErrors.push(error.message));
  return page;
}
const pass = name => { checks.push(name); console.log(`PASS: ${name}`); };
async function register(page, name) {
  await page.goto(`${base}/register`);
  await page.getByPlaceholder('Sarah Connor').fill(`Demo ${name}`);
  await page.getByPlaceholder('sarah_dev').fill(`demo_${name}`);
  await page.getByPlaceholder('sarah@example.com').fill(`${name}@demo.test`);
  await page.locator('input[type="password"]').fill('DemoPassword123!');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await page.waitForURL('**/dashboard');
}
async function api(page, method, resource, body) {
  const token = await page.evaluate(() => localStorage.getItem('codesync_access_token'));
  const result = await fetch(`${base}/api/v1${resource}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await result.json(); assert.ok(result.ok, `${method} ${resource}: ${data.message}`); return data.data;
}
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children || [])]);
async function edit(page, content) {
  await page.locator('[data-editor-ready="true"]').waitFor({ timeout: 120000 });
  const textarea = page.locator('.monaco-editor textarea').first();
  await textarea.waitFor({ timeout: 120000 }); await textarea.focus();
  await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.insertText(content);
}
async function insertAtStart(page, text) {
  await page.locator('[data-editor-ready="true"]').waitFor({ timeout: 120000 });
  await page.locator('.monaco-editor textarea').first().focus();
  await page.keyboard.press('ControlOrMeta+Home'); await page.keyboard.insertText(text);
}
async function pollFile(page, id, predicate) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { const file = (await api(page, 'GET', `/files/${id}`)).file; if (predicate(file.content)) return file; await pause(100); }
  throw new Error('File did not reach the expected persisted state.');
}

try {
  // Force an isolated disposable DB and no live provider calls, regardless of developer .env.
  start(path.join(root, 'backend/dist/server.js'), [], path.join(root, 'backend'), { NODE_ENV: 'test', PORT: String(backendPort), HOST: '127.0.0.1', DATABASE_URL: 'mongodb://127.0.0.1:1/codesync_e2e', JWT_ACCESS_SECRET: secret, JWT_REFRESH_SECRET: randomBytes(32).toString('hex'), GEMINI_API_KEY: '', OPENAI_API_KEY: '', EXECUTION_MODE: 'local', COOKIE_SECURE: 'false' });
  start(vite, ['--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'], path.join(root, 'frontend'), { BACKEND_URL: `http://127.0.0.1:${backendPort}` });
  await waitForServer(`http://127.0.0.1:${backendPort}/api/v1/health`); await waitForServer(base);
  const owner = await newPage(); await register(owner, 'owner'); pass('registration and dashboard');
  await owner.getByRole('button', { name: 'New project', exact: true }).click();
  await owner.getByPlaceholder('my-awesome-app').fill('Browser Demo Project');
  await owner.getByRole('button', { name: 'Create project', exact: true }).click();
  await owner.waitForURL('**/workspace/*');
  const projectId = new URL(owner.url()).pathname.split('/').at(-1);
  await owner.getByText('main.c', { exact: true }).first().click();
  const files = flatten((await api(owner, 'GET', `/projects/${projectId}/files`)).files);
  const mainFile = files.find(file => file.name === 'main.c'); assert.ok(mainFile);
  const source = '#include <stdio.h>\nint main(void) { printf("DEMO_RUN_42\\n"); return 0; }\n';
  await edit(owner, source); await pollFile(owner, mainFile.id, text => text === source); pass('project creation, bundled Monaco editor and persisted editing');
  const runResponse = owner.waitForResponse(response => response.url().endsWith('/execution/run') && response.request().method() === 'POST');
  await owner.getByTitle('Run code (Ctrl+Enter)', { exact: true }).click();
  const run = await (await runResponse).json(); assert.equal(run.data.result.stdout.trim(), 'DEMO_RUN_42'); pass('Run button executes native C and displays real output');

  const editor = await newPage(); await register(editor, 'editor');
  await api(owner, 'POST', `/projects/${projectId}/members`, { emailOrUsername: 'demo_editor', role: 'editor' });
  await editor.goto(`${base}/workspace/${projectId}`); await editor.getByText('main.c', { exact: true }).first().click();
  await editor.locator('.monaco-editor textarea').first().waitFor({ timeout: 120000 });
  await Promise.all([insertAtStart(owner, '// Owner change\n'), insertAtStart(editor, '// Editor change\n')]);
  const merged = await pollFile(owner, mainFile.id, text => text.includes('Owner change') && text.includes('Editor change'));
  await owner.locator('.view-lines').getByText('// Editor change', { exact: true }).waitFor();
  await editor.locator('.view-lines').getByText('// Owner change', { exact: true }).waitFor();
  pass('two-account concurrent edits converge in both editors and MongoDB');

  await Promise.all([owner.getByTitle('Open Team Chat & Voice').click(), editor.getByTitle('Open Team Chat & Voice').click()]);
  await owner.getByPlaceholder('Type a message...').fill('Hello from the browser smoke test');
  await owner.getByPlaceholder('Type a message...').press('Enter');
  await editor.getByText('Hello from the browser smoke test', { exact: true }).waitFor(); pass('team chat reaches the other account');
  await owner.getByTitle('Close side panel').click();
  await owner.getByTitle('Snapshot', { exact: true }).click();
  await owner.getByPlaceholder('e.g. v1.1.0 - Refactored CRDT sync').fill('Browser milestone');
  const capture = owner.waitForResponse(response => response.url().endsWith('/snapshots') && response.request().method() === 'POST');
  await owner.locator('form').getByRole('button', { name: /Capture|Create|Save/ }).click();
  const snapshot = (await (await capture).json()).data.snapshot;
  assert.equal(snapshot.files.find(file => file.path === mainFile.path).content, merged.content);
  await owner.getByText('Snapshot Captured Successfully!', { exact: true }).waitFor();
  await owner.getByPlaceholder('e.g. v1.1.0 - Refactored CRDT sync').waitFor({ state: 'hidden' });
  await insertAtStart(owner, '// To be restored\n');
  await pollFile(owner, mainFile.id, text => text.includes('To be restored'));
  await api(owner, 'POST', `/snapshots/${snapshot.id}/restore`);
  await pollFile(owner, mainFile.id, text => text === merged.content);
  await owner.locator('.view-lines').getByText('// To be restored', { exact: true }).waitFor({ state: 'hidden' });
  await editor.locator('.view-lines').getByText('// To be restored', { exact: true }).waitFor({ state: 'hidden' });
  pass('snapshot captures recent edits and restores the live document');

  const profile = (await api(owner, 'GET', '/auth/me')).user;
  const expired = require('jsonwebtoken').sign({ userId: profile.id, email: profile.email, username: profile.username, role: profile.role }, secret, { expiresIn: -1 });
  await owner.evaluate(token => localStorage.setItem('codesync_access_token', token), expired);
  await owner.reload(); await owner.getByText('main.c', { exact: true }).first().waitFor({ timeout: 120000 });
  const refreshed = await owner.evaluate(() => localStorage.getItem('codesync_access_token'));
  assert.notEqual(refreshed, expired); assert.ok(owner.url().includes('/workspace/')); pass('expired access token recovers through the refresh cookie');

  await owner.getByTitle('AI Assistant', { exact: true }).click();
  await owner.getByRole('textbox', { name: 'Message CodeSync AI' }).fill('Write a polite email to my professor.');
  await owner.getByRole('button', { name: 'Send AI message' }).click();
  await owner.getByText('Connect a Gemini or OpenAI API key in AI Settings, or configure a provider key on the server.', { exact: true }).waitFor();
  await owner.getByTitle('AI Engine Settings').click();
  await owner.getByRole('dialog', { name: 'AI Settings' }).waitFor();
  await owner.getByLabel('AI provider').selectOption('openai');
  assert.equal(await owner.getByRole('button', { name: 'Verify and save key' }).isDisabled(), true);
  await owner.getByRole('button', { name: 'Close AI Settings' }).click();
  pass('AI configuration and missing-key errors are honest and actionable');
  await owner.screenshot({ path: path.join(artifacts, 'workspace.png'), fullPage: true });
  assert.deepEqual(pageErrors, [], 'Browser runtime errors');
  await writeFile(path.join(artifacts, 'results.json'), JSON.stringify({ checks, pageErrors, liveAiTested: false, dockerTested: false }, null, 2));
  console.log(`PASS: ${checks.length} browser workflows; no browser runtime errors.`);
} catch (error) {
  for (let index = 0; index < pages.length; index++) {
    const diagnostic = await pages[index].evaluate(async () => {
      const { useCollaborationStore } = await import('/src/stores/collaborationStore.ts');
      const { useFileStore } = await import('/src/stores/fileStore.ts');
      const state = useCollaborationStore.getState();
      return { connected: state.isConnected, ready: state.isDocumentReady, error: state.error, document: state.yDoc?.getText('monaco').toString(), cached: useFileStore.getState().fileContents, focusedElement: document.activeElement?.tagName };
    }).catch(() => null);
    console.error(`Browser ${index} diagnostic:`, JSON.stringify(diagnostic));
  }
  for (let index = 0; index < pages.length; index++) await pages[index].screenshot({ path: path.join(artifacts, `failure-${index}.png`), fullPage: true }).catch(() => {});
  console.error(error.stack || error); console.error('Test server log:', serverLog); process.exitCode = 1;
} finally {
  await Promise.all(browsers.map(browser => browser.close().catch(() => {})));
  for (const child of children) {
    if (child.exitCode !== null) continue;
    try { if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/t', '/f']); else process.kill(-child.pid, 'SIGTERM'); } catch { /* Already closed. */ }
  }
  await Promise.all(children.map(child => child.exitCode !== null ? Promise.resolve() : new Promise(resolve => {
    child.once('exit', resolve);
    const timer = setTimeout(() => { try { if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL'); else child.kill(); } catch { /* Closed. */ } resolve(); }, 5000); timer.unref();
  })));
}
