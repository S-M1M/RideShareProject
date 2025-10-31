#!/usr/bin/env node

/**
 * Production API Test Script
 * Tests the Render backend API endpoints to ensure subscription page will work
 * 
 * Usage: node test-production-api.js
 */

const https = require('https');

const API_BASE = 'https://rideshareproject-vyu1.onrender.com/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealthCheck() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 1: Health Check Endpoint', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    log(`\nTesting: ${API_BASE}/health`, 'blue');
    const response = await makeRequest(`${API_BASE}/health`);
    
    if (response.status === 200) {
      log('✓ Health check passed', 'green');
      log(`  Status: ${response.body.status}`, 'green');
      log(`  MongoDB: ${response.body.mongodb}`, 'green');
      log(`  Timestamp: ${response.body.timestamp}`, 'green');
      return true;
    } else {
      log(`✗ Health check failed with status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Health check failed: ${error.message}`, 'red');
    log('  Make sure Render backend is deployed and running', 'yellow');
    return false;
  }
}

async function testRoutesEndpoint() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 2: Routes Endpoint (for Subscription Page)', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    log(`\nTesting: ${API_BASE}/users/routes`, 'blue');
    const response = await makeRequest(`${API_BASE}/users/routes`);
    
    if (response.status === 200) {
      log('✓ Routes endpoint working', 'green');
      
      if (Array.isArray(response.body)) {
        log(`  Found ${response.body.length} route(s)`, 'green');
        
        if (response.body.length === 0) {
          log('  ⚠ No routes found - Subscription page will show "no routes available"', 'yellow');
          log('  → Create routes via Admin Panel to test subscription flow', 'yellow');
        } else {
          log('  ✓ Routes are available for subscription', 'green');
          response.body.forEach((route, index) => {
            log(`    ${index + 1}. ${route.name} (${route.stops?.length || 0} stops)`, 'green');
          });
        }
      } else {
        log('  ✗ Unexpected response format', 'red');
        return false;
      }
      return true;
    } else {
      log(`✗ Routes endpoint failed with status ${response.status}`, 'red');
      log(`  Response: ${JSON.stringify(response.body)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Routes endpoint failed: ${error.message}`, 'red');
    return false;
  }
}

async function testCORS() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 3: CORS Configuration', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    log(`\nTesting: ${API_BASE}/health`, 'blue');
    const response = await makeRequest(`${API_BASE}/health`);
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    log('✓ CORS headers present', 'green');
    
    if (corsHeaders['access-control-allow-origin']) {
      log(`  Allow-Origin: ${corsHeaders['access-control-allow-origin']}`, 'green');
    } else {
      log('  ⚠ No Access-Control-Allow-Origin header', 'yellow');
    }
    
    if (corsHeaders['access-control-allow-methods']) {
      log(`  Allow-Methods: ${corsHeaders['access-control-allow-methods']}`, 'green');
    }
    
    return true;
  } catch (error) {
    log(`✗ CORS test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDatabaseConnection() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST 4: Database Connection', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  try {
    log(`\nChecking via health endpoint...`, 'blue');
    const response = await makeRequest(`${API_BASE}/health`);
    
    if (response.body.mongodb === 'connected') {
      log('✓ MongoDB is connected', 'green');
      return true;
    } else {
      log('✗ MongoDB is not connected', 'red');
      log('  Check Render logs for MongoDB connection errors', 'yellow');
      log('  Verify MONGODB_URI environment variable is set', 'yellow');
      log('  Check MongoDB Atlas IP whitelist', 'yellow');
      return false;
    }
  } catch (error) {
    log(`✗ Database connection test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║   RIDESHARE PROJECT - PRODUCTION API TEST SUITE          ║', 'cyan');
  log('║   Testing: https://rideshareproject-vyu1.onrender.com    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    health: false,
    routes: false,
    cors: false,
    database: false
  };
  
  results.health = await testHealthCheck();
  
  if (results.health) {
    results.routes = await testRoutesEndpoint();
    results.cors = await testCORS();
    results.database = await testDatabaseConnection();
  } else {
    log('\n⚠ Skipping remaining tests due to health check failure', 'yellow');
  }
  
  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  log(`\nHealth Check:      ${results.health ? '✓ PASS' : '✗ FAIL'}`, results.health ? 'green' : 'red');
  log(`Routes Endpoint:   ${results.routes ? '✓ PASS' : '✗ FAIL'}`, results.routes ? 'green' : 'red');
  log(`CORS Config:       ${results.cors ? '✓ PASS' : '✗ FAIL'}`, results.cors ? 'green' : 'red');
  log(`Database:          ${results.database ? '✓ PASS' : '✗ FAIL'}`, results.database ? 'green' : 'red');
  
  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n✓ ALL TESTS PASSED - Subscription page should work correctly!', 'green');
    log('  You can now test the subscription page at:', 'green');
    log('  https://pickmeupdhaka.netlify.app/subscription', 'green');
  } else {
    log('\n✗ SOME TESTS FAILED - Please fix issues before testing subscription page', 'red');
    log('\nNext steps:', 'yellow');
    log('  1. Check Render dashboard logs for errors', 'yellow');
    log('  2. Verify all environment variables are set', 'yellow');
    log('  3. Check MongoDB Atlas configuration', 'yellow');
    log('  4. See DEPLOYMENT_CHECKLIST.md for detailed troubleshooting', 'yellow');
  }
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

// Run tests
runAllTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
