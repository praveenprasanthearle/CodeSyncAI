import { spawn, execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import ts from 'typescript';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { ExecuteCodeInput } from '../validations/execution.validation';

export interface ExecutionResult {
  status: 'success' | 'error' | 'timeout';
  stdout: string; stderr: string; executionTimeMs: number;
  exitCode: number | null; language: string;
}
export interface SupportedLanguageInfo {
  id: string; name: string; version: string; fileExtension: string;
  timeoutLimitMs: number; isDefault?: boolean; isBuiltIn?: boolean;
  requiresExtension?: boolean; extensionId?: string; extensionName?: string;
}
type Runtime = { file: string; command: string; args: string[]; compile?: [string, string[]] };
const runtimes: Record<string, Runtime> = {
  c: { file: 'solution.c', command: './solution', args: [], compile: ['gcc', ['-std=c17', '-O2', 'solution.c', '-o', 'solution']] },
  cpp: { file: 'solution.cpp', command: './solution', args: [], compile: ['g++', ['-std=c++20', '-O2', 'solution.cpp', '-o', 'solution']] },
  javascript: { file: 'solution.cjs', command: process.execPath, args: ['solution.cjs'] },
  typescript: { file: 'solution.cjs', command: process.execPath, args: ['solution.cjs'] },
  python: { file: 'solution.py', command: process.platform === 'win32' ? 'python' : 'python3', args: ['-u', 'solution.py'] },
  go: { file: 'solution.go', command: 'go', args: ['run', 'solution.go'] },
  rust: { file: 'solution.rs', command: './solution', args: [], compile: ['rustc', ['solution.rs', '-o', 'solution']] },
  java: { file: 'Main.java', command: 'java', args: ['-Xmx128m', 'Main.java'] },
};

export class ExecutionService {
  private static readonly MAX_OUTPUT_BYTES = 64 * 1024;
  private static running = 0;

  static getSupportedLanguages(): SupportedLanguageInfo[] {
    return Object.entries(runtimes).map(([id, runtime]) => ({
      id, name: ({ c: 'C', cpp: 'C++', javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', go: 'Go', rust: 'Rust', java: 'Java' } as Record<string, string>)[id],
      version: 'Server toolchain', fileExtension: id === 'typescript' ? '.ts' : path.extname(runtime.file),
      timeoutLimitMs: env.SANDBOX_TIMEOUT_MS,
      isDefault: id === 'c' || id === 'cpp', isBuiltIn: id === 'c' || id === 'cpp',
      requiresExtension: id !== 'c' && id !== 'cpp', extensionId: id,
    }));
  }

  static async executeCode(input: ExecuteCodeInput): Promise<ExecutionResult> {
    const mode = env.EXECUTION_MODE || (env.NODE_ENV === 'production' ? 'docker' : 'local');
    if (mode === 'disabled' || (mode === 'local' && env.NODE_ENV === 'production')) {
      throw new AppError('Code execution requires an isolated runner in production.', 503, 'EXECUTION_UNAVAILABLE');
    }
    if (this.running >= 2) throw new AppError('Both execution slots are busy. Please try again shortly.', 429, 'EXECUTION_BUSY');
    this.running++;
    const started = performance.now();
    const timeout = Math.min(input.timeoutMs || 5000, env.SANDBOX_TIMEOUT_MS);
    let tempDir: string | undefined;
    try {
      let code = input.code;
      if (input.language === 'typescript') {
        const compiled = ts.transpileModule(code, {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true,
        });
        const errors = compiled.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error) || [];
        if (errors.length) return this.result(input.language, started, '', errors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'), 1);
        code = compiled.outputText;
      }
      if (mode === 'docker') {
        const containerName = `codesync-${randomUUID()}`;
        try {
          const run = await this.runProcess('docker', this.dockerArgs(containerName), process.cwd(), JSON.stringify({ language: input.language, code, stdin: input.stdin || '', timeoutMs: timeout }), timeout + 2000, true);
          if (run.exitCode === 125 || run.launchError) throw new AppError('Isolated runner unavailable. Build the runner image and configure the Docker host.', 503, 'RUNNER_UNAVAILABLE');
          const { launchError: _, ...result } = run;
          return { ...result, status: result.exitCode === 124 ? 'timeout' : result.status, language: input.language, executionTimeMs: Math.round(performance.now() - started) };
        } finally {
          await new Promise<void>(resolve => execFile('docker', ['rm', '-f', containerName], { timeout: 3000 }, () => resolve()));
        }
      }
      // Local mode is only for trusted development code. It is NOT a security sandbox.
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codesync-run-'));
      const runtime = runtimes[input.language];
      await fs.writeFile(path.join(tempDir, runtime.file), code, { mode: 0o600 });
      const remaining = () => Math.max(1, timeout - (performance.now() - started));
      if (runtime.compile) {
        const compile = await this.runProcess(runtime.compile[0], runtime.compile[1], tempDir, '', remaining());
        if (compile.status !== 'success') return { ...compile, language: input.language, executionTimeMs: Math.round(performance.now() - started) };
      }
      const command = runtime.command === './solution' && process.platform === 'win32' ? path.join(tempDir, 'solution.exe') : runtime.command;
      const run = await this.runProcess(command, runtime.args, tempDir, input.stdin || '', remaining());
      const { launchError: _, ...result } = run;
      return { ...result, language: input.language, executionTimeMs: Math.round(performance.now() - started) };
    } finally {
      this.running--;
      if (tempDir) await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /** No host mounts, host environment, network, root user, or extra capabilities. */
  static dockerArgs(name: string): string[] {
    return ['run', '--rm', '--init', '-i', '--name', name, '--pull=never',
      '--network=none', '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges',
      '--pids-limit=64', `--memory=${env.SANDBOX_MAX_MEMORY_MB}m`, `--memory-swap=${env.SANDBOX_MAX_MEMORY_MB}m`, '--cpus=0.5',
      '--user=65534:65534', '--tmpfs=/work:rw,exec,nosuid,size=64m,mode=1777',
      '--tmpfs=/tmp:rw,noexec,nosuid,size=16m,mode=1777', '--workdir=/work', env.SANDBOX_IMAGE];
  }

  private static result(language: string, started: number, stdout: string, stderr: string, exitCode: number): ExecutionResult {
    return { status: exitCode === 0 ? 'success' : 'error', stdout, stderr, exitCode, language, executionTimeMs: Math.round(performance.now() - started) };
  }

  private static runProcess(command: string, args: string[], cwd: string, input: string, timeoutMs: number, docker = false): Promise<Omit<ExecutionResult, 'language' | 'executionTimeMs'> & { launchError?: boolean }> {
    return new Promise(resolve => {
      const child = spawn(command, args, {
        cwd, shell: false, detached: process.platform !== 'win32',
        env: docker ? process.env : { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TMP: cwd, TEMP: cwd, GOCACHE: path.join(cwd, '.go-cache'), GOTOOLCHAIN: 'local' },
      });
      let stdout = '', stderr = '', outputBytes = 0, timedOut = false, outputExceeded = false, settled = false;
      const stop = () => {
        if (!child.pid) return;
        try {
          if (process.platform === 'win32') execFile('taskkill', ['/pid', String(child.pid), '/f', '/t'], () => {});
          else process.kill(-child.pid, 'SIGKILL');
        } catch { child.kill('SIGKILL'); }
      };
      const timer = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
      const collect = (chunk: Buffer, stream: 'stdout' | 'stderr') => {
        const kept = chunk.subarray(0, Math.max(0, this.MAX_OUTPUT_BYTES - outputBytes));
        if (stream === 'stdout') stdout += kept.toString(); else stderr += kept.toString();
        outputBytes += chunk.length;
        if (outputBytes > this.MAX_OUTPUT_BYTES && !outputExceeded) { outputExceeded = true; stop(); }
      };
      child.stdout.on('data', chunk => collect(chunk, 'stdout'));
      child.stderr.on('data', chunk => collect(chunk, 'stderr'));
      child.stdin.on('error', () => {});
      child.stdin.end(input);
      child.on('error', () => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        resolve({ status: 'error', stdout, stderr: `Runtime unavailable: ${path.basename(command)} is not installed on this server.`, exitCode: 127, launchError: true });
      });
      child.on('close', code => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        if (timedOut) stderr += `\n[Execution Timeout] Process exceeded maximum time limit of ${Math.round(timeoutMs)}ms and was terminated.`;
        if (outputExceeded) stderr += '\n[Output Limit] Execution stopped after 64 KB of output.';
        resolve({ status: timedOut ? 'timeout' : code === 0 && !outputExceeded ? 'success' : 'error', stdout, stderr, exitCode: timedOut ? 124 : outputExceeded ? 1 : code });
      });
    });
  }
}
