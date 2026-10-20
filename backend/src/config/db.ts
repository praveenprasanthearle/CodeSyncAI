import mongoose from 'mongoose';
import { env } from './env';

let memServerInstance: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.DATABASE_URL, {
      autoIndex: true,
      serverSelectionTimeoutMS: 2000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.warn('Configured MongoDB is unavailable.');

    if (env.NODE_ENV !== 'production') {
      try {
        console.log('⚡ Initializing embedded in-memory MongoDB database for development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memServerInstance = await MongoMemoryServer.create({ instance: { args: process.platform === 'win32' ? [] : ['--nounixsocket'] } });
        const memUri = memServerInstance.getUri();
        await mongoose.connect(memUri);
        console.log(`✅ Embedded In-Memory MongoDB Connected at ${memUri}`);
        return;
      } catch (memErr: any) {
        console.error('❌ Failed to start in-memory MongoDB fallback:', memErr.message);
      }
    }

    throw new Error('Database connection failed. Configure DATABASE_URL before starting the server.');
  }

  mongoose.connection.on('error', (err) => {
    console.error('⚠️ MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  });
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memServerInstance) {
    await memServerInstance.stop();
  }
  console.log('MongoDB connection closed.');
};
