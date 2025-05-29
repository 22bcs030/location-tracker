import { io, Socket } from 'socket.io-client';
import { LocationData, TrackingSession } from '@/types/delivery';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

type EventCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  private trackingSocket: Socket | null = null;
  private listeners: Record<string, EventCallback[]> = {};
  private trackingListeners: Record<string, EventCallback[]> = {};
  private trackingSessions: Record<string, TrackingSession> = {};
  private locationUpdateIntervals: Record<string, NodeJS.Timeout> = {};
  private deviceInfo: any = null;

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
      this.initializeDeviceInfo();
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
    if (this.trackingSocket && this.trackingSocket.connected) {
      return this.trackingSocket;
    }
    
    this.trackingSocket = io(`${SOCKET_URL}/tracking`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.trackingSocket.on('connect', () => {
      console.log('Tracking socket connected');
    });

    this.trackingSocket.on('disconnect', () => {
      console.log('Tracking socket disconnected');
    });

    this.trackingSocket.on('error', (error) => {
      console.error('Tracking socket error:', error);
    });

    // Restore any registered tracking event listeners
    Object.keys(this.trackingListeners).forEach((event) => {
      this.trackingListeners[event].forEach((callback) => {
        this.trackingSocket?.on(event, callback);
      });
    });

    return this.trackingSocket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.trackingSocket) {
      this.trackingSocket.disconnect();
      this.trackingSocket = null;
    }
    
    // Clear all tracking intervals
    Object.keys(this.locationUpdateIntervals).forEach(orderId => {
      this.stopLocationUpdates(orderId);
    });
  }

  // Initialize device information
  private initializeDeviceInfo() {
    const userAgent = navigator.userAgent;
    let platform = 'unknown';
    
    if (/Windows/.test(userAgent)) platform = 'Windows';
    else if (/Android/.test(userAgent)) platform = 'Android';
    else if (/iPhone|iPad|iPod/.test(userAgent)) platform = 'iOS';
    else if (/Mac/.test(userAgent)) platform = 'Mac';
    else if (/Linux/.test(userAgent)) platform = 'Linux';
    
    this.deviceInfo = {
      deviceId: this.generateDeviceId(),
      platform,
      appVersion: '1.0.0', // Replace with actual app version
    };
  }
  
  // Generate a unique device ID
  private generateDeviceId(): string {
    // Try to get existing device ID from local storage
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) return storedDeviceId;
    
    // Generate a new device ID
    const newDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', newDeviceId);
    return newDeviceId;
  }

  // Add event listener
  on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  // Add tracking event listener
  onTracking(event: string, callback: EventCallback) {
    if (!this.trackingListeners[event]) {
      this.trackingListeners[event] = [];
    }
    this.trackingListeners[event].push(callback);

    if (this.trackingSocket) {
      this.trackingSocket.on(event, callback);
    }

    return () => this.offTracking(event, callback);
  }

  // Remove event listener
  off(event: string, callback: EventCallback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove tracking event listener
  offTracking(event: string, callback: EventCallback) {
    if (this.trackingListeners[event]) {
      this.trackingListeners[event] = this.trackingListeners[event].filter((cb) => cb !== callback);
    }

    if (this.trackingSocket) {
      this.trackingSocket.off(event, callback);
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

  // Emit tracking event
  emitTracking(event: string, data: any) {
    if (this.trackingSocket) {
      this.trackingSocket.emit(event, data);
    } else {
      console.error('Tracking socket not connected');
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

  // Start tracking session
  startTrackingSession(orderId: string, initialLocation: LocationData) {
    const session: TrackingSession = {
      orderId,
      startTime: new Date().toISOString(),
      locations: [initialLocation],
      isActive: true,
      deviceInfo: this.deviceInfo,
      statistics: {
        totalDistance: 0,
        averageSpeed: 0,
        locationPointsCount: 1,
        batteryConsumption: 0
      }
    };
    
    this.trackingSessions[orderId] = session;
    
    // Emit start tracking event
    if (this.socket) {
      this.socket.emit('tracking:start', {
        orderId,
        location: initialLocation,
        deviceInfo: this.deviceInfo,
        timestamp: new Date().toISOString()
      });
    }
    
    return session;
  }
  
  // End tracking session
  endTrackingSession(orderId: string) {
    const session = this.trackingSessions[orderId];
    if (!session) return null;
    
    session.isActive = false;
    session.endTime = new Date().toISOString();
    
    // Calculate statistics
    if (session.locations.length > 1) {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      const durationMinutes = duration / 60000;
      
      session.statistics = {
        totalDistance: this.calculateTotalDistance(session.locations),
        averageSpeed: this.calculateAverageSpeed(session.locations, durationMinutes),
        locationPointsCount: session.locations.length,
        batteryConsumption: 0 // Would require battery API access
      };
    }
    
    // Emit end tracking event
    if (this.socket) {
      this.socket.emit('tracking:end', {
        orderId,
        session,
        timestamp: new Date().toISOString()
      });
    }
    
    // Remove from active sessions
    delete this.trackingSessions[orderId];
    
    return session;
  }
  
  // Calculate total distance from location points
  private calculateTotalDistance(locations: LocationData[]): number {
    if (locations.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      totalDistance += this.calculateDistance(
        locations[i-1].lat, locations[i-1].lng,
        locations[i].lat, locations[i].lng
      );
    }
    
    return totalDistance;
  }
  
  // Calculate average speed in km/h
  private calculateAverageSpeed(locations: LocationData[], durationMinutes: number): number {
    if (durationMinutes === 0 || locations.length < 2) return 0;
    
    const totalDistance = this.calculateTotalDistance(locations);
    // Convert to km/h: distance in km / duration in hours
    return totalDistance / (durationMinutes / 60);
  }
  
  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Update location for a specific order
  updateLocation(orderId: string, location: { latitude: number; longitude: number; address?: string }) {
    if (this.socket) {
      const locationData: LocationData = {
        lat: location.latitude,
        lng: location.longitude,
        timestamp: new Date().toISOString(),
      };
      
      // Add to tracking session if active
      if (this.trackingSessions[orderId]) {
        this.trackingSessions[orderId].locations.push(locationData);
      }
      
      this.socket.emit('location:update', {
        orderId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        },
        timestamp: new Date().toISOString(),
        deviceInfo: this.deviceInfo
      });
    }
  }

  // Start periodic location updates
  startLocationUpdates(orderId: string, intervalMs: number = 5000) {
    // Clear any existing interval for this order
    this.stopLocationUpdates(orderId);
    
    // Create new interval
    this.locationUpdateIntervals[orderId] = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            
            // Update location
            this.updateLocation(orderId, location);
          },
          (error) => {
            console.error('Error getting location:', error);
            // Could implement fallback here
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    }, intervalMs);
    
    return this.locationUpdateIntervals[orderId];
  }
  
  // Stop periodic location updates
  stopLocationUpdates(orderId: string) {
    if (this.locationUpdateIntervals[orderId]) {
      clearInterval(this.locationUpdateIntervals[orderId]);
      delete this.locationUpdateIntervals[orderId];
    }
  }

  // Update order status
  updateOrderStatus(orderId: string, status: string) {
    if (this.socket) {
      this.socket.emit('order:statusUpdate', {
        orderId,
        status,
        timestamp: new Date().toISOString()
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
  
  // Send message to customer
  sendMessageToCustomer(orderId: string, message: string) {
    if (this.socket) {
      this.socket.emit('message:send', {
        orderId,
        message,
        timestamp: new Date().toISOString(),
        sender: 'delivery_partner'
      });
    }
  }
  
  // Check if customer is viewing the order tracking
  checkCustomerViewing(orderId: string) {
    if (this.socket) {
      this.socket.emit('tracking:check_customer_viewing', { orderId });
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 