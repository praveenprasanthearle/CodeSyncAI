// Test-only secrets make a fresh checkout runnable without a developer's .env.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'codesync-test-access-secret-not-for-deployment';
process.env.JWT_REFRESH_SECRET ||= 'codesync-test-refresh-secret-not-for-deployment';
