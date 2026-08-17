import { create } from 'zustand';
import { apiClient } from '../api/client';
import { IFileNode } from '../types';

export interface AiMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  language?: string;
  model?: string;
}

interface AiState {
  messages: AiMessage[];
  isLoading: boolean;
  activeAction: 'chat' | 'explain' | 'refactor' | 'fix' | 'tests' | null;
  geminiApiKey: string | null;
  activeModel: string;

  // Actions
  setGeminiApiKey: (key: string | null) => void;
  sendMessage: (
    message: string,
    activeFile?: IFileNode | null,
    selectedCode?: string
  ) => Promise<void>;
  explainCode: (code: string, language?: string) => Promise<void>;
  refactorCode: (code: string, language?: string, instruction?: string) => Promise<void>;
  fixError: (code: string, errorMessage: string, language?: string) => Promise<void>;
  generateTests: (code: string, language?: string, framework?: string) => Promise<void>;
  clearHistory: () => void;
}

const extractCodeSnippet = (text: string): { snippet?: string; language?: string } => {
  const match = text.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
  if (match) {
    return {
      language: match[1] || 'code',
      snippet: match[2].trim(),
    };
  }
  return {};
};

const getStoredApiKey = (): string | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('codesync_gemini_api_key');
    }
  } catch (_e) {
    // Ignore storage error
  }
  return null;
};

export const useAiStore = create<AiState>((set, get) => ({
  messages: [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: 'Hello! I am your CodeSync AI pair programmer. Ask me to write algorithms, explain files, fix errors, or click one of the quick actions below.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'codesync-engine',
    },
  ],
  isLoading: false,
  activeAction: null,
  geminiApiKey: getStoredApiKey(),
  activeModel: 'gemini-2.0-flash',

  setGeminiApiKey: (key: string | null) => {
    const clean = key && key.trim() ? key.trim() : null;
    try {
      if (typeof localStorage !== 'undefined') {
        if (clean) {
          localStorage.setItem('codesync_gemini_api_key', clean);
        } else {
          localStorage.removeItem('codesync_gemini_api_key');
        }
      }
    } catch (_e) {
      // Ignore storage error
    }
    set({ geminiApiKey: clean });
  },

  sendMessage: async (message: string, activeFile?: IFileNode | null, selectedCode?: string) => {
    if (!message.trim()) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      activeAction: 'chat',
    }));

    try {
      const payload: any = {
        message,
        apiKey: get().geminiApiKey || undefined,
      };
      if (activeFile) {
        payload.activeFile = {
          name: activeFile.name,
          path: activeFile.path,
          language: activeFile.language || 'c',
          content: activeFile.content || '',
        };
      }
      if (selectedCode) {
        payload.selectedCode = selectedCode;
      }

      const res: any = await apiClient.post('/ai/chat', payload);
      const replyText = res?.data?.reply || 'Processed your code request.';
      const usedModel = res?.data?.model || 'codesync-smart-engine';

      const { snippet, language } = extractCodeSnippet(replyText);

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        codeSnippet: snippet,
        language: language || activeFile?.language || 'c',
        model: usedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        messages: [...state.messages, aiMsg],
        activeModel: usedModel,
      }));
    } catch (err: any) {
      const errMsg: AiMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Error connecting to AI service: ${err.response?.data?.error?.message || err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      set((state) => ({ messages: [...state.messages, errMsg] }));
    } finally {
      set({ isLoading: false, activeAction: null });
    }
  },

  explainCode: async (code: string, language = 'c') => {
    if (!code.trim()) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `Explain this ${language} code`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      activeAction: 'explain',
    }));

    try {
      const res: any = await apiClient.post('/ai/explain', {
        code,
        language,
        apiKey: get().geminiApiKey || undefined,
      });
      const data = res?.data;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `${data.explanation}\n\n**Complexity Analysis**:\n- ⚡ Time: \`${data.timeComplexity}\`\n- 💾 Space: \`${data.spaceComplexity}\``,
        model: data.model || 'codesync-smart-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({ messages: [...state.messages, aiMsg] }));
    } catch (err: any) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `err-${Date.now()}`,
            sender: 'ai',
            text: `Explanation failed: ${err.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
    } finally {
      set({ isLoading: false, activeAction: null });
    }
  },

  refactorCode: async (code: string, language = 'c', instruction = 'Optimize memory and modularize routines') => {
    if (!code.trim()) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `Refactor code: ${instruction}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      activeAction: 'refactor',
    }));

    try {
      const res: any = await apiClient.post('/ai/refactor', {
        code,
        language,
        instruction,
        apiKey: get().geminiApiKey || undefined,
      });
      const data = res?.data;

      const { snippet } = extractCodeSnippet(data.refactoredCode);
      const cleanSnippet = snippet || data.refactoredCode;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### ⚡ Refactored Implementation\n\`\`\`${language}\n${cleanSnippet}\n\`\`\`\n\n**Key Improvements**:\n${(data.changes || []).map((c: string) => `- ${c}`).join('\n')}`,
        codeSnippet: cleanSnippet,
        language,
        model: data.model || 'codesync-smart-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({ messages: [...state.messages, aiMsg] }));
    } catch (err: any) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `err-${Date.now()}`,
            sender: 'ai',
            text: `Refactoring failed: ${err.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
    } finally {
      set({ isLoading: false, activeAction: null });
    }
  },

  fixError: async (code: string, errorMessage: string, language = 'c') => {
    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `Fix error: "${errorMessage}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      activeAction: 'fix',
    }));

    try {
      const res: any = await apiClient.post('/ai/fix-error', {
        code,
        errorMessage,
        language,
        apiKey: get().geminiApiKey || undefined,
      });
      const data = res?.data;

      const { snippet } = extractCodeSnippet(data.fixedCode);
      const cleanSnippet = snippet || data.fixedCode;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### 🛠️ Error Diagnosis\n${data.diagnosis}\n\n### Corrected Code\n\`\`\`${language}\n${cleanSnippet}\n\`\`\``,
        codeSnippet: cleanSnippet,
        language,
        model: data.model || 'codesync-smart-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({ messages: [...state.messages, aiMsg] }));
    } catch (err: any) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `err-${Date.now()}`,
            sender: 'ai',
            text: `Error fix failed: ${err.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
    } finally {
      set({ isLoading: false, activeAction: null });
    }
  },

  generateTests: async (code: string, language = 'c', framework = 'vitest') => {
    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `Generate automated test suite for this module`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      activeAction: 'tests',
    }));

    try {
      const res: any = await apiClient.post('/ai/generate-tests', {
        code,
        language,
        framework,
        apiKey: get().geminiApiKey || undefined,
      });
      const data = res?.data;

      const { snippet } = extractCodeSnippet(data.testSuite);
      const cleanSnippet = snippet || data.testSuite;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### 🧪 Generated Test Suite (${data.framework.toUpperCase()})\n\`\`\`${language}\n${cleanSnippet}\n\`\`\``,
        codeSnippet: cleanSnippet,
        language,
        model: data.model || 'codesync-smart-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({ messages: [...state.messages, aiMsg] }));
    } catch (err: any) {
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `err-${Date.now()}`,
            sender: 'ai',
            text: `Test generation failed: ${err.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }));
    } finally {
      set({ isLoading: false, activeAction: null });
    }
  },

  clearHistory: () => {
    set({
      messages: [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: 'Conversation history cleared. How can I assist you with your code today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: 'codesync-engine',
        },
      ],
    });
  },
}));
