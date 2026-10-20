import { create } from 'zustand';
import { ApiError, apiClient } from '../api/client';
import { IFileNode } from '../types';

export type AiProvider = 'auto' | 'gemini' | 'openai';
type Action = 'chat' | 'explain' | 'refactor' | 'fix' | 'tests';
export interface AiMessage {
  id: string; sender: 'user' | 'ai'; text: string; timestamp: string;
  codeSnippet?: string; language?: string; model?: string; contextText?: string;
  status: 'welcome' | 'pending' | 'complete' | 'error'; truncated?: boolean;
}
interface AiState {
  messages: AiMessage[]; isLoading: boolean; activeAction: Action | null;
  apiKey: string | null; provider: AiProvider; activeModel: string;
  connectionState: 'unconfigured' | 'configured' | 'connected' | 'error';
  serviceError: string | null;
  conversationId: string | null; conversations: Record<string, AiMessage[]>;
  configure: (provider: AiProvider, key: string | null) => void;
  checkConnection: (provider: AiProvider, key: string | null) => Promise<void>;
  loadStatus: () => Promise<void>;
  setConversation: (id: string) => void;
  sendMessage: (message: string, activeFile?: IFileNode | null, selectedCode?: string) => Promise<void>;
  explainCode: (code: string, language?: string) => Promise<void>;
  refactorCode: (code: string, language?: string, instruction?: string) => Promise<void>;
  fixError: (code: string, errorMessage: string, language?: string) => Promise<void>;
  generateTests: (code: string, language?: string, framework?: string) => Promise<void>;
  cancelRequest: () => void; retryLastRequest: () => Promise<void>; clearHistory: () => void; reset: () => void;
}
const timestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const welcome = (text = 'Ask me about coding, learning, writing, or everyday questions. Connect Gemini or OpenAI in Settings to start a conversation.'): AiMessage => ({ id: id(), sender: 'ai', text, timestamp: timestamp(), status: 'welcome' });
const storedConfiguration = (): { provider: AiProvider; apiKey: string | null } => {
  try {
    // Remove the legacy persistent key; new keys last only for this browser tab.
    localStorage.removeItem('codesync_gemini_api_key');
    const value = JSON.parse(sessionStorage.getItem('codesync_ai_provider') || 'null');
    if (value && ['gemini', 'openai'].includes(value.provider) && typeof value.apiKey === 'string') return value;
  } catch { /* Storage can be unavailable in private browsing or tests. */ }
  return { provider: 'auto', apiKey: null };
};
const extractCode = (text: string) => {
  const match = text.match(/```([\w+#.-]*)\s*\n([\s\S]*?)```/);
  return match ? { language: match[1] || undefined, codeSnippet: match[2].trim() } : {};
};
const OUTDATED_SERVER = 'Your CodeSync backend is out of date. Pull the latest changes and restart both the backend and frontend. The old AI engine returns code templates instead of real answers.';
const assertCompatible = (data: any) => {
  if (data?.contractVersion !== 1) throw new Error(OUTDATED_SERVER);
  if (!['gemini', 'openai'].includes(data.provider) || typeof data.model !== 'string' || !data.model.trim()) {
    throw new Error('The AI server returned invalid provider information. Restart the backend and retry.');
  }
};
const backendStatus = async (signal?: AbortSignal) => {
  try {
    const response: any = await apiClient.get('/ai/status', { signal });
    assertCompatible(response?.data);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) throw new Error(OUTDATED_SERVER);
    throw error;
  }
};

/** Only successful exchanges enter the provider's context; welcome/errors never do. */
export const buildAiHistory = (messages: AiMessage[]) => {
  const result = messages.filter(m => m.status === 'complete').map(m => ({ role: m.sender === 'user' ? 'user' as const : 'assistant' as const, content: (m.contextText || m.text).slice(0, 16000) })).slice(-20);
  while (result.reduce((sum, m) => sum + m.content.length, 0) > 60000) result.shift();
  while (result[0]?.role === 'assistant') result.shift();
  return result;
};

