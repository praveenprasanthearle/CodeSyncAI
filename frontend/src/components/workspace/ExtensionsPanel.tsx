import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Check,
  Download,
  Trash2,
  Star,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Terminal,
  Server,
  Zap,
  Coffee,
  Globe,
  Layers,
  Info,
  X,
} from 'lucide-react';
import {
  useExtensionStore,
  AVAILABLE_EXTENSIONS,
} from '../../stores/extensionStore';
import { IExtension, ExtensionCategory } from '../../types';

interface ExtensionsPanelProps {
  onClose?: () => void;
  onSelectLanguage?: (language: string) => void;
}

const CATEGORIES: (ExtensionCategory | 'All')[] = [
  'All',
  'Core Compilers',
  'Languages',
  'Runtimes',
  'Toolchains',
];

const getExtensionIcon = (iconType: IExtension['iconType']) => {
  switch (iconType) {
    case 'c':
      return <Cpu className="h-4 w-4 text-blue-400" />;
    case 'cpp':
      return <Cpu className="h-4 w-4 text-indigo-400" />;
    case 'python':
      return <Terminal className="h-4 w-4 text-yellow-400" />;
    case 'javascript':
      return <Server className="h-4 w-4 text-emerald-400" />;
    case 'typescript':
      return <Layers className="h-4 w-4 text-sky-400" />;
    case 'go':
      return <Zap className="h-4 w-4 text-cyan-400" />;
    case 'rust':
      return <Boxes className="h-4 w-4 text-orange-400" />;
    case 'java':
      return <Coffee className="h-4 w-4 text-rose-400" />;
    default:
      return <Globe className="h-4 w-4 text-slate-400" />;
  }
};

export const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ onClose }) => {
  const {
    searchQuery,
    selectedCategory,
    notification,
    installExtension,
    uninstallExtension,
    isExtensionInstalled,
    setSearchQuery,
    setSelectedCategory,
    clearNotification,
  } = useExtensionStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'installed'>('all');

  const filteredExtensions = AVAILABLE_EXTENSIONS.filter((ext) => {
    // Tab filter
    if (activeTab === 'installed' && !isExtensionInstalled(ext.id)) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && ext.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = ext.name.toLowerCase().includes(q);
      const matchDesc = ext.description.toLowerCase().includes(q);
      const matchLang = ext.language.toLowerCase().includes(q);
      const matchExts = ext.fileExtensions.some((e) => e.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchLang && !matchExts) {
        return false;
      }
    }

    return true;
  });

  const installedCount = AVAILABLE_EXTENSIONS.filter((e) => isExtensionInstalled(e.id)).length;

  return (
    <div className="flex-1 flex flex-col bg-surface-300 overflow-hidden text-slate-200 select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-editor-border bg-surface-400 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Extensions & Compilers
              </h3>
              <p className="text-[10px] text-slate-400">
                Default: C & C++ • Modular Language Packs
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-200"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab Selector (All vs Installed) */}
        <div className="flex items-center p-0.5 rounded-lg bg-surface-300 border border-surface-50 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 rounded transition-colors text-center font-medium ${
              activeTab === 'all'
                ? 'bg-surface-100 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Marketplace ({AVAILABLE_EXTENSIONS.length})
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`flex-1 py-1 rounded transition-colors text-center font-medium ${
              activeTab === 'installed'
                ? 'bg-surface-100 text-gold-300 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Installed ({installedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search compilers, extensions (.py, .go)..."
            className="w-full rounded-lg border border-surface-50 bg-surface-200/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-mono">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-gold-400/20 text-gold-300 border-gold-400/40 font-semibold'
                  : 'bg-surface-200/70 text-slate-400 border-surface-50/70 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-2.5 px-3 border-b text-xs flex items-center justify-between shrink-0 font-sans ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
              : 'bg-surface-200 border-surface-50 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] leading-tight">{notification.message}</span>
          </div>
          <button
            onClick={clearNotification}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
        {filteredExtensions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-slate-400">No extensions found</p>
            <p className="text-[11px] mt-1">Try tweaking your search or filter.</p>
          </div>
        ) : (
          filteredExtensions.map((ext) => {
            const isInstalled = isExtensionInstalled(ext.id);
            const isExpanded = expandedId === ext.id;

            return (
              <div
                key={ext.id}
                className={`rounded-xl border transition-all duration-200 ${
                  ext.isBuiltIn
                    ? 'bg-surface-200/90 border-blue-500/30 shadow-sm'
                    : isInstalled
                    ? 'bg-surface-200/80 border-surface-50/90 hover:border-gold-400/40'
                    : 'bg-surface-300/60 border-surface-50/60 hover:border-slate-600'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-3 flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-surface-300 border border-surface-50 shrink-0 mt-0.5">
                      {getExtensionIcon(ext.iconType)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {ext.name}
                        </span>

                        {ext.isBuiltIn ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 text-[9px] font-mono font-medium">
                            <ShieldCheck className="h-2.5 w-2.5" /> Built-in
                          </span>
                        ) : isInstalled ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-mono font-medium">
                            <Check className="h-2.5 w-2.5" /> Installed
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>{ext.version}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Star className="h-2.5 w-2.5 fill-amber-400" />
                          {ext.rating}
                        </span>
                        <span>•</span>
                        <span>{ext.downloads}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {ext.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {ext.isBuiltIn ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-100 text-slate-400 border border-surface-50 px-2 py-1 text-[10px] font-mono font-medium">
                        Default
                      </span>
                    ) : isInstalled ? (
                      <button
                        onClick={() => uninstallExtension(ext.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-surface-100 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-surface-50 px-2 py-1 text-[11px] font-mono transition-colors"
                        title="Uninstall extension"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => installExtension(ext.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-gold-500 hover:bg-gold-400 text-background px-2.5 py-1 text-[11px] font-semibold transition-all shadow-gold-sm hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Download className="h-3 w-3" />
                        <span>Install</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ext.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-100 transition-colors"
                      title={isExpanded ? 'Collapse specs' : 'View specs'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="p-3 pt-0 border-t border-surface-50/60 mt-1 space-y-2 text-xs font-sans animate-in fade-in duration-150">
                    <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Author: {ext.author}</span>
                      <span>Category: {ext.category}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono font-semibold text-gold-300 uppercase tracking-wider">
                        Key Features:
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-300">
                        {ext.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-gold-400" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-mono text-slate-400">
                        File Extensions:
                      </span>
                      {ext.fileExtensions.map((fext) => (
                        <span
                          key={fext}
                          className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-surface-50"
                        >
                          {fext}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Panel Footer Info Strip */}
      <div className="p-2.5 px-3 border-t border-editor-border bg-surface-400 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5 text-blue-400">
          <Info className="h-3 w-3" />
          <span>C & C++ are default compilers</span>
        </div>
        <span>{installedCount} of {AVAILABLE_EXTENSIONS.length} Active</span>
      </div>
    </div>
  );
};
