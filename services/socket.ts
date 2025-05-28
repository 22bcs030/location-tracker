import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Record<string, Function[]> = {};

  // Initialize socket connection
  connect(token?: string) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Restore any registered event listeners
    Object.keys(this.listeners).forEach((event) => {
      this.listeners[event].forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });

    return this.socket;
  }

  // Connect to the public tracking namespace (no auth required)
  connectToTracking() {
    const trackingSocket = io(`${SOCKET_URL}/tracking`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    trackingSocket.on('connect', () => {
      console.log('Tracking socket connected');
    });

    trackingSocket.on('disconnect', () => {
      console.log('Tracking socket disconnected');
    });

    trackingSocket.on('error', (error) => {
      console.error('Tracking socket error:', error);
    });

    return trackingSocket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Add event listener
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  // Remove event listener
  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  // Emit event
  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.error('Socket not connected');
    }
  }

  // Join room
  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join:order', roomId);
    }
  }

  // Join tracking for a specific order
  joinTracking(orderNumber: string, trackingToken: string, socket: Socket) {
    socket.emit('join:order', { orderNumber, trackingToken });
  }

  // Update location (for delivery partners)
  updateLocation(orderId: string, location: { latitude: number; longitude: number; address?: string }) {
    if (this.socket) {
      this.socket.emit('location:update', {
        orderId,
        location,
      });
    }
  }

  // Update order status
  updateOrderStatus(orderId: string, status: string) {
    if (this.socket) {
      this.socket.emit('order:statusUpdate', {
        orderId,
        status,
      });
    }
  }

  // Assign delivery partner to order
  assignDeliveryPartner(orderId: string, deliveryPartnerId: string) {
    if (this.socket) {
      this.socket.emit('order:assign', {
        orderId,
        deliveryPartnerId,
      });
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 