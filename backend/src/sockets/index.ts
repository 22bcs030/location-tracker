import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { verifyJwtSocket } from '../middleware/authMiddleware';
import { Order } from '../models/Order.model';

let io: Server;

export const initializeSocketIO = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Create a separate namespace for public tracking (no auth required)
  const trackingNamespace = io.of('/tracking');
  
  // Handle connections to the tracking namespace
  trackingNamespace.on('connection', (socket: Socket) => {
    logger.info(`Public tracking client connected: ${socket.id}`);
    
    // Handle joining order tracking rooms
    socket.on('join:order', async (data: { orderNumber: string, trackingToken: string }) => {
      try {
        const { orderNumber, trackingToken } = data;
        
        // Verify order exists (in a real app, verify tracking token too)
        const order = await Order.findOne({ orderNumber });
        
        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        // Join the order room to receive updates
        socket.join(`order:${orderNumber}`);
        logger.info(`Client ${socket.id} joined tracking for order ${orderNumber}`);
        
        // Send initial order status
        socket.emit('order:status', {
          orderNumber,
          status: order.status,
          currentLocation: order.currentLocation
        });
      } catch (error) {
        logger.error('Error joining order tracking:', error);
        socket.emit('error', { message: 'Failed to join order tracking' });
      }
    });
    
    // Handle disconnections
    socket.on('disconnect', () => {
      logger.info(`Public tracking client disconnected: ${socket.id}`);
    });
  });

  // The main namespace with authentication
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
    
    // Allow users to join specific order rooms they have access to
    socket.on('join:order', async (orderId: string) => {
      try {
        // Verify user has access to this order
        const order = await Order.findById(orderId);
        
        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        // Check permission based on role
        if (
          (userRole === 'vendor' && order.vendorId.toString() !== userId) ||
          (userRole === 'delivery' && order.deliveryPartnerId?.toString() !== userId)
        ) {
          socket.emit('error', { message: 'Not authorized to access this order' });
          return;
        }
        
        // Join the order room
        socket.join(`order:${orderId}`);
        logger.info(`${userRole} ${userId} joined order room: ${orderId}`);
        
        // Also join the order room by order number for tracking updates
        socket.join(`order:${order.orderNumber}`);
      } catch (error) {
        logger.error('Error joining order room:', error);
        socket.emit('error', { message: 'Failed to join order room' });
      }
    });
    
    // Handle location updates from delivery partners
    socket.on('location:update', async (data) => {
      const { orderId, location } = data;
      
      try {
        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        // Verify this delivery partner is assigned to the order
        if (userRole !== 'delivery' || order.deliveryPartnerId?.toString() !== userId) {
          socket.emit('error', { message: 'Not authorized to update this order location' });
          return;
        }
        
        // Update order with new location
        order.currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '',
          timestamp: new Date()
        };
        
        // Add to location history
        order.locationHistory.push(order.currentLocation);
        
        // Save the updated order
        await order.save();
      
        // Broadcast to order rooms (both by ID and orderNumber)
        const updateData = {
          orderId,
          orderNumber: order.orderNumber,
          location: order.currentLocation,
          deliveryPartnerId: userId,
        };
        
        io.to(`order:${orderId}`).emit('location:updated', updateData);
        io.to(`order:${order.orderNumber}`).emit('location:updated', updateData);
        
        // Also broadcast to vendor
        io.to(`vendor:${order.vendorId}`).emit('location:updated', updateData);
      } catch (error) {
        logger.error('Error updating location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });
    
    // Handle order assignment
    socket.on('order:assign', async (data) => {
      const { orderId, deliveryPartnerId } = data;
      
      try {
        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        // Verify this vendor owns the order
        if (userRole !== 'vendor' || order.vendorId.toString() !== userId) {
          socket.emit('error', { message: 'Not authorized to assign this order' });
          return;
        }
        
        // Update order with delivery partner
        order.deliveryPartnerId = deliveryPartnerId;
        order.status = 'assigned';
        await order.save();
        
        // Notify the delivery partner
        io.to(`delivery:${deliveryPartnerId}`).emit('order:assigned', {
          orderId,
          orderNumber: order.orderNumber,
          vendorId: userId,
        });
        
        // Broadcast to order rooms
        const updateData = {
          orderId,
          orderNumber: order.orderNumber,
          status: 'assigned',
          deliveryPartnerId,
          updatedBy: userId,
          updatedByRole: userRole,
        };
        
        io.to(`order:${orderId}`).emit('order:statusUpdated', updateData);
        io.to(`order:${order.orderNumber}`).emit('order:statusUpdated', updateData);
      } catch (error) {
        logger.error('Error assigning order:', error);
        socket.emit('error', { message: 'Failed to assign order' });
      }
    });
    
    // Handle order status updates
    socket.on('order:statusUpdate', async (data) => {
      const { orderId, status } = data;
      
      try {
        // Find the order
        const order = await Order.findById(orderId);
        
        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        // Verify user has permission to update this order
        if (
          (userRole === 'vendor' && order.vendorId.toString() !== userId) ||
          (userRole === 'delivery' && order.deliveryPartnerId?.toString() !== userId)
        ) {
          socket.emit('error', { message: 'Not authorized to update this order' });
          return;
        }
        
        // Update order status
        order.status = status;
        
        // If delivered, set actual delivery time
        if (status === 'delivered') {
          order.actualDeliveryTime = new Date();
        }
        
        await order.save();
        
        // Broadcast to all relevant parties
        const updateData = {
          orderId,
          orderNumber: order.orderNumber,
          status,
          updatedBy: userId,
          updatedByRole: userRole,
        };
        
        io.to(`order:${orderId}`).emit('order:statusUpdated', updateData);
        io.to(`order:${order.orderNumber}`).emit('order:statusUpdated', updateData);
        
        // Also notify vendor and delivery partner specifically
        if (order.vendorId) {
          io.to(`vendor:${order.vendorId}`).emit('order:statusUpdated', updateData);
        }
        
        if (order.deliveryPartnerId) {
          io.to(`delivery:${order.deliveryPartnerId}`).emit('order:statusUpdated', updateData);
        }
      } catch (error) {
        logger.error('Error updating order status:', error);
        socket.emit('error', { message: 'Failed to update order status' });
      }
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