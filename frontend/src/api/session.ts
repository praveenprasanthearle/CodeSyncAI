let memoryToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();
export const getAccessToken = (): string | null => {
  try { return localStorage.getItem('codesync_access_token') || memoryToken; }
  catch { return memoryToken; }
};
export const setAccessToken = (token: string | null): void => {
  memoryToken = token;
  try {
    if (token) localStorage.setItem('codesync_access_token', token);
    else localStorage.removeItem('codesync_access_token');
  } catch { /* Retain a working in-memory session when browser storage is unavailable. */ }
  listeners.forEach(listener => listener(token));
};
export const subscribeAccessToken = (listener: (token: string | null) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
