import React, { useRef, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Keyboard,
  Loader2,
} from 'lucide-react';
import { useExecutionStore } from '../../stores/executionStore';

interface WorkspaceTerminalProps {
  onRunCode?: () => void;
}

export const WorkspaceTerminal: React.FC<WorkspaceTerminalProps> = ({ onRunCode }) => {
  const {
    isRunning,
    activeTab,
    stdin,
    terminalLines,
    metrics,
    setStdin,
    setActiveTab,
    clearTerminal,
  } = useExecutionStore();

  const [copied, setCopied] = React.useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const handleCopyLogs = () => {
    const text = terminalLines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-44 border-t border-editor-border bg-surface-400 font-mono text-xs flex flex-col shrink-0 select-none overflow-hidden">
      {/* Terminal Toolbar Header */}
      <div className="h-9 px-3 border-b border-surface-50/60 bg-surface-300/40 flex items-center justify-between shrink-0">
        {/* Left Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'output'
                ? 'bg-surface-200 text-gold-300 font-semibold border border-surface-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>Output Console</span>
            {isRunning && <Loader2 className="h-3 w-3 animate-spin text-gold-400 ml-1" />}
          </button>

          <button
            onClick={() => setActiveTab('stdin')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activeTab === 'stdin'
                ? 'bg-surface-200 text-gold-300 font-semibold border border-surface-50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5 text-sky-400" />
            <span>Stdin Input</span>
            {stdin.trim().length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 ml-0.5" />
            )}
          </button>
        </div>

        {/* Right Metrics & Actions */}
        <div className="flex items-center gap-2">
          {metrics && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                metrics.status === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                  : metrics.status === 'timeout'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
              }`}
            >
              {metrics.status === 'success' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : metrics.status === 'timeout' ? (
                <Clock className="h-3 w-3 text-amber-400" />
              ) : (
                <AlertCircle className="h-3 w-3 text-rose-400" />
              )}
              <span>{metrics.timeMs}ms</span>
              <span className="text-slate-600">•</span>
              <span>Exit {metrics.exitCode ?? 0}</span>
            </div>
          )}

          {onRunCode && (
            <button
              onClick={onRunCode}
              disabled={isRunning}
              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 text-[11px] transition-all disabled:opacity-50"
              title="Run code"
            >
              <Play className="h-3 w-3 fill-emerald-400" />
              <span className="hidden md:inline">Execute</span>
            </button>
          )}

          <button
            onClick={handleCopyLogs}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-200 transition-colors"
            title="Copy output logs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={clearTerminal}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-200 transition-colors"
            title="Clear terminal"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal View Content */}
      <div className="flex-1 overflow-hidden p-3 font-mono text-xs select-text">
        {activeTab === 'output' ? (
          <div className="h-full overflow-y-auto space-y-1 text-slate-300 custom-scrollbar">
            {terminalLines.map((line) => (
              <div key={line.id} className="leading-relaxed flex items-start gap-2">
                <span className="text-[10px] text-slate-600 select-none shrink-0 font-mono">
                  {line.timestamp}
                </span>

                <div className="flex-1">
                  {line.type === 'info' ? (
                    <span className="text-gold-400 font-bold">{line.text}</span>
                  ) : line.type === 'success' ? (
                    <span className="text-emerald-400 font-semibold">{line.text}</span>
                  ) : line.type === 'stderr' ? (
                    <span className="text-rose-400 whitespace-pre-wrap">{line.text}</span>
                  ) : line.type === 'warn' ? (
                    <span className="text-amber-400 whitespace-pre-wrap">{line.text}</span>
                  ) : (
                    <span className="text-slate-200 whitespace-pre-wrap">{line.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-1.5">
            <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Standard Input (passed to process during execution):</span>
              <span className="text-slate-500">{stdin.length} chars</span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter custom input data (e.g. for algorithms, competitive programming, stdin readers)..."
              className="flex-1 w-full rounded-lg border border-surface-50 bg-surface-300 p-2.5 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none resize-none font-mono custom-scrollbar"
            />
          </div>
        )}
      </div>
    </div>
  );
};
