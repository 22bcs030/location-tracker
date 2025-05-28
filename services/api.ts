import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.token) {
          config.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }
  
  return config;
});

// Auth services
export const authService = {
  login: async (email: string, password: string, role: string) => {
    const response = await api.post('/auth/login', { email, password, role });
    return response.data;
  },
  
  register: async (name: string, email: string, password: string, role: string, vendorId?: string) => {
    const data = { name, email, password, role };
    if (role === 'delivery' && vendorId) {
      Object.assign(data, { vendorId });
    }
    
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Orders services
export const orderService = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  
  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  assignDeliveryPartner: async (orderId: string, deliveryPartnerId: string) => {
    const response = await api.put(`/orders/${orderId}/assign`, { deliveryPartnerId });
    return response.data;
  },
  
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },
  
  getAssignedOrders: async (deliveryPartnerId: string) => {
    const response = await api.get(`/orders/assigned/${deliveryPartnerId}`);
    return response.data;
  },
};

// Tracking services (no authentication required)
export const trackingService = {
  trackOrder: async (orderNumber: string, trackingToken: string) => {
    const response = await axios.get(`${API_URL}/tracking/${orderNumber}/${trackingToken}`);
    return response.data;
  },
  
  generateTrackingLink: async (orderId: string) => {
    const response = await api.post(`/tracking/generate/${orderId}`);
    return response.data;
  },
};

// Location services
export const locationService = {
  updateLocation: async (orderId: string, locationData: { latitude: number, longitude: number, address?: string }) => {
    const response = await api.post(`/location/${orderId}`, locationData);
    return response.data;
  },
  
  getCurrentLocation: async (orderId: string) => {
    const response = await api.get(`/location/${orderId}/current`);
    return response.data;
  },
}; 