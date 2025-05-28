export type OrderStatus = 'pending' | 'accepted' | 'assigned' | 'picked' | 'in_transit' | 'delivered' | 'cancelled';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  pickupLocation: LocationData;
  deliveryLocation: LocationData;
  notes?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  vendorId: string;
  deliveryPartnerId?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  pickupLocation: LocationData;
  deliveryLocation: LocationData;
  currentLocation?: LocationData;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignDeliveryPartnerRequest {
  deliveryPartnerId: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface OrdersListResponse {
  success: boolean;
  count: number;
  data: OrderResponse[];
}

export interface OrderDetailResponse {
  success: boolean;
  data: OrderResponse;
} 