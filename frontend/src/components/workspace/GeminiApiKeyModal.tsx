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
    }, 600);
  };

  const handleClear = () => {
    setApiKeyInput('');
    setGeminiApiKey(null);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-glass-dropdown backdrop-blur-xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Configuration</h2>
              <p className="text-[11px] text-emerald-600 font-mono">
                {geminiApiKey ? 'Gemini 2.0 Connected' : 'Built-in Engine Active'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed">
          CodeSync AI includes a built-in neural fallback out of the box with zero API keys required. Optionally provide a Google Gemini API key below to connect live cloud models.
        </p>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Key className="h-3.5 w-3.5" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-700"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Saved locally</span>
            </div>
            <p className="text-slate-500">
              Your key is stored in your browser's local storage and used directly.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline pt-0.5"
            >
              <span>Get a free key from Google AI Studio</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {geminiApiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Clear key
              </button>
            )}

            <div className="flex-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white shadow-xs transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save key</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
