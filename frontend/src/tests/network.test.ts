import { describe, it, expect, afterEach } from 'vitest';
import { getApiBaseUrl, getSocketUrl } from '../utils/network';

describe('Network URL Resolver Utility', () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it('should fallback to localhost when window is undefined', () => {
    (globalThis as any).window = undefined;
    expect(getApiBaseUrl()).toBe('http://localhost:5000/api/v1');
    expect(getSocketUrl()).toBe('http://localhost:5000');
  });

  it('should derive backend URLs from browser hostname when on LAN IP', () => {
    (globalThis as any).window = {
      location: {
        hostname: '192.168.1.105',
        protocol: 'http:',
        origin: 'http://192.168.1.105:5173',
      },
    };

    expect(getApiBaseUrl()).toBe('http://192.168.1.105:5000/api/v1');
    expect(getSocketUrl()).toBe('http://192.168.1.105:5000');
  });

  it('should derive localhost URLs when running on localhost', () => {
    (globalThis as any).window = {
      location: {
        hostname: 'localhost',
        protocol: 'http:',
        origin: 'http://localhost:5173',
      },
    };

    expect(getApiBaseUrl()).toBe('http://localhost:5000/api/v1');
    expect(getSocketUrl()).toBe('http://localhost:5000');
  });
});
