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
    console.warn(`⚠️ Local MongoDB (${env.DATABASE_URL}) not reachable: ${error.message}`);

    if (env.NODE_ENV !== 'production') {
      try {
        console.log('⚡ Initializing embedded in-memory MongoDB database for development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memServerInstance = await MongoMemoryServer.create();
        const memUri = memServerInstance.getUri();
        await mongoose.connect(memUri);
        console.log(`✅ Embedded In-Memory MongoDB Connected at ${memUri}`);
        return;
      } catch (memErr: any) {
        console.error('❌ Failed to start in-memory MongoDB fallback:', memErr.message);
      }
    }

    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
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
