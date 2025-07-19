/**
 * Artillery Load Test Helper Functions
 * Custom functions to support load testing scenarios
 */

const { faker } = require('@faker-js/faker');

module.exports = {
  // Generate random test data
  generateTestUser,
  generateRandomString,
  generateTestJob,
  setDynamicVariables,
  validateResponse,
  logMetrics,
  
  // Lifecycle hooks
  beforeRequest,
  afterResponse
};

/**
 * Generate a test user object
 */
function generateTestUser(context, events, done) {
  context.vars.testUser = {
    email: faker.internet.email(),
    password: 'LoadTest123!',
    displayName: faker.person.fullName(),
    company: faker.company.name()
  };
  
  return done();
}

/**
 * Generate random string for test data
 */
function generateRandomString(context, events, done) {
  context.vars.randomString = faker.string.alphanumeric(8);
  context.vars.randomUuid = faker.string.uuid();
  context.vars.timestamp = Date.now();
  
  return done();
}

/**
 * Generate test job data
 */
function generateTestJob(context, events, done) {
  context.vars.testJob = {
    type: faker.helpers.arrayElement(['cleanup', 'documentation', 'analysis']),
    filename: `test-${faker.string.alphanumeric(6)}.zip`,
    description: faker.lorem.sentence(),
    contextProfile: faker.string.uuid()
  };
  
  return done();
}

/**
 * Set dynamic variables for each virtual user
 */
function setDynamicVariables(context, events, done) {
  // Set unique identifiers for this virtual user
  context.vars.vuId = context.vars.$uuid || faker.string.uuid();
  context.vars.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Set realistic user agent
  context.vars.userAgent = faker.helpers.arrayElement([
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ]);
  
  return done();
}

/**
 * Validate response and log errors
 */
function validateResponse(context, events, done) {
  context.vars.validateResponse = function(response, body) {
    if (response.statusCode >= 400) {
      console.log(`Error ${response.statusCode}: ${response.url}`);
      console.log(`Response: ${body}`);
    }
    
    // Track response times
    if (response.timings && response.timings.response > 5000) {
      console.log(`Slow response (${response.timings.response}ms): ${response.url}`);
    }
  };
  
  return done();
}

/**
 * Log custom metrics
 */
function logMetrics(context, events, done) {
  // Custom metrics tracking
  events.on('request', (req) => {
    const startTime = Date.now();
    req._startTime = startTime;
  });
  
  events.on('response', (res, req) => {
    const endTime = Date.now();
    const duration = endTime - req._startTime;
    
    // Log slow requests
    if (duration > 2000) {
      console.log(`SLOW REQUEST: ${req.method} ${req.url} took ${duration}ms`);
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      console.log(`ERROR: ${req.method} ${req.url} returned ${res.statusCode}`);
    }
  });
  
  return done();
}

/**
 * Before request hook
 */
function beforeRequest(requestParams, context, ee, next) {
  // Add common headers
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['User-Agent'] = context.vars.userAgent;
  requestParams.headers['X-Load-Test'] = 'true';
  requestParams.headers['X-VU-ID'] = context.vars.vuId;
  
  // Add timestamp for request tracking
  requestParams.headers['X-Request-Time'] = new Date().toISOString();
  
  return next();
}

/**
 * After response hook
 */
function afterResponse(requestParams, response, context, ee, next) {
  // Log response metrics
  const responseTime = response.timings ? response.timings.response : 0;
  
  // Emit custom metrics
  ee.emit('counter', 'responses.total', 1);
  ee.emit('histogram', 'response.time', responseTime);
  
  if (response.statusCode >= 200 && response.statusCode < 300) {
    ee.emit('counter', 'responses.success', 1);
  } else if (response.statusCode >= 400) {
    ee.emit('counter', 'responses.error', 1);
    ee.emit('counter', `responses.${response.statusCode}`, 1);
  }
  
  // Track business metrics
  if (requestParams.url.includes('/api/jobs')) {
    ee.emit('counter', 'business.job_requests', 1);
  }
  
  if (requestParams.url.includes('/api/auth')) {
    ee.emit('counter', 'business.auth_requests', 1);
  }
  
  if (requestParams.url.includes('/api/upload')) {
    ee.emit('counter', 'business.upload_requests', 1);
  }
  
  return next();
}

/**
 * Simulate realistic user think time
 */
function realisticThinkTime(context, events, done) {
  // Simulate realistic user behavior with variable think times
  const thinkTime = faker.number.int({ min: 500, max: 5000 });
  setTimeout(done, thinkTime);
}

/**
 * Generate realistic file upload data
 */
function generateUploadData(context, events, done) {
  const fileTypes = ['zip', 'tar.gz', 'js', 'ts', 'py', 'json'];
  const fileSizes = [1024, 5120, 10240, 51200, 102400]; // Various KB sizes
  
  context.vars.uploadFile = {
    filename: `${faker.system.fileName()}.${faker.helpers.arrayElement(fileTypes)}`,
    contentType: faker.helpers.arrayElement([
      'application/zip',
      'application/javascript',
      'application/json',
      'text/plain'
    ]),
    size: faker.helpers.arrayElement(fileSizes)
  };
  
  return done();
}

/**
 * Simulate API key authentication
 */
function setApiKeyAuth(context, events, done) {
  // Use different API keys for different user tiers
  const apiKeys = {
    seedling: 'sk-test-seedling-key',
    sprout: 'sk-test-sprout-key',
    sapling: 'sk-test-sapling-key',
    tree: 'sk-test-tree-key',
    forest: 'sk-test-forest-key'
  };
  
  const tier = faker.helpers.arrayElement(Object.keys(apiKeys));
  context.vars.userTier = tier;
  context.vars.apiKey = apiKeys[tier];
  
  return done();
}

/**
 * Error recovery simulation
 */
function handleErrors(context, events, done) {
  events.on('error', (error) => {
    console.log(`Load test error: ${error.message}`);
    
    // Implement retry logic for certain errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.log('Network error detected, continuing test...');
    }
  });
  
  return done();
}