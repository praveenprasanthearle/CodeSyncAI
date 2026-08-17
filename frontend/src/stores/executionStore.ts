import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface TerminalLine {
  id: string;
  type: 'stdout' | 'stderr' | 'info' | 'success' | 'warn';
  text: string;
  timestamp: string;
}

export interface ExecutionMetrics {
  timeMs: number;
  exitCode: number | null;
  status: 'success' | 'error' | 'timeout';
  language: string;
}

interface ExecutionState {
  isRunning: boolean;
  activeTab: 'output' | 'stdin';
  stdin: string;
  terminalLines: TerminalLine[];
  metrics: ExecutionMetrics | null;

  // Actions
  runCode: (language: string, code: string, customStdin?: string) => Promise<void>;
  setStdin: (input: string) => void;
  setActiveTab: (tab: 'output' | 'stdin') => void;
  clearTerminal: () => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  isRunning: false,
  activeTab: 'output',
  stdin: '',
  terminalLines: [
    {
      id: 'init-1',
      type: 'info',
      text: 'CodeSync Cloud Execution Sandbox Ready.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  metrics: null,

  runCode: async (language: string, code: string, customStdin?: string) => {
    if (!code.trim()) return;

    set({ isRunning: true, activeTab: 'output' });
    const startTime = new Date().toLocaleTimeString();

    // Append starting info
    set((state) => ({
      terminalLines: [
        ...state.terminalLines,
        {
          id: `run-start-${Date.now()}`,
          type: 'info',
          text: `> Executing ${language.toUpperCase()} in sandboxed container...`,
          timestamp: startTime,
        },
      ],
    }));

    try {
      const stdinPayload = customStdin !== undefined ? customStdin : get().stdin;
      const response: any = await apiClient.post('/execution/run', {
        language,
        code,
        stdin: stdinPayload,
        timeoutMs: 5000,
      });

      const result = response?.data?.result;
      if (!result) throw new Error('No result returned from execution sandbox');

      const linesToAdd: TerminalLine[] = [];
      const timestamp = new Date().toLocaleTimeString();

      if (result.stdout) {
        result.stdout.split('\n').forEach((line: string, idx: number) => {
          linesToAdd.push({
            id: `out-${Date.now()}-${idx}`,
            type: 'stdout',
            text: line,
            timestamp,
          });
        });
      }

      if (result.stderr) {
        result.stderr.split('\n').forEach((line: string, idx: number) => {
          linesToAdd.push({
            id: `err-${Date.now()}-${idx}`,
            type: 'stderr',
            text: line,
            timestamp,
          });
        });
      }

      // Append finish status line
      linesToAdd.push({
        id: `done-${Date.now()}`,
        type: result.status === 'success' ? 'success' : result.status === 'timeout' ? 'warn' : 'stderr',
        text: `✔ Process finished in ${result.executionTimeMs}ms with exit code ${result.exitCode ?? 0} [${result.status.toUpperCase()}]`,
        timestamp,
      });

      set((state) => ({
        terminalLines: [...state.terminalLines, ...linesToAdd],
        metrics: {
          timeMs: result.executionTimeMs,
          exitCode: result.exitCode,
          status: result.status,
          language: result.language,
        },
      }));
    } catch (err: any) {
      set((state) => ({
        terminalLines: [
          ...state.terminalLines,
          {
            id: `err-${Date.now()}`,
            type: 'stderr',
            text: `[Execution Failed] ${err.response?.data?.error?.message || err.message}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ],
      }));
    } finally {
      set({ isRunning: false });
    }
  },

  setStdin: (input: string) => {
    set({ stdin: input });
  },

  setActiveTab: (tab: 'output' | 'stdin') => {
    set({ activeTab: tab });
  },

  clearTerminal: () => {
    set({
      terminalLines: [
        {
          id: `clear-${Date.now()}`,
          type: 'info',
          text: 'Terminal output cleared.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      metrics: null,
    });
  },
}));
