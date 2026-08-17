import React from 'react';
import { Wifi, CheckCircle2, AlertCircle, Boxes, Cpu } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useExtensionStore } from '../../stores/extensionStore';

interface WorkspaceFooterProps {
  cursorPosition: { line: number; column: number };
  language?: string;
  onOpenExtensions?: () => void;
}

export const WorkspaceFooter: React.FC<WorkspaceFooterProps> = ({
  cursorPosition,
  language = 'plaintext',
  onOpenExtensions,
}) => {
  const { dirtyFileIds, isSaving } = useFileStore();
  const { isExtensionInstalled, getExtensionForLanguage } = useExtensionStore();
  const hasDirty = dirtyFileIds.length > 0;

  const normalizedLang = language.toLowerCase();
  const isDefaultCompiler = normalizedLang === 'c' || normalizedLang === 'cpp';
  const matchingExt = getExtensionForLanguage(normalizedLang);
  const isExtInstalled = matchingExt ? isExtensionInstalled(matchingExt.id) : false;

  return (
    <footer className="h-6 border-t border-editor-border bg-surface-400 px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none shrink-0">
      {/* Left Sync Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">CRDT Sync Active</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {isSaving ? (
            <span className="text-gold-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-ping" />
              Saving...
            </span>
          ) : hasDirty ? (
            <span className="text-gold-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {dirtyFileIds.length} unsaved
            </span>
          ) : (
            <span className="text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Right Cursor, Indentation & Language */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:inline">Spaces: 2</span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="hidden sm:inline">UTF-8</span>
        <span className="hidden sm:inline text-slate-600">|</span>

        {/* Compiler / Extension Status Chip */}
        <button
          onClick={onOpenExtensions}
          className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-surface-200 transition-colors"
          title={
            isDefaultCompiler
              ? 'Default Built-in Core Compiler (C & C++)'
              : isExtInstalled
              ? `${matchingExt?.name} Installed & Ready`
              : `Extension Required for ${language.toUpperCase()} execution (Click to install)`
          }
        >
          {isDefaultCompiler ? (
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <Cpu className="h-3 w-3" />
              <span>GCC (Default)</span>
            </span>
          ) : isExtInstalled ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Boxes className="h-3 w-3" />
              <span>{matchingExt?.name.split(' ')[0] || language} (Active)</span>
            </span>
          ) : matchingExt ? (
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Boxes className="h-3 w-3" />
              <span>+ Install {matchingExt.name.split(' ')[0]}</span>
            </span>
          ) : null}

          <span className="text-gold-400 font-bold uppercase ml-1">{language}</span>
        </button>
      </div>
    </footer>
  );
};

