import express from 'express';
import { trackOrder } from '../controllers/tracking.controller';

const router = express.Router();

// Public tracking route - accessible by link with order ID and unique tracking token
router.get('/:orderNumber/:trackingToken', trackOrder);

export const trackingRoutes = router; 