import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Vendor specific routes
router.post('/vendor/register', register);
router.post('/vendor/login', login);

// Delivery partner specific routes
router.post('/delivery/register', register);
router.post('/delivery/login', login);

export const authRoutes = router; 