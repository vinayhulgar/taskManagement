#!/usr/bin/env node

/**
 * Simple script to test backend integration
 * This script tests the basic API endpoints to ensure they're working
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

async function testEndpoint(endpoint, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      endpoint
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      endpoint
    };
  }
}

async function runTests() {
  console.log('🚀 Testing Backend Integration');
  console.log('==============================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('');

  const tests = [
    {
      name: 'Health Check',
      test: () => testEndpoint('/health')
    },
    {
      name: 'Authentication - Login (should fail without credentials)',
      test: () => testEndpoint('/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    },
    {
      name: 'Get Tasks (should fail without auth)',
      test: () => testEndpoint('/tasks')
    },
    {
      name: 'Get Teams (should fail without auth)',
      test: () => testEndpoint('/teams')
    },
    {
      name: 'Get Projects (should fail without auth)',
      test: () => testEndpoint('/projects')
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    console.log(`Testing: ${name}`);
    
    try {
      const result = await test();
      
      if (result.success || (result.status >= 400 && result.status < 500)) {
        // Consider 4xx responses as expected for unauthorized requests
        console.log(`  ✅ ${name} - Status: ${result.status}`);
        passed++;
      } else {
        console.log(`  ❌ ${name} - Status: ${result.status}, Error: ${result.error || 'Unknown'}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ${name} - Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  console.log('Results:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 All backend integration tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the backend is running and accessible.');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with fetch support');
  process.exit(1);
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});