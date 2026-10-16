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
    <div className="flex-1 flex flex-col bg-white overflow-hidden text-slate-800 select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/80 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Extensions & Compilers
              </h3>
              <p className="text-[10px] text-slate-500">
                Default: C & C++ • Modular Language Packs
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab Selector (All vs Installed) */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 rounded transition-colors text-center font-medium ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Marketplace ({AVAILABLE_EXTENSIONS.length})
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`flex-1 py-1 rounded transition-colors text-center font-medium ${
              activeTab === 'installed'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
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
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
              className={`px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
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
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] leading-tight">{notification.message}</span>
          </div>
          <button
            onClick={clearNotification}
            className="text-slate-400 hover:text-slate-700 ml-2"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Extensions List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
        {filteredExtensions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="font-semibold text-slate-700">No extensions found</p>
            <p className="text-[11px] mt-1 text-slate-500">Try tweaking your search or filter.</p>
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
                    ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                    : isInstalled
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-3 flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0 mt-0.5 shadow-xs">
                      {getExtensionIcon(ext.iconType)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ext.name}
                        </span>

                        {ext.isBuiltIn ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 text-[9px] font-mono font-medium">
                            <ShieldCheck className="h-2.5 w-2.5" /> Built-in
                          </span>
                        ) : isInstalled ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-mono font-medium">
                            <Check className="h-2.5 w-2.5" /> Installed
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                        <span>{ext.version}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          {ext.rating}
                        </span>
                        <span>•</span>
                        <span>{ext.downloads}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {ext.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {ext.isBuiltIn ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 text-[10px] font-mono font-medium">
                        Default
                      </span>
                    ) : isInstalled ? (
                      <button
                        onClick={() => uninstallExtension(ext.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 text-[11px] font-mono transition-colors"
                        title="Uninstall extension"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => installExtension(ext.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 text-[11px] font-medium transition-colors shadow-xs"
                      >
                        <Download className="h-3 w-3" />
                        <span>Install</span>
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ext.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                  <div className="p-3 pt-0 border-t border-slate-100 bg-slate-50/50 mt-1 space-y-2 text-xs font-sans animate-in fade-in duration-150">
                    <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Author: {ext.author}</span>
                      <span>Category: {ext.category}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono font-semibold text-slate-700 uppercase tracking-wider">
                        Key Features:
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600">
                        {ext.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        File Extensions:
                      </span>
                      {ext.fileExtensions.map((fext) => (
                        <span
                          key={fext}
                          className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200"
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
      <div className="p-2.5 px-3 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5 text-blue-600">
          <Info className="h-3 w-3" />
          <span>C & C++ are default compilers</span>
        </div>
        <span>{installedCount} of {AVAILABLE_EXTENSIONS.length} Active</span>
      </div>
    </div>
  );
};
