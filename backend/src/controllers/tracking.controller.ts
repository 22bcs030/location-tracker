import { Request, Response } from 'express';
import { Order } from '../models/Order.model';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Generate secure tracking token
const generateTrackingToken = (orderNumber: string): string => {
  // Create a more secure token using HMAC
  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret');
  hmac.update(`${orderNumber}-${Date.now()}`);
  return hmac.digest('hex');
};

// Verify tracking token
const verifyTrackingToken = async (orderNumber: string, token: string): Promise<boolean> => {
  try {
    // Find order by number
    const order = await Order.findOne({ orderNumber });
    
    // If no order found, token is invalid
    if (!order) return false;
    
    // If order has a stored token, verify it matches
    if (order.trackingToken) {
      return order.trackingToken === token;
    }
    
    // For backward compatibility, if no token stored, accept any token
    return true;
  } catch (error) {
    logger.error('Token verification error:', error);
    return false;
  }
};

// @desc    Track an order by order number and tracking token
// @route   GET /api/tracking/:orderNumber/:trackingToken
// @access  Public
export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { orderNumber, trackingToken } = req.params;

    // Verify the tracking token
    const isValidToken = await verifyTrackingToken(orderNumber, trackingToken);
    if (!isValidToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid tracking token',
      });
    }

    const order = await Order.findOne({ orderNumber })
      .populate('vendorId', 'name')
      .populate('deliveryPartnerId', 'name');

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
      deliveryPartnerName: order.deliveryPartnerId ? (order.deliveryPartnerId as any).name : null,
      vendorName: order.vendorId ? (order.vendorId as any).name : null,
      pickupLocation: {
        latitude: order.pickupLocation.latitude,
        longitude: order.pickupLocation.longitude,
        address: order.pickupLocation.address,
      },
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

// @desc    Generate tracking link for an order
// @route   POST /api/tracking/generate/:orderId
// @access  Private - Vendors only
export const generateTrackingLink = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Verify this vendor owns the order
    if (req.user?.role === 'vendor' && order.vendorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order',
      });
    }

    // Generate tracking token
    const trackingToken = generateTrackingToken(order.orderNumber);
    
    // Save token to the order
    order.trackingToken = trackingToken;
    await order.save();

    // Generate tracking URL
    const trackingUrl = generateTrackingUrl(order, trackingToken);

    res.status(200).json({
      success: true,
      data: {
        trackingUrl,
        trackingToken,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    logger.error('Generate tracking link error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// Helper to generate a tracking URL for a given order
export const generateTrackingUrl = (
  order: any,
  token: string,
  baseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:3000/track'
): string => {
  return `${baseUrl}/${order.orderNumber}/${token}`;
}; 