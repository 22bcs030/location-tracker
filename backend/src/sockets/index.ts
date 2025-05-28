import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { verifyJwtSocket } from '../middleware/authMiddleware';

let io: Server;

export const initializeSocketIO = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket middleware for authentication
  io.use(verifyJwtSocket);

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.user?.id;
    const userRole = socket.data.user?.role;
    
    logger.info(`User connected: ${userId} (${userRole})`);
    
    // Join user to their specific room based on role
    if (userRole === 'vendor') {
      socket.join(`vendor:${userId}`);
    } else if (userRole === 'delivery') {
      socket.join(`delivery:${userId}`);
    } else if (userRole === 'customer') {
      socket.join(`customer:${userId}`);
    }
    
    // Handle location updates from delivery partners
    socket.on('location:update', (data) => {
      const { orderId, location } = data;
      
      // Broadcast to vendor and customer rooms
      socket.to(`order:${orderId}`).emit('location:updated', {
        orderId,
        location,
        deliveryPartnerId: userId,
      });
    });
    
    // Handle order assignment
    socket.on('order:assign', (data) => {
      const { orderId, deliveryPartnerId } = data;
      
      // Notify the delivery partner
      io.to(`delivery:${deliveryPartnerId}`).emit('order:assigned', {
        orderId,
        vendorId: userId,
      });
    });
    
    // Handle order status updates
    socket.on('order:statusUpdate', (data) => {
      const { orderId, status } = data;
      
      // Broadcast to all relevant parties
      io.to(`order:${orderId}`).emit('order:statusUpdated', {
        orderId,
        status,
        updatedBy: userId,
        updatedByRole: userRole,
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });
  });
  
  logger.info('Socket.IO initialized');
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}; 