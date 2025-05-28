import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { orderRoutes } from './routes/order.routes';
import { locationRoutes } from './routes/location.routes';
import { trackingRoutes } from './routes/tracking.routes';
import mongoose from 'mongoose';
import { User } from './models/User.model';
import { logger } from './utils/logger';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// MongoDB diagnostic endpoint
app.get('/db-check', async (req: Request, res: Response) => {
  try {
    const dbStatus: {
      isConnected: boolean;
      connectionState: number;
      connectionStateName: string;
      host: string;
      name: string;
      models: string[];
      collections: string[];
    } = {
      isConnected: mongoose.connection.readyState === 1,
      connectionState: mongoose.connection.readyState,
      connectionStateName: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none',
      models: mongoose.modelNames(),
      collections: []
    };
    
    // Check if we can access collections
    if (mongoose.connection.db) {
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        dbStatus.collections = collections.map(c => c.name);
        
        // Try to count users
        const userCount = await User.countDocuments();
        
        // Get the most recent 5 users (if any)
        const recentUsers = await User.find()
          .select('name email role createdAt')
          .sort({ createdAt: -1 })
          .limit(5);
          
        return res.status(200).json({
          success: true,
          dbStatus,
          userCount,
          recentUsers: recentUsers.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
          }))
        });
      } catch (dbError: any) {
        logger.error('Error accessing database collections:', dbError);
        return res.status(500).json({
          success: false,
          dbStatus,
          error: 'Error accessing collections',
          message: dbError.message
        });
      }
    }
    
    return res.status(503).json({
      success: false,
      dbStatus,
      error: 'Database connection not fully established'
    });
  } catch (error: any) {
    logger.error('DB check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during DB check',
      message: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/tracking', trackingRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app; 