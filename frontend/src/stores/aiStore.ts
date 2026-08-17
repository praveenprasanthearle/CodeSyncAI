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
}

interface AiState {
  messages: AiMessage[];
  isLoading: boolean;
  activeAction: 'chat' | 'explain' | 'refactor' | 'fix' | 'tests' | null;

  // Actions
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

export const useAiStore = create<AiState>((set) => ({
  messages: [
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: 'Hello! I am your CodeSync AI pair programmer powered by Google Gemini 2.0. Select code to refactor, explain, or click one of the quick actions below.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  isLoading: false,
  activeAction: null,

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
      const payload: any = { message };
      if (activeFile) {
        payload.activeFile = {
          name: activeFile.name,
          path: activeFile.path,
          language: activeFile.language || 'javascript',
          content: activeFile.content || '',
        };
      }
      if (selectedCode) {
        payload.selectedCode = selectedCode;
      }

      const res: any = await apiClient.post('/ai/chat', payload);
      const replyText = res?.data?.reply || 'I processed your code request.';

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({ messages: [...state.messages, aiMsg] }));
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

  explainCode: async (code: string, language = 'javascript') => {
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
      const res: any = await apiClient.post('/ai/explain', { code, language });
      const data = res?.data;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `${data.explanation}\n\n**Complexity Analysis**:\n- Time: \`${data.timeComplexity}\`\n- Space: \`${data.spaceComplexity}\``,
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

  refactorCode: async (code: string, language = 'javascript', instruction = 'Optimize and follow best practices') => {
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
      const res: any = await apiClient.post('/ai/refactor', { code, language, instruction });
      const data = res?.data;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### Refactored Implementation\n\`\`\`${language}\n${data.refactoredCode}\n\`\`\`\n\n**Key Improvements**:\n${(data.changes || []).map((c: string) => `- ${c}`).join('\n')}`,
        codeSnippet: data.refactoredCode,
        language,
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

  fixError: async (code: string, errorMessage: string, language = 'javascript') => {
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
      const res: any = await apiClient.post('/ai/fix-error', { code, errorMessage, language });
      const data = res?.data;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### Error Diagnosis\n${data.diagnosis}\n\n### Corrected Code\n\`\`\`${language}\n${data.fixedCode}\n\`\`\``,
        codeSnippet: data.fixedCode,
        language,
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

  generateTests: async (code: string, language = 'javascript', framework = 'vitest') => {
    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `Generate ${framework} tests for this module`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      activeAction: 'tests',
    }));

    try {
      const res: any = await apiClient.post('/ai/generate-tests', { code, language, framework });
      const data = res?.data;

      const aiMsg: AiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### Generated ${framework.toUpperCase()} Test Suite\n\`\`\`${language}\n${data.testSuite}\n\`\`\``,
        codeSnippet: data.testSuite,
        language,
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
        },
      ],
    });
  },
}));
