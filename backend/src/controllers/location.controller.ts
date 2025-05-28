import { Request, Response } from 'express';
import { Order } from '../models/Order.model';
import { logger } from '../utils/logger';
import { getIO } from '../sockets';

// @desc    Update current location for an order
// @route   POST /api/location/:orderId
// @access  Private - Delivery partners only
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, address } = req.body;
    const { orderId } = req.params;

    // Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check if order is assigned to this delivery partner
    if (order.deliveryPartnerId?.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order location',
      });
    }

    // Create new location object
    const newLocation = {
      latitude,
      longitude,
      address: address || '',
      timestamp: new Date(),
    };

    // Update current location
    order.currentLocation = newLocation;
    
    // Add to location history
    order.locationHistory.push(newLocation);
    
    await order.save();

    // Emit socket event
    getIO().to(`order:${orderId}`).emit('location:updated', {
      orderId,
      location: newLocation,
      deliveryPartnerId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      data: newLocation,
    });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Get location history for an order
// @route   GET /api/location/:orderId/history
// @access  Private
export const getLocationHistory = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check permissions - Only allow access to relevant users
    if (
      req.user?.role === 'vendor' && order.vendorId.toString() !== req.user.id ||
      req.user?.role === 'delivery' && order.deliveryPartnerId?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order.locationHistory,
    });
  } catch (error) {
    logger.error('Get location history error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Get current location for an order
// @route   GET /api/location/:orderId/current
// @access  Private
export const getCurrentLocation = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check permissions - Only allow access to relevant users
    if (
      req.user?.role === 'vendor' && order.vendorId.toString() !== req.user.id ||
      req.user?.role === 'delivery' && order.deliveryPartnerId?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order',
      });
    }

    if (!order.currentLocation) {
      return res.status(404).json({
        success: false,
        error: 'Current location not available',
      });
    }

    res.status(200).json({
      success: true,
      data: order.currentLocation,
    });
  } catch (error) {
    logger.error('Get current location error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
}; 