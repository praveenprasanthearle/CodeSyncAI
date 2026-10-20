import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient } from '../api/client';
import { useAiStore, buildAiHistory } from '../stores/aiStore';

const storage = () => {
  const values = new Map<string, string>();
  return { getItem: vi.fn((key: string) => values.get(key) || null), setItem: vi.fn((key: string, value: string) => values.set(key, value)), removeItem: vi.fn((key: string) => values.delete(key)) };
};
describe('Assistant conversation behavior', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', storage()); vi.stubGlobal('sessionStorage', storage()); useAiStore.getState().reset(); useAiStore.getState().setConversation('user:project-a'); });
  afterEach(() => { useAiStore.getState().reset(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('sends successful conversation turns on follow-up questions', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { reply: 'I will remember indigo.', model: 'test-provider' } });
    await useAiStore.getState().sendMessage('My notebook is indigo.');
    await useAiStore.getState().sendMessage('What color did I choose?');
    const payload: any = post.mock.calls[1][1];
    expect(payload.history).toEqual([{ role: 'user', content: 'My notebook is indigo.' }, { role: 'assistant', content: 'I will remember indigo.' }]);
    expect(post.mock.calls[1][2]?.timeout).toBeGreaterThan(45000);
  });
  it('shows provider errors and excludes failed turns from history', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Provider quota exhausted.'));
    await useAiStore.getState().sendMessage('Tell me about photosynthesis.');
    const state = useAiStore.getState();
    expect(state.messages.at(-1)?.text).toBe('Provider quota exhausted.');
    expect(state.messages.at(-1)?.status).toBe('error');
    expect(buildAiHistory(state.messages)).toEqual([]);
    expect(state.isLoading).toBe(false);
  });
  it('prevents duplicate concurrent submissions', async () => {
    let resolve!: (value: any) => void;
    const post = vi.spyOn(apiClient, 'post').mockImplementation(() => new Promise(done => { resolve = done; }));
    const pending = useAiStore.getState().sendMessage('First question');
    await useAiStore.getState().sendMessage('Accidental double submit');
    expect(post).toHaveBeenCalledTimes(1);
    resolve({ data: { reply: 'Answer', model: 'test-provider' } }); await pending;
    expect(useAiStore.getState().messages.filter(m => m.sender === 'user')).toHaveLength(1);
  });
  it('ignores late responses after clearing a conversation', async () => {
    let resolve!: (value: any) => void;
    vi.spyOn(apiClient, 'post').mockImplementation(() => new Promise(done => { resolve = done; }));
    const pending = useAiStore.getState().sendMessage('Old request');
    useAiStore.getState().clearHistory();
    resolve({ data: { reply: 'Late answer', model: 'test-provider' } }); await pending;
    expect(useAiStore.getState().messages).toHaveLength(1);
    expect(useAiStore.getState().messages[0].text).toContain('history cleared');
  });
  it('keeps histories separate across workspaces', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { reply: 'Project A answer', model: 'test-provider' } });
    await useAiStore.getState().sendMessage('Project A secret context');
    useAiStore.getState().setConversation('user:project-b');
    await useAiStore.getState().sendMessage('Project B question');
    expect((post.mock.calls[1][1] as any).history).toEqual([]);
    useAiStore.getState().setConversation('user:project-a');
    expect(useAiStore.getState().messages.some(m => m.text === 'Project A secret context')).toBe(true);
  });
  it('stores provider keys in tab storage and removes legacy persistent keys', () => {
    useAiStore.getState().configure('gemini', 'test-key-not-a-real-secret');
    expect(sessionStorage.setItem).toHaveBeenCalled();
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(localStorage.removeItem).toHaveBeenCalledWith('codesync_gemini_api_key');
  });
});
