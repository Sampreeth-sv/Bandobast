import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { aiRouter } from './server/aiRoutes';

dotenv.config();

// Prevent unhandled promise rejections from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
});

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount modular AI & API routes
app.use('/api', aiRouter);

// Global error handling middleware - avoids leaking internal exceptions
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error Middleware]:', err?.message || err);
  if (res.headersSent) {
    return;
  }
  res.status(err.status || 500).json({
    success: false,
    error: 'An internal server error occurred. Please retry your request.'
  });
});

// Start server with Vite middleware in development or static dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist static assets
    app.use(express.static(path.resolve(import.meta.dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(import.meta.dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bandobast Event Operations Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
