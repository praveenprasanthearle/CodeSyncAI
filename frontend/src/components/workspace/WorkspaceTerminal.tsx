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
    <div className="h-44 border-t border-slate-200/80 bg-white font-mono text-xs flex flex-col shrink-0 select-none overflow-hidden">
      {/* Terminal Toolbar Header */}
      <div className="h-9 px-3 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
        {/* Left Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
              activeTab === 'output'
                ? 'bg-white text-slate-900 font-semibold border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            <span>Output</span>
            {isRunning && <Loader2 className="h-3 w-3 animate-spin text-blue-600 ml-1" />}
          </button>

          <button
            onClick={() => setActiveTab('stdin')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
              activeTab === 'stdin'
                ? 'bg-white text-slate-900 font-semibold border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5 text-slate-500" />
            <span>Stdin</span>
            {stdin.trim().length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 ml-0.5" />
            )}
          </button>
        </div>

        {/* Right Metrics & Actions */}
        <div className="flex items-center gap-2">
          {metrics && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                metrics.status === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : metrics.status === 'timeout'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {metrics.status === 'success' ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              ) : metrics.status === 'timeout' ? (
                <Clock className="h-3 w-3 text-amber-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-rose-600" />
              )}
              <span>{metrics.timeMs}ms</span>
              <span className="text-slate-300">•</span>
              <span>Exit {metrics.exitCode ?? 0}</span>
            </div>
          )}

          {onRunCode && (
            <button
              onClick={onRunCode}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-medium transition-all disabled:opacity-50"
              title="Run code"
            >
              <Play className="h-3 w-3 fill-emerald-600" />
              <span className="hidden md:inline">Execute</span>
            </button>
          )}

          <button
            onClick={handleCopyLogs}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Copy logs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={clearTerminal}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Clear"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-3 font-mono text-xs select-text bg-slate-50/40">
        {activeTab === 'output' ? (
          <div className="h-full overflow-y-auto space-y-1 text-slate-700 custom-scrollbar">
            {terminalLines.map((line) => (
              <div key={line.id} className="leading-relaxed flex items-start gap-2">
                <span className="text-[10px] text-slate-400 select-none shrink-0 font-mono">
                  {line.timestamp}
                </span>

                <div className="flex-1">
                  {line.type === 'info' ? (
                    <span className="text-blue-600 font-semibold">{line.text}</span>
                  ) : line.type === 'success' ? (
                    <span className="text-emerald-700 font-medium">{line.text}</span>
                  ) : line.type === 'stderr' ? (
                    <span className="text-rose-600 whitespace-pre-wrap">{line.text}</span>
                  ) : line.type === 'warn' ? (
                    <span className="text-amber-600 whitespace-pre-wrap">{line.text}</span>
                  ) : (
                    <span className="text-slate-800 whitespace-pre-wrap">{line.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col space-y-1">
            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>Standard Input (passed to process stdin):</span>
              <span className="text-slate-400">{stdin.length} chars</span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter custom input data for execution..."
              className="flex-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none resize-none font-mono custom-scrollbar"
            />
          </div>
        )}
      </div>
    </div>
  );
};
