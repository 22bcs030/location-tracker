const axios = require('axios');

async function checkDatabase() {
  try {
    console.log('Checking MongoDB connection and users...');
    const response = await axios.get('http://localhost:5001/db-check');
    
    // Format the response for better readability
    const data = response.data;
    
    console.log('\nMongoDB Status:');
    console.log('====================');
    console.log(`Connected: ${data.dbStatus.isConnected ? 'Yes' : 'No'}`);
    console.log(`Connection State: ${data.dbStatus.connectionStateName} (${data.dbStatus.connectionState})`);
    console.log(`Database: ${data.dbStatus.name} on ${data.dbStatus.host}`);
    console.log(`Available Models: ${data.dbStatus.models.join(', ')}`);
    console.log(`Collections: ${data.dbStatus.collections.join(', ')}`);
    
    console.log('\nUsers in Database:');
    console.log('====================');
    console.log(`Total Users: ${data.userCount || 0}`);
    
    if (data.recentUsers && data.recentUsers.length > 0) {
      console.log('\nMost Recent Users:');
      data.recentUsers.forEach((user, index) => {
        console.log(`\n[User ${index + 1}]`);
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Created: ${new Date(user.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('\nNo users found in the database!');
    }
    
    // Now register a new test user
    console.log('\nRegistering a new test user...');
    const testUser = {
      name: 'Test User ' + Date.now(),
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      role: 'vendor'
    };
    
    const registerResponse = await axios.post('http://localhost:5001/api/auth/register', testUser);
    console.log(`Registration Status: ${registerResponse.status}`);
    console.log(`New User ID: ${registerResponse.data.user.id}`);
    
    // Check database again
    console.log('\nChecking database again after registration...');
    const responseAfter = await axios.get('http://localhost:5001/db-check');
    console.log(`Total Users After Registration: ${responseAfter.data.userCount || 0}`);
    
    if (responseAfter.data.userCount > data.userCount) {
      console.log('\nSUCCESS: User count increased, registration is working properly!');
    } else {
      console.log('\nWARNING: User count did not increase after registration!');
    }
    
  } catch (error) {
    console.error('Error checking database:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

checkDatabase(); 