/**
 * Environment-aware URL resolution for CodeSync AI frontend.
 * Enables zero-config local LAN testing across devices on the same Wi-Fi
 * while preserving localhost dev and production container behavior.
 */

export const getApiBaseUrl = (): string => {
  // 1. Explicitly configured API URL takes highest precedence
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Production mode without override: use relative path for reverse proxy/Nginx
  if (import.meta.env.PROD) {
    return '/api/v1';
  }

  // 3. Local development: derive backend host dynamically from current browser hostname
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const port = import.meta.env.VITE_BACKEND_PORT || '5000';
    return `${protocol}//${hostname}:${port}/api/v1`;
  }

  return 'http://localhost:5000/api/v1';
};

export const getSocketUrl = (): string => {
  // 1. Explicitly configured Socket/WS URL takes highest precedence
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // 2. Production mode without override: use same origin (Nginx proxies /socket.io/)
  if (import.meta.env.PROD) {
    return typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  }

  // 3. Local development: derive backend host dynamically from current browser hostname
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const port = import.meta.env.VITE_BACKEND_PORT || '5000';
    return `${protocol}//${hostname}:${port}`;
  }

  return 'http://localhost:5000';
};