let controller: AbortController | null = null;
let generation = 0;
type RequestSpec = { action: Action; text: string; payload: Record<string, unknown>; format: (data: any) => string; contextText?: string };
let lastRequest: RequestSpec | null = null;
const invalidate = () => { generation++; controller?.abort(); controller = null; };
const perform = async (request: RequestSpec) => {
  const state = useAiStore.getState();
  if (state.isLoading) return;
  const requestId = ++generation;
  controller = new AbortController();
  lastRequest = request;
  const userId = id();
  useAiStore.setState({ isLoading: true, activeAction: request.action, messages: [...state.messages, { id: userId, sender: 'user', text: request.text, contextText: request.contextText, status: 'pending', timestamp: timestamp() }] });
  try {
    // Check the connected server before sending a user's key to an older AI engine.
    await backendStatus(controller.signal);
    if (requestId !== generation) return;
    const response: any = await apiClient.post(`/ai/${({ fix: 'fix-error', tests: 'generate-tests' } as Record<string, string>)[request.action] || request.action}`, {
      ...request.payload, provider: state.provider, apiKey: state.apiKey || undefined,
    }, { signal: controller.signal, timeout: 65000 });
    if (requestId !== generation) return;
    const data = response?.data;
    assertCompatible(data);
    const text = request.format(data);
    if (!text?.trim()) throw new Error('The AI service returned no answer. Please retry.');
    useAiStore.setState(current => ({
      messages: [...current.messages.map(m => m.id === userId ? { ...m, status: 'complete' as const } : m), { id: id(), sender: 'ai', text, status: 'complete', model: data.model, truncated: data.truncated, timestamp: timestamp(), ...extractCode(text) }],
      activeModel: data.model, connectionState: 'connected', serviceError: null,
    }));
  } catch (error: any) {
    if (requestId !== generation) return;
    const cancelled = controller?.signal.aborted;
    useAiStore.setState(current => ({
      messages: [...current.messages.map(m => m.id === userId ? { ...m, status: 'error' as const } : m), { id: id(), sender: 'ai', text: cancelled ? 'Request cancelled.' : error.message || 'Unable to reach the AI service. Please retry.', status: 'error', timestamp: timestamp() }],
      connectionState: cancelled ? current.connectionState : 'error',
      serviceError: cancelled ? current.serviceError : error.message === OUTDATED_SERVER ? OUTDATED_SERVER : null,
    }));
  } finally {
    if (requestId === generation) { controller = null; useAiStore.setState({ isLoading: false, activeAction: null }); }
  }
};

