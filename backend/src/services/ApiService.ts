// API Service for frontend to backend communication
// This file can be imported in frontend code

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  AuthResponse, 
  UserLoginRequest, 
  UserRegisterRequest,
  ApiError
} from '../types/auth.types';
import {
  OrderResponse,
  OrdersListResponse,
  CreateOrderRequest,
  AssignDeliveryPartnerRequest,
  UpdateOrderStatusRequest,
  LocationUpdateRequest
} from '../types/order.types';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:5001/api') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add a request interceptor to include auth token
    this.api.interceptors.request.use(
      (config: any) => {
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error)
    );
  }

  // Set the authentication token
  setToken(token: string): void {
    this.token = token;
  }

  // Clear the authentication token
  clearToken(): void {
    this.token = null;
  }

  // Auth API calls
  async login(data: UserLoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', data);
      this.setToken(response.data.token);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(data: UserRegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/register', data);
      this.setToken(response.data.token);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getProfile(): Promise<AuthResponse> {
    try {
      const response = await this.api.get<AuthResponse>('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Order API calls
  async getOrders(): Promise<OrdersListResponse> {
    try {
      const response = await this.api.get<OrdersListResponse>('/orders');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getOrderById(id: string): Promise<OrderResponse> {
    try {
      const response = await this.api.get<{ success: boolean; data: OrderResponse }>(`/orders/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    try {
      const response = await this.api.post<{ success: boolean; data: OrderResponse }>('/orders', data);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async assignDeliveryPartner(orderId: string, data: AssignDeliveryPartnerRequest): Promise<OrderResponse> {
    try {
      const response = await this.api.put<{ success: boolean; data: OrderResponse }>(
        `/orders/${orderId}/assign`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusRequest): Promise<OrderResponse> {
    try {
      const response = await this.api.put<{ success: boolean; data: OrderResponse }>(
        `/orders/${orderId}/status`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Location API calls
  async updateLocation(orderId: string, data: LocationUpdateRequest): Promise<any> {
    try {
      const response = await this.api.post<{ success: boolean; data: any }>(
        `/location/${orderId}`,
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCurrentLocation(orderId: string): Promise<any> {
    try {
      const response = await this.api.get<{ success: boolean; data: any }>(
        `/location/${orderId}/current`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Tracking API calls
  async generateTrackingLink(orderId: string): Promise<{ trackingUrl: string; trackingToken: string; orderNumber: string }> {
    try {
      const response = await this.api.post<{ 
        success: boolean; 
        data: { 
          trackingUrl: string; 
          trackingToken: string; 
          orderNumber: string 
        } 
      }>(`/tracking/generate/${orderId}`);
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Public tracking (no auth required)
  async trackOrder(orderNumber: string, trackingToken: string): Promise<any> {
    try {
      // Don't use the interceptor for this call
      const response = await axios.get<{ success: boolean; data: any }>(
        `${this.api.defaults.baseURL}/tracking/${orderNumber}/${trackingToken}`
      );
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Error handling
  private handleError(error: any): Error {
    if (error.response && error.response.data) {
      // API error with response
      const apiError: ApiError = error.response.data;
      return new Error(apiError.error || 'An error occurred');
    }
    // Network error or other issues
    return new Error(error.message || 'Network error');
  }
}

export default ApiService;