import express from 'express';
import { trackOrder, generateTrackingLink } from '../controllers/tracking.controller';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Public tracking route - accessible by link with order ID and unique tracking token
router.get('/:orderNumber/:trackingToken', trackOrder);

// Protected routes - require authentication
router.post('/generate/:orderId', protect, authorize('vendor'), generateTrackingLink);

export const trackingRoutes = router; 