import express from 'express';
import cors from 'cors';
import { createRoutes } from './routes.js';
import { MemStorage } from './storage.js';
import { createServer } from 'vite';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize storage
const storage = new MemStorage();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use(createRoutes(storage));

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

async function startServer() {
  try {
    // Create Vite server for development
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: '../client'
    });
    
    // Use Vite's connect instance as middleware
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Informatica Migration Tool running on http://0.0.0.0:${PORT}`);
      console.log(`📊 Dashboard: http://0.0.0.0:${PORT}`);
      console.log(`🔌 API: http://0.0.0.0:${PORT}/api`);
      console.log(`📡 Real-time sync enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();