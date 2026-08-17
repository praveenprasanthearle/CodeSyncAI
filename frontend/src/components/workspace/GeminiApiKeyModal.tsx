import React, { useState } from 'react';
import { Key, Eye, EyeOff, Check, Sparkles, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { useAiStore } from '../../stores/aiStore';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { geminiApiKey, setGeminiApiKey } = useAiStore();
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim() || null);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKeyInput('');
    setGeminiApiKey(null);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-purple-500/30 bg-surface-300/95 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-50/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Google Gemini 2.0 Settings</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {geminiApiKey ? '🟢 Live Gemini Pro Connected' : '⚡ CodeSync Smart Offline Engine'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-200 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Provide your Google AI Studio API key to enable unlimited, real-time code generation, deep multi-file reasoning, and chat pair programming with <strong>Gemini 2.0 Flash</strong>.
        </p>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 font-mono">
              Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Key className="h-4 w-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-surface-50 bg-surface-200 py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-3 text-[11px] text-purple-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-purple-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Free & Secure</span>
            </div>
            <p className="text-slate-400">
              Your API key is saved locally in your browser storage and never leaked or logged.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gold-400 hover:underline font-mono pt-1"
            >
              <span>Get a free Gemini API Key at Google AI Studio</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-50/70">
            {geminiApiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-all"
              >
                Clear Key
              </button>
            )}

            <div className="flex-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-surface-200 hover:bg-surface-100 border border-surface-50 text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Save Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
