import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types/auth.types';
import { logger } from '../utils/logger';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  vendorId?: mongoose.Types.ObjectId; // For delivery partners assigned to vendors
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in query results by default
    },
    role: {
      type: String,
      enum: ['vendor', 'delivery', 'customer'],
      required: [true, 'Role is required'],
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function(this: IUser) {
        return this.role === 'delivery';
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Log any errors that occur when saving a user
UserSchema.post('save', function(error: any, doc: any, next: any) {
  if (error) {
    logger.error(`Error saving user: ${error.message}`);
    if (error.code === 11000) {
      logger.error(`Duplicate key error: ${JSON.stringify(error.keyValue)}`);
    }
  }
  next(error);
});

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  try {
    logger.info(`Saving user with email: ${this.email}, role: ${this.role}`);

    if (!this.isModified('password')) {
      return next();
    }

    logger.info('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    logger.info('Password hashed successfully');
    next();
  } catch (error) {
    logger.error('Error hashing password:', error);
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    logger.error('Error comparing passwords:', error);
    return false;
  }
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function (): string {
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    logger.info(`Generating token for user: ${this._id}, role: ${this.role}`);
    return jwt.sign(
      { id: this._id, role: this.role },
      jwtSecret,
      { expiresIn: '30d' }
    );
  } catch (error) {
    logger.error('Error generating token:', error);
    return '';
  }
};

export const User = mongoose.model<IUser>('User', UserSchema); 