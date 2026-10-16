import { CorsOptions } from 'cors';
import { env } from './env';

/**
 * Regex matching valid development origins:
 * - localhost / 127.0.0.1 on any port
 * - RFC 1918 Private IPv4 ranges (10.x.x.x, 172.16.x.x-172.31.x.x, 192.168.x.x) on any port
 * - mDNS local hostnames (*.local) on any port
 */
const LAN_DEV_ORIGIN_REGEX =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9-]+\.local)(:\d+)?$/;

/**
 * Checks whether an incoming request origin is allowed based on the environment.
 */
export const isOriginAllowed = (origin?: string): boolean => {
  // Allow non-browser requests (Supertest, curl, server-to-server, or same-origin)
  if (!origin) {
    return true;
  }

  // Always allow the configured primary CLIENT_URL
  if (origin === env.CLIENT_URL) {
    return true;
  }

  // In production, strictly restrict to CLIENT_URL
  if (env.NODE_ENV === 'production') {
    return false;
  }

  // In development and testing, safely allow private LAN addresses and localhost
  return LAN_DEV_ORIGIN_REGEX.test(origin);
};

export const corsOptions: CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (isOriginAllowed(requestOrigin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
