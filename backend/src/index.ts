import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import routes from './api/routes/index.js';
import { setupChatHandler } from './websocket/chat.handler.js';
import { errorHandler, notFoundHandler } from './api/middleware/error.middleware.js';
import { requestLogger } from './api/middleware/logger.middleware.js';
import { validateEnvironment, printStartupInfo } from './utils/validation.js';

// Validate environment
const validation = validateEnvironment();
if (!validation.valid) {
  console.error('❌ Environment validation failed:');
  validation.errors.forEach((err) => console.error(`  - ${err}`));
  console.error('\nPlease check your .env file and try again.\n');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// WebSocket handlers
setupChatHandler(io);

// Start server
httpServer.listen(config.port, () => {
  printStartupInfo();
  console.log(`🚀 Server running on http://localhost:${config.port}`);
  console.log(`📡 WebSocket server ready`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});
