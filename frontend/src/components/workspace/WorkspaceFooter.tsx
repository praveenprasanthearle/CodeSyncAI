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
    <footer className="h-6 border-t border-slate-200/80 bg-white px-3 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none shrink-0">
      {/* Left Sync Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <Wifi className="h-3 w-3" />
          <span className="hidden sm:inline">CRDT synced</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {isSaving ? (
            <span className="text-blue-600 flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Saving...
            </span>
          ) : hasDirty ? (
            <span className="text-amber-600 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3 w-3" />
              {dirtyFileIds.length} unsaved
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
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
        <span className="hidden sm:inline text-slate-300">|</span>
        <span className="hidden sm:inline">Spaces: 2</span>
        <span className="hidden sm:inline text-slate-300">|</span>
        <span className="hidden sm:inline">UTF-8</span>
        <span className="hidden sm:inline text-slate-300">|</span>

        {/* Compiler / Extension Status */}
        <button
          onClick={onOpenExtensions}
          className="flex items-center gap-1 hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-100 transition-colors"
          title={
            isDefaultCompiler
              ? 'Default Built-in Core Compiler (C & C++)'
              : isExtInstalled
              ? `${matchingExt?.name} Installed & Ready`
              : `Extension Required for ${language.toUpperCase()} execution`
          }
        >
          {isDefaultCompiler ? (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <Cpu className="h-3 w-3" />
              <span>GCC</span>
            </span>
          ) : isExtInstalled ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Boxes className="h-3 w-3" />
              <span>{matchingExt?.name.split(' ')[0] || language}</span>
            </span>
          ) : matchingExt ? (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <Boxes className="h-3 w-3" />
              <span>+ Install {matchingExt.name.split(' ')[0]}</span>
            </span>
          ) : null}

          <span className="text-slate-700 font-semibold uppercase ml-1">{language}</span>
        </button>
      </div>
    </footer>
  );
};
