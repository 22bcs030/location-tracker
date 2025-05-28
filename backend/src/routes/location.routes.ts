import express from 'express';
import { 
  updateLocation, 
  getLocationHistory,
  getCurrentLocation
} from '../controllers/location.controller';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// All routes below this are protected
router.use(protect);

// Update current location (for delivery partners)
router.post('/:orderId', authorize('delivery'), updateLocation);

// Get location history of an order
router.get('/:orderId/history', getLocationHistory);

// Get current location of an order
router.get('/:orderId/current', getCurrentLocation);

export const locationRoutes = router; 