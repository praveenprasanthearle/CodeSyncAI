import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { SocketManager } from './sockets';
import { YjsDocManager } from './sockets/yjsManager';

const startServer = async (): Promise<void> => {
  // Connect to Database
  await connectDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  SocketManager.initialize(httpServer);

  httpServer.listen(env.PORT, env.HOST, () => {
    console.log(`🚀 CodeSync AI Backend running on ${env.HOST}:${env.PORT} in [${env.NODE_ENV}] mode`);
    console.log(`📡 Socket.IO gateway ready at http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}`);
    console.log(`🔗 API Base: http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}/api/v1`);
    console.log(`🩺 Health check: http://${env.HOST === '0.0.0.0' ? 'localhost' : env.HOST}:${env.PORT}/api/v1/health`);
  });

  // Graceful Shutdown Handling
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    await YjsDocManager.getInstance().flushAll();
    SocketManager.getInstance().io.disconnectSockets(true);
    httpServer.close(async () => {
      console.log('HTTP and Socket server closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      console.error('⚠️ Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});