export const useAiStore = create<AiState>((set, get) => ({
  messages: [welcome()], isLoading: false, activeAction: null,
  ...storedConfiguration(), activeModel: '', connectionState: 'unconfigured', serviceError: null, conversationId: null, conversations: {},
  configure: (provider, apiKey) => {
    const clean = apiKey?.trim() || null;
    try {
      localStorage.removeItem('codesync_gemini_api_key');
      if (clean) sessionStorage.setItem('codesync_ai_provider', JSON.stringify({ provider, apiKey: clean }));
      else sessionStorage.removeItem('codesync_ai_provider');
    } catch { /* Keep configuration in memory when storage is unavailable. */ }
    set({ provider: clean ? provider : 'auto', apiKey: clean, activeModel: '', connectionState: clean ? 'configured' : 'unconfigured', serviceError: null });
  },
  checkConnection: async (provider, apiKey) => {
    await backendStatus();
    const response: any = await apiClient.post('/ai/check', { provider, apiKey: apiKey?.trim() || undefined }, { timeout: 65000 });
    assertCompatible(response?.data);
    if (!response?.data?.verified) throw new Error('The AI connection could not be verified.');
    get().configure(provider, apiKey);
    set({ activeModel: response.data.model, connectionState: 'connected' });
  },
  loadStatus: async () => {
    try {
      const status = await backendStatus();
      if (!get().apiKey) set({ activeModel: status.model, connectionState: status.configured ? 'configured' : 'unconfigured', serviceError: null });
      else set({ connectionState: get().connectionState === 'connected' ? 'connected' : 'configured', serviceError: null });
    } catch (error: any) { set({ connectionState: 'error', serviceError: error.message || 'Unable to reach the AI server.' }); }
  },
  setConversation: conversationId => {
    if (conversationId === get().conversationId) return;
    invalidate(); lastRequest = null;
    const previous = get();
    const conversations = { ...previous.conversations, ...(previous.conversationId ? { [previous.conversationId]: previous.messages.filter(m => m.status !== 'pending') } : {}) };
    set({ conversations, conversationId, messages: conversations[conversationId] || [welcome()], isLoading: false, activeAction: null });
  },
  sendMessage: async (message, activeFile, selectedCode) => {
    if (!message.trim()) return;
    const payload: Record<string, unknown> = { message: message.trim(), history: buildAiHistory(get().messages) };
    if (activeFile) payload.activeFile = { name: activeFile.name, path: activeFile.path, language: activeFile.language || 'plaintext', content: activeFile.content || '' };
    if (selectedCode) payload.selectedCode = selectedCode;
    const context = [activeFile ? `Attached file ${activeFile.path}:\n${activeFile.content || ''}` : '', selectedCode ? `Selected code:\n${selectedCode}` : ''].filter(Boolean).join('\n\n');
    const contextText = context ? `${message.trim()}\n\nEditor context (reference data):\n${context}`.slice(0, 16000) : undefined;
    await perform({ action: 'chat', text: message.trim(), contextText, payload, format: data => data.reply });
  },
  explainCode: async (code, language = 'javascript') => {
    if (!code.trim()) return;
    await perform({ action: 'explain', text: `Explain this ${language} code`, contextText: `Explain this ${language} code:\n${code}`, payload: { code, language }, format: data => `${data.explanation}\n\n**Time:** ${data.timeComplexity}\n\n**Auxiliary space:** ${data.spaceComplexity}` });
  },
  refactorCode: async (code, language = 'javascript', instruction = 'Improve readability while preserving behavior') => {
    if (!code.trim()) return;
    await perform({ action: 'refactor', text: `Refactor: ${instruction}`, contextText: `Refactor this ${language} code: ${instruction}\n${code}`, payload: { code, language, instruction }, format: data => `\`\`\`${language}\n${data.refactoredCode}\n\`\`\`\n\n${data.changes.map((change: string) => `- ${change}`).join('\n')}` });
  },
  fixError: async (code, errorMessage, language = 'javascript') => {
    if (!code.trim()) return;
    await perform({ action: 'fix', text: `Fix: ${errorMessage}`, contextText: `Fix this ${language} code. Error: ${errorMessage}\n${code}`, payload: { code, errorMessage, language }, format: data => `${data.diagnosis}\n\n\`\`\`${language}\n${data.fixedCode}\n\`\`\`` });
  },
  generateTests: async (code, language = 'javascript', framework) => {
    if (!code.trim()) return;
    await perform({ action: 'tests', text: `Generate tests for this ${language} code`, contextText: `Generate tests for this ${language} code:\n${code}`, payload: { code, language, framework }, format: data => `**${data.framework}**\n\n\`\`\`${language}\n${data.testSuite}\n\`\`\`` });
  },
  cancelRequest: () => controller?.abort(),
  retryLastRequest: async () => {
    if (!lastRequest || get().isLoading) return;
    const request = lastRequest;
    set(current => ({ messages: current.messages.slice(0, -2) }));
    await perform(request);
  },
  clearHistory: () => {
    invalidate(); lastRequest = null;
    set({ messages: [welcome('Conversation history cleared. What would you like help with?')], isLoading: false, activeAction: null });
  },
  reset: () => {
    invalidate(); lastRequest = null; get().configure('auto', null);
    set({ messages: [welcome()], conversations: {}, conversationId: null, isLoading: false, activeAction: null });
  },
}));
