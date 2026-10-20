import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiError, apiClient } from '../api/client';
import { useAiStore, buildAiHistory } from '../stores/aiStore';

const storage = () => {
  const values = new Map<string, string>();
  return { getItem: vi.fn((key: string) => values.get(key) || null), setItem: vi.fn((key: string, value: string) => values.set(key, value)), removeItem: vi.fn((key: string) => values.delete(key)) };
};
const providerData = { contractVersion: 1, provider: 'gemini', model: 'test-provider' };
const answer = (reply: string) => ({ data: { ...providerData, reply } });
describe('Assistant conversation behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', storage()); vi.stubGlobal('sessionStorage', storage());
    useAiStore.getState().reset(); useAiStore.getState().setConversation('user:project-a');
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { ...providerData, configured: false } });
  });
  afterEach(() => { useAiStore.getState().reset(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it('sends successful conversation turns on follow-up questions', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(answer('I will remember indigo.'));
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
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledTimes(1);
    resolve(answer('Answer')); await pending;
    expect(useAiStore.getState().messages.filter(m => m.sender === 'user')).toHaveLength(1);
  });
  it('ignores late responses after clearing a conversation', async () => {
    let resolve!: (value: any) => void;
    vi.spyOn(apiClient, 'post').mockImplementation(() => new Promise(done => { resolve = done; }));
    const pending = useAiStore.getState().sendMessage('Old request');
    await vi.waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(1));
    useAiStore.getState().clearHistory();
    resolve(answer('Late answer')); await pending;
    expect(useAiStore.getState().messages).toHaveLength(1);
    expect(useAiStore.getState().messages[0].text).toContain('history cleared');
  });
  it('keeps histories separate across workspaces', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(answer('Project A answer'));
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
  it('blocks an old backend before sending a key or accepting code templates', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new ApiError('Not found', 404));
    const post = vi.spyOn(apiClient, 'post');
    useAiStore.getState().configure('gemini', 'test-key-not-a-real-secret');
    await useAiStore.getState().sendMessage('Hello');
    expect(post).not.toHaveBeenCalled();
    expect(useAiStore.getState().messages.at(-1)?.text).toContain('backend is out of date');
    expect(buildAiHistory(useAiStore.getState().messages)).toEqual([]);
  });
  it('rejects legacy canned answers even if a different backend handled the POST', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { model: 'codesync-neural-core', reply: '#include <stdio.h>\nint main() { return 0; }' } });
    await useAiStore.getState().sendMessage('Write a leave application.');
    const state = useAiStore.getState();
    expect(state.messages.at(-1)?.status).toBe('error');
    expect(state.messages.some(message => message.text.includes('#include'))).toBe(false);
    expect(state.connectionState).toBe('error');
  });
  it('never marks an outdated verification response as a connected key', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { verified: true, model: 'codesync-neural-core' } });
    await expect(useAiStore.getState().checkConnection('gemini', 'test-custom-key')).rejects.toThrow('backend is out of date');
    expect(useAiStore.getState().apiKey).toBeNull();
  });
  it('checks backend compatibility even with a previously saved key', async () => {
    useAiStore.getState().configure('gemini', 'test-custom-key');
    vi.mocked(apiClient.get).mockResolvedValue({ data: { model: 'legacy' } });
    await useAiStore.getState().loadStatus();
    expect(useAiStore.getState().serviceError).toContain('backend is out of date');
  });
  it('retains explicitly attached context for follow-ups without attaching the editor to new topics', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue(answer('The function adds two values.'));
    const file: any = { name: 'sum.js', path: '/sum.js', content: 'function sum(a, b) { return a + b; }', language: 'javascript' };
    await useAiStore.getState().sendMessage('Explain this function.', file);
    await useAiStore.getState().sendMessage('Write a birthday wish for my friend.');
    const payload: any = post.mock.calls[1][1];
    expect(payload.message).toBe('Write a birthday wish for my friend.');
    expect(payload.activeFile).toBeUndefined();
    expect(payload.selectedCode).toBeUndefined();
    expect(payload.history[0].content).toContain(file.content);
    expect(payload.history[0].content).toContain('Explain this function.');
  });
});
