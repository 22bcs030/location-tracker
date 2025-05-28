import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  assignDeliveryPartner 
} from '../controllers/order.controller';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// All routes below this are protected
router.use(protect);

// Routes for all authenticated users
router.get('/:id', getOrderById);

// Vendor specific routes
router.post('/', authorize('vendor'), createOrder);
router.get('/', authorize('vendor'), getOrders);
router.put('/:id/assign', authorize('vendor'), assignDeliveryPartner);

// Delivery partner specific routes
router.put('/:id/status', authorize('delivery'), updateOrderStatus);
router.get('/delivery/assigned', authorize('delivery'), getOrders);

export const orderRoutes = router; 