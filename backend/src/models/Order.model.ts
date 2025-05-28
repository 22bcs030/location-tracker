import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  deliveryPartnerId?: mongoose.Types.ObjectId;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'assigned' | 'picked' | 'in_transit' | 'delivered' | 'cancelled';
  pickupLocation: ILocation;
  deliveryLocation: ILocation;
  currentLocation?: ILocation;
  locationHistory: ILocation[];
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'assigned', 'picked', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    pickupLocation: {
      type: LocationSchema,
      required: true,
    },
    deliveryLocation: {
      type: LocationSchema,
      required: true,
    },
    currentLocation: {
      type: LocationSchema,
    },
    locationHistory: [LocationSchema],
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
OrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Generate a unique order number if not provided
    if (!this.orderNumber) {
      const date = new Date();
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.orderNumber = `ORD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${randomPart}`;
    }
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema); 