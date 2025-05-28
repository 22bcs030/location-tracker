const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5001/api';
const TEST_TIMEOUT = 10000; // 10 seconds

// Helper function to log with colors
const log = {
  info: (msg) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${msg}`),
  success: (msg) => console.log('\x1b[32m%s\x1b[0m', `[SUCCESS] ${msg}`),
  error: (msg) => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${msg}`),
  warning: (msg) => console.log('\x1b[33m%s\x1b[0m', `[WARNING] ${msg}`)
};

// Test cases
const tests = [
  // Backend health check
  async () => {
    log.info('Testing backend health endpoint...');
    try {
      const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
      if (response.status === 200 && response.data.status === 'OK') {
        log.success('Backend health endpoint is working!');
        return true;
      } else {
        log.error(`Unexpected response: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      log.error(`Backend health check failed: ${error.message}`);
      return false;
    }
  },
  
  // Auth API test
  async () => {
    log.info('Testing authentication API...');
    try {
      // Try to register a test user
      const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'vendor'
      };
      
      const response = await axios.post(`${API_URL}/auth/register`, testUser);
      
      if (response.status === 201 && response.data.success && response.data.token) {
        log.success('Authentication API is working!');
        
        // Store token for subsequent tests
        global.authToken = response.data.token;
        global.testUser = response.data.user;
        return true;
      } else {
        log.error(`Unexpected response: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      // Fallback to login if registration fails (user might already exist)
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'password123',
          role: 'vendor'
        });
        
        if (loginResponse.status === 200 && loginResponse.data.token) {
          log.success('Login successful as fallback');
          global.authToken = loginResponse.data.token;
          global.testUser = loginResponse.data.user;
          return true;
        }
      } catch (loginError) {
        log.error(`Login fallback failed: ${loginError.message}`);
      }
      
      log.error(`Authentication test failed: ${error.message}`);
      return false;
    }
  },
  
  // Order API test
  async () => {
    if (!global.authToken) {
      log.warning('Skipping order API test due to missing auth token');
      return false;
    }
    
    log.info('Testing order API...');
    try {
      // Get orders for the authenticated user
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${global.authToken}` }
      });
      
      if (response.status === 200 && response.data.success) {
        log.success(`Order API is working! Found ${response.data.count} orders.`);
        return true;
      } else {
        log.error(`Unexpected response: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      log.error(`Order API test failed: ${error.message}`);
      return false;
    }
  },
  
  // Tracking API test
  async () => {
    if (!global.authToken) {
      log.warning('Skipping tracking API test due to missing auth token');
      return false;
    }
    
    log.info('Testing tracking API...');
    try {
      // First create a test order
      const testOrder = {
        items: [{ name: 'Test Item', quantity: 1, price: 10 }],
        totalAmount: 10,  // Add totalAmount
        orderNumber: `TEST-${Date.now()}`, // Generate a unique order number
        customerId: global.testUser._id, // Use the authenticated user ID as customer
        vendorId: global.testUser._id, // Use the authenticated user ID as vendor (for testing)
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
      
      // Create the order
      const orderResponse = await axios.post(`${API_URL}/orders`, testOrder, {
        headers: { Authorization: `Bearer ${global.authToken}` }
      });
      
      if (!orderResponse.data.success) {
        log.error(`Failed to create test order: ${JSON.stringify(orderResponse.data)}`);
        return false;
      }
      
      const orderId = orderResponse.data.data._id;
      const orderNumber = orderResponse.data.data.orderNumber;
      
      // Generate tracking link
      const trackingResponse = await axios.post(
        `${API_URL}/tracking/generate/${orderId}`,
        {},
        { headers: { Authorization: `Bearer ${global.authToken}` }}
      );
      
      if (!trackingResponse.data.success) {
        log.error(`Failed to generate tracking token: ${JSON.stringify(trackingResponse.data)}`);
        return false;
      }
      
      const trackingToken = trackingResponse.data.data.trackingToken;
      
      // Now test the tracking endpoint with valid token
      const response = await axios.get(`${API_URL}/tracking/${orderNumber}/${trackingToken}`);
      
      if (response.status === 200 && response.data.success) {
        log.success('Tracking API is working!');
        return true;
      } else {
        log.error(`Unexpected response: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error) {
      log.error(`Tracking API test failed: ${error.message}`);
      if (error.response) {
        log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        log.error(`Status code: ${error.response.status}`);
      }
      return false;
    }
  }
];

// Run the tests
async function runTests() {
  log.info('Starting integration tests...');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (let i = 0; i < tests.length; i++) {
    try {
      const testFn = tests[i];
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timed out')), TEST_TIMEOUT)
        )
      ]);
      
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      log.error(`Test ${i + 1} failed with error: ${error.message}`);
      failedTests++;
    }
    
    // Add a separator between tests
    console.log('-'.repeat(50));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  log.info(`Test Summary: ${passedTests} passed, ${failedTests} failed`);
  console.log('='.repeat(50));
  
  if (failedTests > 0) {
    log.warning(`
Integration issues were detected. Possible reasons:
1. Backend server is not running (start with 'cd backend && npm start')
2. Backend is running on a different port (check API_URL in test-integration.js)
3. There might be code issues with the API implementation
    `);
  } else {
    log.success(`
All tests passed! The frontend and backend are correctly integrated.
You can now run both with 'node start-app.js' to start the complete application.
    `);
  }
}

// Run the tests
runTests().catch(error => {
  log.error(`Test runner failed: ${error.message}`);
}); 