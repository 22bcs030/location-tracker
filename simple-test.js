const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5001/api';

async function testBackend() {
  console.log('Testing backend connection...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/health`);
    console.log('Health check:', healthResponse.status === 200 ? 'OK' : 'Failed');
    
    // Test auth endpoint
    const authResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test Vendor',
      email: `testvendor${Date.now()}@example.com`,
      password: 'password123',
      role: 'vendor'
    });
    
    console.log('Auth check:', authResponse.status === 201 ? 'OK' : 'Failed');
    
    // Get the token
    const token = authResponse.data.token;
    console.log('Got auth token:', token ? 'Yes' : 'No');
    
    // Test orders endpoint
    const ordersResponse = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Orders check:', ordersResponse.status === 200 ? 'OK' : 'Failed');
    
    // Try to create an order
    try {
      const testOrder = {
        items: [{ name: 'Test Item', quantity: 1, price: 10 }],
        totalAmount: 10,
        customerId: authResponse.data.user._id,
        vendorId: authResponse.data.user._id,
        deliveryLocation: {
          address: '123 Test St',
          latitude: 40.7128,
          longitude: -74.0060
        },
        pickupLocation: {
          address: '456 Pickup Ave',
          latitude: 40.7129,
          longitude: -74.0061
        }
      };
      
      const createOrderResponse = await axios.post(`${API_URL}/orders`, testOrder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Create order check:', createOrderResponse.status === 201 ? 'OK' : 'Failed');
      
      // Try to get the order by ID
      const orderId = createOrderResponse.data.data._id;
      const getOrderResponse = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Get order check:', getOrderResponse.status === 200 ? 'OK' : 'Failed');
      
    } catch (orderError) {
      console.error('Error with order operations:', orderError.message);
      if (orderError.response) {
        console.error('Response data:', orderError.response.data);
        console.error('Status code:', orderError.response.status);
      }
    }
    
    console.log('\nBasic API tests completed. Backend is running.');
    return true;
  } catch (error) {
    console.error('Error testing backend:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return false;
  }
}

testBackend(); 