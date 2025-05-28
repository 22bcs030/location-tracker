import dotenv from 'dotenv';
import app from './app';
import { connectDB } from './config/database';
import { initializeSocketIO } from './sockets';
import http from 'http';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocketIO(server);

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

startServer(); 