// Source and program input arrive over stdin, never a host mount.
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const payload = JSON.parse(fs.readFileSync(0, 'utf8'));
const runtimes = {
  javascript: ['solution.cjs', 'node', ['solution.cjs']],
  typescript: ['solution.cjs', 'node', ['solution.cjs']],
  python: ['solution.py', 'python3', ['-u', 'solution.py']],
  c: ['solution.c', './solution', [], ['gcc', ['-std=c17', '-O2', 'solution.c', '-o', 'solution']]],
  cpp: ['solution.cpp', './solution', [], ['g++', ['-std=c++20', '-O2', 'solution.cpp', '-o', 'solution']]],
  go: ['solution.go', 'go', ['run', 'solution.go']],
  rust: ['solution.rs', './solution', [], ['rustc', ['solution.rs', '-o', 'solution']]],
  java: ['Main.java', 'java', ['-Xmx128m', 'Main.java']],
};
const runtime = runtimes[payload.language];
if (!runtime) throw new Error('Unsupported language');
fs.writeFileSync(runtime[0], payload.code);
const started = Date.now();
const run = (command, args, input = '') => {
  const result = spawnSync(command, args, {
    input, encoding: 'utf8', timeout: Math.max(1, payload.timeoutMs - (Date.now() - started)),
    maxBuffer: 64 * 1024, env: { PATH: process.env.PATH, GOCACHE: '/work/.go-cache', GOTOOLCHAIN: 'local' },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) {
    process.stderr.write(result.error.code === 'ETIMEDOUT' ? '\n[Execution Timeout] Time limit exceeded.' : '\nRuntime unavailable or output limit exceeded.');
    process.exit(result.error.code === 'ETIMEDOUT' ? 124 : 1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
};
if (runtime[3]) run(...runtime[3]);
run(runtime[1], runtime[2], payload.stdin);
