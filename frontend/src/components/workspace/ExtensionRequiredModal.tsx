import React from 'react';
import {
  X,
  Boxes,
  Download,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Terminal,
  Server,
  Zap,
  Coffee,
  Layers,
} from 'lucide-react';
import { IExtension } from '../../types';

interface ExtensionRequiredModalProps {
  isOpen: boolean;
  language: string;
  extension: IExtension | undefined;
  onClose: () => void;
  onInstallAndRun: () => void;
  onOpenExtensionsPanel: () => void;
}

const getLanguageIcon = (lang: string) => {
  const normalized = lang.toLowerCase();
  if (normalized === 'python' || normalized === 'py') {
    return <Terminal className="h-6 w-6 text-yellow-400" />;
  }
  if (normalized === 'javascript' || normalized === 'js' || normalized === 'nodejs') {
    return <Server className="h-6 w-6 text-emerald-400" />;
  }
  if (normalized === 'typescript' || normalized === 'ts') {
    return <Layers className="h-6 w-6 text-sky-400" />;
  }
  if (normalized === 'go') {
    return <Zap className="h-6 w-6 text-cyan-400" />;
  }
  if (normalized === 'rust' || normalized === 'rs') {
    return <Boxes className="h-6 w-6 text-orange-400" />;
  }
  if (normalized === 'java') {
    return <Coffee className="h-6 w-6 text-rose-400" />;
  }
  return <Cpu className="h-6 w-6 text-gold-400" />;
};

export const ExtensionRequiredModal: React.FC<ExtensionRequiredModalProps> = ({
  isOpen,
  language,
  extension,
  onClose,
  onInstallAndRun,
  onOpenExtensionsPanel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md glass-card rounded-2xl border border-surface-50 p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-surface-200 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-surface-200 border border-gold-400/30 text-gold-300 shadow-gold-sm shrink-0">
            {getLanguageIcon(language)}
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-gold-300 bg-gold-400/10 px-2 py-0.5 rounded border border-gold-400/20 mb-1">
              <Boxes className="h-3 w-3" /> Language Extension Required
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {extension?.name || `${language.toUpperCase()} Compiler Extension`}
            </h3>
          </div>
        </div>

        {/* Informational Box */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3.5 space-y-2 mb-5 text-xs text-blue-200">
          <div className="flex items-center gap-2 text-blue-300 font-semibold font-mono text-[11px]">
            <ShieldAlert className="h-4 w-4 text-blue-400 shrink-0" />
            <span>Default Compilers: C & C++</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            CodeSyncAI includes <strong>C (GCC)</strong> and <strong>C++ (G++20)</strong> as built-in default compilers. To compile and execute{' '}
            <span className="text-white font-semibold uppercase">{language}</span>, please install the extension pack.
          </p>
        </div>

        {/* Extension Details */}
        {extension && (
          <div className="rounded-xl border border-surface-50 bg-surface-300/60 p-3.5 space-y-2.5 mb-6 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Version: {extension.version}</span>
              <span>Downloads: {extension.downloads}</span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono font-semibold text-gold-300 uppercase tracking-wider">
                Includes:
              </div>
              {extension.features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenExtensionsPanel();
            }}
            className="w-full sm:w-auto flex-1 rounded-xl bg-surface-200 hover:bg-surface-100 text-slate-300 hover:text-white px-4 py-2.5 text-xs font-semibold border border-surface-50 transition-colors text-center"
          >
            Browse Marketplace
          </button>

          <button
            onClick={onInstallAndRun}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2.5 text-xs font-bold text-background shadow-md hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Install & Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
