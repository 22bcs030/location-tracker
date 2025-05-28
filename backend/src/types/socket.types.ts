import { LocationData } from './order.types';
import { UserRole } from './auth.types';

export interface LocationUpdateEvent {
  orderId: string;
  location: LocationData;
  deliveryPartnerId: string;
}

export interface OrderAssignedEvent {
  orderId: string;
  vendorId: string;
}

export interface OrderStatusUpdateEvent {
  orderId: string;
  status: string;
  updatedBy: string;
  updatedByRole: UserRole;
}

export interface SocketAuthData {
  token: string;
}

export interface SocketUser {
  id: string;
  role: UserRole;
}

// Define your own socket data
declare module 'socket.io' {
  interface SocketData {
    user?: SocketUser;
  }
} 