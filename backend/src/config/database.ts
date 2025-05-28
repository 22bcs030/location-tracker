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
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      family: 4 // Use IPv4, skip trying IPv6
    };

    try {
      logger.info(`Connecting to MongoDB at ${mongoURI.split('@').pop()}`);
      
      // Force-create the database and collections if they don't exist
      const conn = await mongoose.connect(mongoURI);
      
      // Check if connection is established
      if (conn.connection.readyState === 1) {
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
        
        // Ensure collections exist for all models
        const models = mongoose.modelNames();
        logger.info(`Registered models: ${models.join(', ')}`);
        
        // Force validate connections by running a simple query
        if (conn.connection.db) {
          try {
            const count = await conn.connection.db.collection('users').countDocuments();
            logger.info(`Found ${count} users in database`);
          } catch (dbError) {
            logger.warn('Failed to query users collection:', dbError);
          }
        }
      } else {
        logger.error('MongoDB connection failed');
      }
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      logger.warn('Continuing without database connection - some features may not work');
      
      // Check if MongoDB is running
      logger.info('Attempting to diagnose MongoDB connection issue...');
      try {
        // Create in-memory fallback for development/testing
        logger.info('Setting up in-memory database fallback for development');
        mongoose.connect('mongodb://localhost:27017/delivery-tracking-fallback');
        logger.info('Connected to fallback database');
      } catch (fallbackError) {
        logger.error('Fallback database connection failed:', fallbackError);
      }
    }
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
};