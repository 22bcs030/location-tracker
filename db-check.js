const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:5001/api';
const LOG_FILE = 'db-diagnosis.log';

// Helper to append to log file
function appendLog(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

// Clear log file
fs.writeFileSync(LOG_FILE, '--- MongoDB Diagnosis Report ---\n' + 
                          'Date: ' + new Date().toISOString() + '\n\n');

async function runDiagnosis() {
  appendLog('Starting MongoDB connection and user registration diagnosis...');
  
  try {
    // 1. Check backend health
    appendLog('\n1. Checking backend health...');
    const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/health`);
    appendLog(`Health check status: ${healthResponse.status}`);
    appendLog(`Health response: ${JSON.stringify(healthResponse.data)}`);
    
    // 2. Check MongoDB connection directly through a custom endpoint
    appendLog('\n2. Testing direct MongoDB connection...');
    try {
      const dbCheckResponse = await axios.get(`${API_URL.replace('/api', '')}/db-check`);
      appendLog(`DB check status: ${dbCheckResponse.status}`);
      appendLog(`DB check response: ${JSON.stringify(dbCheckResponse.data)}`);
    } catch (error) {
      appendLog(`DB check endpoint not available. Adding it would help diagnose connection issues.`);
    }
    
    // 3. Try to register a user
    appendLog('\n3. Attempting to register a test user...');
    const testUser = {
      name: 'Test Vendor ' + Date.now(),
      email: `testvendor${Date.now()}@example.com`,
      password: 'password123',
      role: 'vendor'
    };
    
    appendLog(`Registration payload: ${JSON.stringify({...testUser, password: '[REDACTED]'})}`);
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    appendLog(`Registration status: ${registerResponse.status}`);
    appendLog(`Registration response: ${JSON.stringify(registerResponse.data)}`);
    
    if (registerResponse.data.user && registerResponse.data.user.id) {
      const userId = registerResponse.data.user.id;
      appendLog(`New user created with ID: ${userId}`);
      
      // 4. Check if we can retrieve the user
      appendLog('\n4. Attempting to login with new user...');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      appendLog(`Login status: ${loginResponse.status}`);
      appendLog(`Login response: ${JSON.stringify({
        ...loginResponse.data,
        token: loginResponse.data.token ? '[TOKEN PRESENT]' : '[NO TOKEN]'
      })}`);
      
      // 5. Check profile access
      if (loginResponse.data.token) {
        appendLog('\n5. Checking user profile access...');
        try {
          const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${loginResponse.data.token}` }
          });
          
          appendLog(`Profile access status: ${profileResponse.status}`);
          appendLog(`Profile data: ${JSON.stringify(profileResponse.data)}`);
        } catch (error) {
          appendLog(`Profile access failed: ${error.message}`);
          if (error.response) {
            appendLog(`Response data: ${JSON.stringify(error.response.data)}`);
          }
        }
      }
    }
    
    appendLog('\nDiagnosis completed successfully. Check results above to determine issues.');
  } catch (error) {
    appendLog(`\nERROR during diagnosis: ${error.message}`);
    if (error.response) {
      appendLog(`Response status: ${error.response.status}`);
      appendLog(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

runDiagnosis(); 