import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    // For development without MongoDB, just log and return success
    if (process.env.USE_IN_MEMORY_DB === 'true') {
      logger.info('Using development mode without MongoDB connection');
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery-tracking';
    
    try {
      const conn = await mongoose.connect(mongoURI);
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      logger.warn('Continuing without database connection - some features may not work');
    }
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
};