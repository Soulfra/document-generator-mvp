/**
 * k6 Load Testing Script for FinishThisIdea API
 * Comprehensive performance testing with detailed metrics
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const businessTransactions = new Counter('business_transactions');
const authSuccessRate = new Rate('auth_success_rate');
const jobCreationRate = new Counter('job_creation_attempts');

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '2m', target: 5 },
    // Ramp-up
    { duration: '5m', target: 20 },
    // Stay at 20 users for 10 minutes
    { duration: '10m', target: 20 },
    // Peak load
    { duration: '3m', target: 50 },
    // Stay at peak for 5 minutes
    { duration: '5m', target: 50 },
    // Ramp-down
    { duration: '5m', target: 0 },
  ],
  
  thresholds: {
    // 95% of requests should be below 2000ms
    http_req_duration: ['p(95)<2000'],
    // 99% of requests should be below 5000ms
    'http_req_duration{expected_response:true}': ['p(99)<5000'],
    // Error rate should be below 1%
    errors: ['rate<0.01'],
    // Auth success rate should be above 95%
    auth_success_rate: ['rate>0.95'],
    // API response time should be reasonable
    api_response_time: ['p(95)<1500'],
  },
  
  // Test environment
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
        'amazon:us:palo alto': { loadZone: 'amazon:us:palo alto', percent: 50 },
      },
    },
  },
};

// Base configuration
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const API_KEY = __ENV.TEST_API_KEY || 'test-api-key';

// Test data generators
function generateTestUser() {
  return {
    email: `load-test-${randomString(8)}@example.com`,
    password: 'LoadTest123!',
    displayName: `Load Test User ${randomString(6)}`,
  };
}

function generateJobData() {
  return {
    type: randomItem(['cleanup', 'documentation', 'analysis']),
    inputFileUrl: `https://example.com/test-file-${randomString(8)}.zip`,
    originalFileName: `test-file-${randomString(6)}.zip`,
    fileSizeBytes: Math.floor(Math.random() * 1000000) + 1000,
    fileCount: Math.floor(Math.random() * 100) + 1,
  };
}

// Request headers
function getHeaders(authToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Load-Test': 'true',
    'X-Request-ID': `k6-${randomString(12)}`,
    'User-Agent': 'k6/load-test',
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  
  return headers;
}

// Main test function
export default function() {
  let authToken = null;
  
  group('Health Checks', () => {
    const healthResponse = http.get(`${BASE_URL}/health`, {
      headers: getHeaders(),
    });
    
    check(healthResponse, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 500ms': (r) => r.timings.duration < 500,
      'health response contains success': (r) => r.json('success') === true,
    });
    
    apiResponseTime.add(healthResponse.timings.duration);
    errorRate.add(healthResponse.status >= 400);
    
    const apiHealthResponse = http.get(`${BASE_URL}/api/health`, {
      headers: getHeaders(),
    });
    
    check(apiHealthResponse, {
      'api health status is 200': (r) => r.status === 200,
      'api health response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    apiResponseTime.add(apiHealthResponse.timings.duration);
    errorRate.add(apiHealthResponse.status >= 400);
  });
  
  group('Authentication Flow', () => {
    const testUser = generateTestUser();
    
    // Register user
    const registerResponse = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify(testUser),
      { headers: getHeaders() }
    );
    
    const registerSuccess = check(registerResponse, {
      'registration status is 201 or 409': (r) => r.status === 201 || r.status === 409,
      'registration response time < 3000ms': (r) => r.timings.duration < 3000,
    });
    
    authSuccessRate.add(registerSuccess);
    apiResponseTime.add(registerResponse.timings.duration);
    errorRate.add(registerResponse.status >= 400 && registerResponse.status !== 409);
    
    sleep(1);
    
    // Login user
    const loginResponse = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
      { headers: getHeaders() }
    );
    
    const loginSuccess = check(loginResponse, {
      'login status is 200': (r) => r.status === 200,
      'login response time < 2000ms': (r) => r.timings.duration < 2000,
      'login returns token': (r) => r.json('data.token') !== undefined,
    });
    
    if (loginSuccess && loginResponse.json('data.token')) {
      authToken = loginResponse.json('data.token');
      businessTransactions.add(1, { type: 'successful_login' });
    }
    
    authSuccessRate.add(loginSuccess);
    apiResponseTime.add(loginResponse.timings.duration);
    errorRate.add(loginResponse.status >= 400);
  });
  
  group('API Endpoints', () => {
    // Metrics endpoint
    const metricsResponse = http.get(`${BASE_URL}/api/metrics`, {
      headers: getHeaders(authToken),
    });
    
    check(metricsResponse, {
      'metrics endpoint responds': (r) => r.status === 200 || r.status === 403,
      'metrics response time < 1500ms': (r) => r.timings.duration < 1500,
    });
    
    apiResponseTime.add(metricsResponse.timings.duration);
    errorRate.add(metricsResponse.status >= 400 && metricsResponse.status !== 403);
    
    // Documentation endpoint
    const docsResponse = http.get(`${BASE_URL}/api/docs`, {
      headers: getHeaders(),
    });
    
    check(docsResponse, {
      'docs endpoint responds': (r) => r.status === 200,
      'docs response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(docsResponse.timings.duration);
    errorRate.add(docsResponse.status >= 400);
    
    sleep(1);
  });
  
  group('Job Management', () => {
    // Get jobs list
    const jobsResponse = http.get(`${BASE_URL}/api/jobs?page=1&limit=10`, {
      headers: getHeaders(authToken),
    });
    
    check(jobsResponse, {
      'jobs list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'jobs response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(jobsResponse.timings.duration);
    errorRate.add(jobsResponse.status >= 400 && jobsResponse.status !== 401);
    
    // Create job if authenticated
    if (authToken) {
      const jobData = generateJobData();
      const createJobResponse = http.post(
        `${BASE_URL}/api/jobs`,
        JSON.stringify(jobData),
        { headers: getHeaders(authToken) }
      );
      
      const jobCreated = check(createJobResponse, {
        'job creation status is 201 or 400': (r) => r.status === 201 || r.status === 400,
        'job creation response time < 3000ms': (r) => r.timings.duration < 3000,
      });
      
      if (jobCreated && createJobResponse.status === 201) {
        businessTransactions.add(1, { type: 'job_created' });
      }
      
      jobCreationRate.add(1);
      apiResponseTime.add(createJobResponse.timings.duration);
      errorRate.add(createJobResponse.status >= 400 && createJobResponse.status !== 400);
    }
    
    sleep(2);
  });
  
  group('File Upload Simulation', () => {
    // Get presigned URL
    const presignedResponse = http.post(
      `${BASE_URL}/api/upload/presigned`,
      JSON.stringify({
        filename: `test-file-${randomString(8)}.txt`,
        contentType: 'text/plain',
        size: 1024,
      }),
      { headers: getHeaders(authToken) }
    );
    
    check(presignedResponse, {
      'presigned URL request responds': (r) => r.status === 200 || r.status === 401,
      'presigned URL response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    
    apiResponseTime.add(presignedResponse.timings.duration);
    errorRate.add(presignedResponse.status >= 400 && presignedResponse.status !== 401);
    
    // Upload status check
    const statusResponse = http.get(`${BASE_URL}/api/upload/status`, {
      headers: getHeaders(authToken),
    });
    
    check(statusResponse, {
      'upload status responds': (r) => r.status === 200 || r.status === 401,
      'upload status response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    apiResponseTime.add(statusResponse.timings.duration);
    errorRate.add(statusResponse.status >= 400 && statusResponse.status !== 401);
  });
  
  group('User Profile Management', () => {
    if (authToken) {
      // Get current user profile
      const profileResponse = http.get(`${BASE_URL}/api/auth/me`, {
        headers: getHeaders(authToken),
      });
      
      check(profileResponse, {
        'profile fetch status is 200': (r) => r.status === 200,
        'profile response time < 1500ms': (r) => r.timings.duration < 1500,
        'profile contains user data': (r) => r.json('data.user') !== undefined,
      });
      
      apiResponseTime.add(profileResponse.timings.duration);
      errorRate.add(profileResponse.status >= 400);
      
      if (profileResponse.status === 200) {
        businessTransactions.add(1, { type: 'profile_accessed' });
      }
    }
  });
  
  // Realistic user think time
  sleep(Math.random() * 3 + 1);
}

// Setup function
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log(`Test duration: ~30 minutes`);
  console.log(`Max concurrent users: 50`);
  
  // Verify target is accessible
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Target ${BASE_URL} is not accessible. Health check failed with status ${healthCheck.status}`);
  }
  
  console.log('Target is accessible. Starting load test...');
  return { startTime: new Date() };
}

// Teardown function
export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  console.log(`Load test completed in ${duration} seconds`);
}