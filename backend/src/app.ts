import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Adjusted for development with Monaco & WebSockets
      crossOriginEmbedderPolicy: false,
    })
  );

  // Cross-Origin Resource Sharing
  app.use(cors(corsOptions));

  // Request body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request logger
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Master API routes
  app.use('/api/v1', apiRoutes);

  // Central error handling middleware
  app.use(errorHandler);

  return app;
};
