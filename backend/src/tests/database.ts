import { MongoMemoryServer } from 'mongodb-memory-server';

// Tests connect over TCP; disabling unused Unix sockets also supports restricted hosts.
export const createTestDatabase = () => MongoMemoryServer.create({
  instance: { args: process.platform === 'win32' ? [] : ['--nounixsocket'] },
});
