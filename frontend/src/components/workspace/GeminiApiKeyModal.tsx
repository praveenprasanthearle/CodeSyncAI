import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react';
import { AiProvider, useAiStore } from '../../stores/aiStore';

interface GeminiApiKeyModalProps { isOpen: boolean; onClose: () => void }

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, provider, checkConnection, configure, loadStatus } = useAiStore();
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) { setSelectedProvider(provider === 'auto' ? 'gemini' : provider); setKeyInput(apiKey || ''); setError(''); setShowKey(false); }
  }, [isOpen, provider, apiKey]);
  if (!isOpen) return null;

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setIsChecking(true);
    try { await checkConnection(selectedProvider, keyInput); onClose(); }
    catch (failure: any) { setError(failure.message || 'Connection failed. Check your key and quota.'); }
    finally { setIsChecking(false); }
  };
  const useServer = async () => {
    setIsChecking(true); setError('');
    try { await checkConnection('auto', null); onClose(); }
    catch (failure: any) { setError(failure.message || 'No server provider is configured.'); }
    finally { setIsChecking(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="ai-settings-title" className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-glass-dropdown space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 id="ai-settings-title" className="font-semibold text-slate-900">AI Settings</h2><p className="text-xs text-slate-500 mt-1">General chat and code assistance</p></div>
          <button aria-label="Close AI Settings" onClick={onClose} disabled={isChecking} className="p-2 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-xs text-slate-600">Connect your own provider key or use the provider configured by the server owner. A short test request verifies the connection before saving.</p>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-xs font-medium text-slate-700">Provider
            <select aria-label="AI provider" value={selectedProvider} disabled={isChecking} onChange={e => { setSelectedProvider(e.target.value as AiProvider); setKeyInput(''); setError(''); }} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 bg-white">
              <option value="gemini">Google Gemini</option><option value="openai">OpenAI</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">API key
            <div className="relative mt-1">
              <input aria-label="Provider API key" type={showKey ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={keyInput} disabled={isChecking} onChange={e => setKeyInput(e.target.value)} placeholder={selectedProvider === 'gemini' ? 'Gemini API key' : 'OpenAI API key'} className="w-full rounded-lg border border-slate-200 p-2 pr-10 font-mono" />
              <button type="button" aria-label={showKey ? 'Hide API key' : 'Show API key'} onClick={() => setShowKey(!showKey)} className="absolute right-2 top-2 text-slate-400">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
            <p className="flex items-center gap-1.5 font-medium"><ShieldCheck className="h-4 w-4" />Saved for this browser tab</p>
            <p>Your key is sent to the CodeSync backend for provider requests and is not stored in its database. Only use a deployment you trust.</p>
            <a href={selectedProvider === 'gemini' ? 'https://aistudio.google.com/api-keys' : 'https://platform.openai.com/api-keys'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">Get a provider API key <ExternalLink className="h-3 w-3" /></a>
            <p className="text-slate-500">Your provider account's quota and billing apply.</p>
          </div>
          {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={isChecking || !keyInput.trim()} className="w-full flex justify-center items-center gap-2 rounded-lg bg-slate-900 text-white p-2 text-xs disabled:opacity-50">{isChecking && <Loader2 className="h-4 w-4 animate-spin" />}Verify and save key</button>
        </form>
        <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
          <button disabled={isChecking} onClick={useServer} className="text-xs text-blue-700 hover:underline disabled:opacity-50">Test server configuration</button>
          {apiKey && <button disabled={isChecking} onClick={() => { configure('auto', null); void loadStatus(); setKeyInput(''); }} className="text-xs text-rose-600 hover:underline">Remove saved key</button>}
        </div>
      </section>
    </div>
  );
};
