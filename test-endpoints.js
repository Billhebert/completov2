// Test script to verify all major endpoints are working
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';
let authToken = '';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(status, endpoint, message = '') {
  const statusColor = status === '✓' ? colors.green : status === '✗' ? colors.red : colors.yellow;
  console.log(`${statusColor}${status}${colors.reset} ${colors.blue}${endpoint}${colors.reset} ${message}`);
}

async function testEndpoint(method, endpoint, data = null, requiresAuth = true) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: requiresAuth && authToken ? { Authorization: `Bearer ${authToken}` } : {},
    };

    if (data) config.data = data;

    const response = await axios(config);
    log('✓', `${method.toUpperCase()} ${endpoint}`, `(${response.status})`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'ERR';
    const message = error.response?.data?.error || error.message;
    log('✗', `${method.toUpperCase()} ${endpoint}`, `(${status}) ${message}`);
    return { success: false, error: message, status };
  }
}

async function runTests() {
  console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
  console.log(colors.blue + '  COMPLETOV2 API ENDPOINT TESTS' + colors.reset);
  console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');

  // Test authentication first
  console.log(colors.yellow + '\n📝 Authentication Tests' + colors.reset);
  const loginResult = await testEndpoint('post', '/auth/login', {
    email: 'admin@example.com',
    password: 'admin123',
  }, false);

  if (loginResult.success) {
    authToken = loginResult.data.token;
    console.log(colors.green + '✓ Authenticated successfully\n' + colors.reset);
  } else {
    console.log(colors.red + '✗ Authentication failed - using test mode\n' + colors.reset);
  }

  // CRM Tests
  console.log(colors.yellow + '👥 CRM Module Tests' + colors.reset);
  await testEndpoint('get', '/crm/contacts?page=1&limit=10');
  await testEndpoint('get', '/crm/deals?page=1&limit=10');

  // Omnichannel Tests
  console.log(colors.yellow + '\n💬 Omnichannel Module Tests' + colors.reset);
  await testEndpoint('get', '/omnichannel/conversations?page=1&pageSize=10');
  await testEndpoint('get', '/omnichannel/whatsapp/accounts');

  // Knowledge Tests
  console.log(colors.yellow + '\n📚 Knowledge Module Tests' + colors.reset);
  await testEndpoint('get', '/zettels?page=1&pageSize=10');

  // Workflows Tests
  console.log(colors.yellow + '\n⚙️  Workflows Module Tests' + colors.reset);
  await testEndpoint('get', '/workflows');

  // Webhooks Tests
  console.log(colors.yellow + '\n🔗 Webhooks Module Tests' + colors.reset);
  await testEndpoint('get', '/webhooks/endpoints');
  await testEndpoint('get', '/webhooks/events');

  // FSM Tests
  console.log(colors.yellow + '\n🔧 Field Service Module Tests' + colors.reset);
  await testEndpoint('get', '/fsm/workorders');
  await testEndpoint('get', '/fsm/technicians');

  // CMMS Tests
  console.log(colors.yellow + '\n🏭 CMMS Module Tests' + colors.reset);
  await testEndpoint('get', '/cmms/assets');
  await testEndpoint('get', '/cmms/maintenance-plans');

  // MCP Tests
  console.log(colors.yellow + '\n🤖 MCP Module Tests' + colors.reset);
  await testEndpoint('get', '/mcp/servers');

  // Jobs Tests
  console.log(colors.yellow + '\n💼 Jobs Module Tests' + colors.reset);
  await testEndpoint('get', '/jobs?status=&type=&search=');

  // Services Tests
  console.log(colors.yellow + '\n🛠️  Services Module Tests' + colors.reset);
  await testEndpoint('get', '/services');

  // Partnerships Tests
  console.log(colors.yellow + '\n🤝 Partnerships Module Tests' + colors.reset);
  await testEndpoint('get', '/partnerships');
  await testEndpoint('get', '/partnerships/invites');

  // RBAC Tests
  console.log(colors.yellow + '\n🔐 RBAC Module Tests' + colors.reset);
  await testEndpoint('get', '/rbac/departments');
  await testEndpoint('get', '/rbac/roles');

  // Settings Tests
  console.log(colors.yellow + '\n⚙️  Settings Module Tests' + colors.reset);
  await testEndpoint('get', '/settings');

  // AI Tests
  console.log(colors.yellow + '\n🤖 AI Module Tests' + colors.reset);
  await testEndpoint('get', '/ai/health');

  // Dashboard Tests
  console.log(colors.yellow + '\n📊 Dashboard Tests' + colors.reset);
  await testEndpoint('get', '/dashboard/stats');

  console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
  console.log(colors.green + '  Test run completed!' + colors.reset);
  console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');
}

// Run tests
runTests().catch(console.error);
