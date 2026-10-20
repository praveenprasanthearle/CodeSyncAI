/** Use the Vite/Nginx same-origin proxy unless a separate API is explicitly configured. */
export const getApiBaseUrl = (): string => import.meta.env.VITE_API_URL || '/api/v1';
export const getSocketUrl = (): string => import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_WS_URL ||
  (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5173');
