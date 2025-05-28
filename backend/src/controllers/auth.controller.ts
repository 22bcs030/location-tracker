import { Request, Response } from 'express';
import { User, IUser } from '../models/User.model';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    logger.info(`Registration attempt for ${email} with role ${role}`);

    if (!name || !email || !password || !role) {
      logger.warn(`Registration failed: Missing required fields for ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, password and role',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      logger.warn(`Registration failed: User ${email} already exists`);
      return res.status(400).json({
        success: false,
        error: 'User already exists',
      });
    }

    // Validate role
    if (!['vendor', 'delivery', 'customer'].includes(role)) {
      logger.warn(`Registration failed: Invalid role ${role} for ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }

    // Check for vendor ID if role is delivery
    if (role === 'delivery' && !req.body.vendorId) {
      logger.warn(`Registration failed: Vendor ID required for delivery partner ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Vendor ID is required for delivery partners',
      });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      ...(role === 'delivery' && { vendorId: req.body.vendorId }),
    };
    
    logger.info(`Creating new user: ${JSON.stringify({ ...userData, password: '[REDACTED]' })}`);
    
    let user;
    try {
      user = await User.create(userData);
      logger.info(`User created successfully with ID: ${user._id}`);
    } catch (createError: any) {
      logger.error(`Failed to create user in database: ${createError.message}`);
      
      // Try to provide helpful error messages
      if (createError.name === 'ValidationError') {
        const validationErrors = Object.keys(createError.errors).map(
          key => createError.errors[key].message
        );
        logger.error(`Validation errors: ${validationErrors.join(', ')}`);
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors,
        });
      }
      
      if (createError.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
        });
      }
      
      throw createError; // rethrow for general error handling
    }

    // Generate token
    const token = user.generateAuthToken();
    logger.info(`Generated token for user ${user._id}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration',
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    logger.info(`Login attempt for ${email}`);

    // Validate email & password
    if (!email || !password) {
      logger.warn(`Login failed: Missing email or password for ${email || 'unknown'}`);
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      logger.warn(`Login failed: User not found for ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate token
    const token = user.generateAuthToken();
    logger.info(`Login successful for ${email} (${user._id})`);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
      message: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);

    if (!user) {
      logger.warn(`Profile fetch failed: User not found for ID ${req.user?.id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.info(`Profile fetched for user ${user._id}`);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === 'delivery' && { vendorId: user.vendorId }),
      },
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    logger.info(`Profile update attempt for user ${req.user?.id}`);

    // Find user
    const user = await User.findById(req.user?.id);

    if (!user) {
      logger.warn(`Profile update failed: User not found for ID ${req.user?.id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    logger.info(`Profile updated for user ${user._id}`);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
    });
  }
}; 