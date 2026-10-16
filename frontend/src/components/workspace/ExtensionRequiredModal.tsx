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
  return <Cpu className="h-6 w-6 text-blue-600" />;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-md glass-card rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-glass-dropdown animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shrink-0">
            {getLanguageIcon(language)}
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mb-1">
              <Boxes className="h-3 w-3" /> Language Extension Required
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {extension?.name || `${language.toUpperCase()} Compiler Extension`}
            </h3>
          </div>
        </div>

        {/* Informational Box */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-1.5 mb-5 text-xs text-blue-900">
          <div className="flex items-center gap-2 text-blue-700 font-semibold font-mono text-[11px]">
            <ShieldAlert className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Default Compilers: C & C++</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            CodeSync AI includes <strong>C (GCC)</strong> and <strong>C++ (G++20)</strong> as built-in default compilers. To compile and execute{' '}
            <span className="text-slate-900 font-semibold uppercase">{language}</span>, please install the extension pack.
          </p>
        </div>

        {/* Extension Details */}
        {extension && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2 mb-5 text-xs">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Version: {extension.version}</span>
              <span>Downloads: {extension.downloads}</span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono font-semibold text-slate-700 uppercase tracking-wider">
                Includes:
              </div>
              {extension.features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
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
            className="w-full sm:w-auto flex-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-medium border border-slate-200 transition-colors text-center"
          >
            Browse Marketplace
          </button>

          <button
            onClick={onInstallAndRun}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-medium text-white transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install & Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
