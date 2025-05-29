export type OrderStatus = "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialRequests?: string;
}

export interface AssignedOrder {
  id: string;
  orderNumber: string;
  vendorName: string;
  vendorId?: string;
  vendorAddress: string;
  vendorPhone: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  commission: number;
  status: OrderStatus;
  orderType: "delivery" | "pickup";
  paymentMethod: string;
  specialInstructions?: string;
  createdAt: string;
  assignedAt: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  distance: string;
  customerRating?: number;
  deliveryNotes?: string;
  pickupAddress: string;
  estimatedTime: string;
}

export interface AvailableOrder {
  id: string;
  orderNumber: string;
  vendorName: string;
  vendorId?: string;
  vendorAddress: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  pickupAddress: string;
  estimatedTime: string;
  distance: string;
  createdAt: string;
  paymentMethod: string;
  specialInstructions?: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
}

export interface TrackingSession {
  orderId: string;
  startTime: string;
  endTime?: string;
  locations: LocationData[];
  isActive: boolean;
  deviceInfo?: {
    deviceId: string;
    platform: string;
    appVersion: string;
    batteryLevel?: number;
  };
  statistics?: {
    totalDistance: number;
    averageSpeed: number;
    locationPointsCount: number;
    batteryConsumption: number;
  };
}

export interface DeliveryStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalEarnings: number;
  todayEarnings: number;
  averageRating: number;
  deliveryEfficiency: number; // percentage
}

export interface FilterOptions {
  status?: OrderStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  vendor?: string;
  customer?: string;
  minTotal?: number;
  maxTotal?: number;
} 