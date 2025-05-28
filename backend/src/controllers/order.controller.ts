import { Request, Response } from 'express';
import { Order } from '../models/Order.model';
import { User } from '../models/User.model';
import { logger } from '../utils/logger';
import { getIO } from '../sockets';
import { UserRole } from '../types/auth.types';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private - Vendors only
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      items,
      totalAmount,
      pickupLocation,
      deliveryLocation,
      notes,
      orderNumber
    } = req.body;

    // Validation
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        error: 'Please add at least one item',
      });
    }

    if (!pickupLocation || !deliveryLocation) {
      return res.status(400).json({
        success: false,
        error: 'Pickup and delivery locations are required',
      });
    }

    if (!totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Total amount is required',
      });
    }

    // Make sure we have a customerId - if not, use the current user as fallback
    const actualCustomerId = customerId || req.user?.id;
    if (!actualCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    // Generate a unique order number if not provided
    const generatedOrderNumber = orderNumber || `ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Create order
    const order = await Order.create({
      orderNumber: generatedOrderNumber,
      customerId: actualCustomerId,
      vendorId: req.user?.id,
      items,
      totalAmount,
      pickupLocation,
      deliveryLocation,
      notes,
      locationHistory: [pickupLocation],
    });

    // Emit socket event
    getIO().to(`vendor:${req.user?.id}`).emit('order:created', { order });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Get all orders (filtered by user role)
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req: Request, res: Response) => {
  try {
    let query = {};

    // If vendor, only show orders for this vendor
    if (req.user?.role === 'vendor') {
      query = { vendorId: req.user.id };
    }
    
    // If delivery partner, only show orders assigned to them
    if (req.user?.role === 'delivery') {
      query = { deliveryPartnerId: req.user.id };
    }
    
    // Add status filter if provided
    if (req.query.status) {
      query = { ...query, status: req.query.status };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Latest first
      .populate('customerId', 'name email')
      .populate('vendorId', 'name email')
      .populate('deliveryPartnerId', 'name email');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('vendorId', 'name email')
      .populate('deliveryPartnerId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check permissions - Only allow access to relevant users
    const userRole = req.user?.role as UserRole;
    
    // Vendor can only access their own orders
    if (userRole === 'vendor' && order.vendorId.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order',
      });
    }
    
    // Delivery partner can only access orders assigned to them
    if (userRole === 'delivery' && order.deliveryPartnerId?.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private - Delivery partners only
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['picked', 'in_transit', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Allowed values: picked, in_transit, delivered',
      });
    }

    // Find order
    const order = await Order.findById(req.params.id);

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
        error: 'Not authorized to update this order',
      });
    }

    // Update status
    order.status = status;
    
    // If delivered, set actual delivery time
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Emit socket event
    getIO().to(`order:${order._id}`).emit('order:statusUpdated', {
      orderId: order._id,
      status,
      updatedBy: req.user?.id,
      updatedByRole: req.user?.role,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Assign delivery partner to order
// @route   PUT /api/orders/:id/assign
// @access  Private - Vendors only
export const assignDeliveryPartner = async (req: Request, res: Response) => {
  try {
    const { deliveryPartnerId } = req.body;

    // Find order
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Check if the order belongs to this vendor
    if (order.vendorId.toString() !== req.user?.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order',
      });
    }

    // Verify delivery partner exists and belongs to this vendor
    const deliveryPartner = await User.findOne({
      _id: deliveryPartnerId,
      role: 'delivery',
      vendorId: req.user?.id,
    });

    if (!deliveryPartner) {
      return res.status(404).json({
        success: false,
        error: 'Delivery partner not found or not associated with your account',
      });
    }

    // Update order
    order.deliveryPartnerId = deliveryPartnerId;
    order.status = 'assigned';
    await order.save();

    // Emit socket event
    getIO().to(`delivery:${deliveryPartnerId}`).emit('order:assigned', {
      orderId: order._id,
      vendorId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Assign delivery partner error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
}; 