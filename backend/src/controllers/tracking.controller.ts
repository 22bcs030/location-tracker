import { Request, Response } from 'express';
import { Order } from '../models/Order.model';
import { logger } from '../utils/logger';

// Simple tracking token generation (in a real app, this would be more secure)
const generateTrackingToken = (orderNumber: string): string => {
  return Buffer.from(`${orderNumber}-${Date.now()}`).toString('base64');
};

// @desc    Track an order by order number and tracking token
// @route   GET /api/tracking/:orderNumber/:trackingToken
// @access  Public
export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { orderNumber, trackingToken } = req.params;

    // In a real implementation, validate the tracking token
    // For now, just find by order number (no security)
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Prepare tracking info for response
    const trackingInfo = {
      orderNumber: order.orderNumber,
      status: order.status,
      currentLocation: order.currentLocation,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      deliveryPartnerAssigned: !!order.deliveryPartnerId,
      deliveryLocation: {
        latitude: order.deliveryLocation.latitude,
        longitude: order.deliveryLocation.longitude,
        address: order.deliveryLocation.address,
      },
      updatedAt: order.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: trackingInfo,
    });
  } catch (error) {
    logger.error('Track order error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Helper to generate a tracking URL for a given order
export const generateTrackingUrl = (
  order: any,
  baseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:3000/track'
): string => {
  const token = generateTrackingToken(order.orderNumber);
  return `${baseUrl}/${order.orderNumber}/${token}`;
}; 