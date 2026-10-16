import { describe, it, expect } from 'vitest';
import { isOriginAllowed } from '../config/cors';
import { env } from '../config/env';

describe('CORS Origin Validation Utility', () => {
  it('should allow requests with no origin (e.g. mobile apps, curl, same-origin)', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
    expect(isOriginAllowed('')).toBe(true);
  });

  it('should allow the configured primary CLIENT_URL', () => {
    expect(isOriginAllowed(env.CLIENT_URL)).toBe(true);
  });

  it('should allow localhost and loopback origins in development', () => {
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);
  });

  it('should allow RFC 1918 private LAN IP addresses in development', () => {
    expect(isOriginAllowed('http://192.168.1.105:5173')).toBe(true);
    expect(isOriginAllowed('http://10.153.136.165:5173')).toBe(true);
    expect(isOriginAllowed('http://172.20.10.4:5173')).toBe(true);
    expect(isOriginAllowed('http://dev-laptop.local:5173')).toBe(true);
  });

  it('should reject untrusted external origins', () => {
    expect(isOriginAllowed('https://evil-attacker.com')).toBe(false);
    expect(isOriginAllowed('http://192.168.1.105.attacker.com')).toBe(false);
    expect(isOriginAllowed('http://phishing-site.xyz:5173')).toBe(false);
  });
});
