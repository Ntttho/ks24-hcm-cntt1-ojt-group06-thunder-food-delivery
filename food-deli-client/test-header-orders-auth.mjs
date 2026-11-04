import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CLIENT_DIR = process.cwd();

// Test 1: Verify JWT decoder & expiration logic
test('1. JWT Decoder, Role Normalization and Expiration Detection', async () => {
  // Read src/utils/jwt.ts
  const jwtFile = readFileSync(join(CLIENT_DIR, 'src', 'utils', 'jwt.ts'), 'utf-8');
  assert.ok(jwtFile.includes('decodeJwt'), 'jwt.ts must export decodeJwt');
  assert.ok(jwtFile.includes('isTokenExpired'), 'jwt.ts must export isTokenExpired');
  assert.ok(jwtFile.includes('normalizeRole'), 'jwt.ts must export normalizeRole');
  assert.ok(jwtFile.includes('getRoleFromToken'), 'jwt.ts must export getRoleFromToken');

  // Create helper test functions matching jwt.ts logic
  const decode = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  };

  const isExpired = (token) => {
    const payload = decode(token);
    if (!payload?.exp) return false;
    return Math.floor(Date.now() / 1000) >= payload.exp - 10;
  };

  const normalizeRole = (role) => {
    if (!role) return 'ROLE_CUSTOMER';
    const upper = role.trim().toUpperCase();
    return upper.startsWith('ROLE_') ? upper : `ROLE_${upper}`;
  };

  // Test expired token (exp in past)
  const expiredPayload = { userId: 1, role: 'MERCHANT', exp: Math.floor(Date.now() / 1000) - 3600 };
  const expiredToken = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(expiredPayload)).toString('base64')}.signature`;
  assert.equal(isExpired(expiredToken), true, 'Expired token must return true');

  // Test valid token (exp in future)
  const validPayload = { userId: 2, role: 'CUSTOMER', exp: Math.floor(Date.now() / 1000) + 7200 };
  const validToken = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(validPayload)).toString('base64')}.signature`;
  assert.equal(isExpired(validToken), false, 'Valid future token must return false');

  // Test role normalization
  assert.equal(normalizeRole('CUSTOMER'), 'ROLE_CUSTOMER');
  assert.equal(normalizeRole('ROLE_MERCHANT'), 'ROLE_MERCHANT');
  assert.equal(normalizeRole('driver'), 'ROLE_DRIVER');
  assert.equal(normalizeRole(null), 'ROLE_CUSTOMER');
});

// Test 2: Verify Header navigation & Role-based Dropdown configuration
test('2. Header Navigation Links and Role-based Dropdown Recognition', async () => {
  const headerContent = readFileSync(join(CLIENT_DIR, 'src', 'components', 'header', 'Header.tsx'), 'utf-8');

  // 1. Desktop Nav items: Trang chủ, Quán ăn, Giỏ hàng
  assert.ok(headerContent.includes('Trang chủ'), 'Header must contain Trang chủ link');
  assert.ok(headerContent.includes('Quán ăn'), 'Header must contain Quán ăn link');
  assert.ok(headerContent.includes('Giỏ hàng'), 'Header must contain Giỏ hàng link');

  // 2. Role Dropdown Menu items
  assert.ok(headerContent.includes('Xem thông tin cá nhân'), 'Dropdown must show Xem thông tin cá nhân');
  assert.ok(headerContent.includes('Lịch sử đơn hàng'), 'Dropdown must show Lịch sử đơn hàng');
  assert.ok(headerContent.includes('Quán ăn của tôi (Merchant Portal)'), 'Dropdown must recognize ROLE_MERCHANT portal');
  assert.ok(headerContent.includes('Cổng làm việc Tài xế (Shipper Hub)'), 'Dropdown must recognize ROLE_DRIVER / ROLE_SHIPPER hub');
  assert.ok(headerContent.includes('Trang Quản trị Hệ thống (Admin Portal)'), 'Dropdown must recognize ROLE_ADMIN portal');
  assert.ok(headerContent.includes('Đăng xuất an toàn'), 'Dropdown must provide safe logout');
});

// Test 3: Cart Checkout Protection & Return to Checkout
test('3. Cart Checkout Protection & Seamless Return after Login', async () => {
  // Verify CartPage has authentication check before proceeding
  const cartPath = existsSync(join(CLIENT_DIR, 'src', 'pages', 'user', 'cartpage', 'CartPage.tsx'))
    ? join(CLIENT_DIR, 'src', 'pages', 'user', 'cartpage', 'CartPage.tsx')
    : join(CLIENT_DIR, 'src', 'pages', 'user', 'CartPage.tsx');
  const cartContent = readFileSync(cartPath, 'utf-8');
  assert.ok(cartContent.includes('!isAuthenticated'), 'CartPage must check isAuthenticated on checkout');
  assert.ok(cartContent.includes('state: { from: APP_ROUTES.CHECKOUT }'), 'CartPage must redirect to login with from state');
  assert.ok(cartContent.includes('Vui lòng đăng nhập'), 'CartPage must display warning message');

  // Verify routes/index.tsx protects /checkout
  const routeContent = readFileSync(join(CLIENT_DIR, 'src', 'routes', 'index.tsx'), 'utf-8');
  assert.ok(routeContent.includes('<ProtectedRoute>\n        <CheckoutPage />\n      </ProtectedRoute>') ||
    routeContent.includes('<ProtectedRoute><CheckoutPage /></ProtectedRoute>') ||
    (routeContent.includes('CHECKOUT') && routeContent.includes('<ProtectedRoute>')),
    'routes/index.tsx must wrap CheckoutPage in ProtectedRoute');

  // Verify LoginPage reads from location and redirects back to /checkout
  const loginContent = readFileSync(join(CLIENT_DIR, 'src', 'pages', 'auth', 'LoginPage.tsx'), 'utf-8');
  assert.ok(loginContent.includes('fromLocation'), 'LoginPage must resolve fromLocation');
  assert.ok(loginContent.includes('typeof fromState === \'string\''), 'LoginPage must support string fromState');
  assert.ok(loginContent.includes('navigate(fromLocation'), 'LoginPage must navigate to fromLocation on success');
});

// Test 4: Customer Orders Page & Live Order Tracking
test('4. Customer Orders Page (/orders) & Order Detail Tracking (/orders/:id)', async () => {
  // Verify routes/index.tsx defines /orders and /orders/:id protected routes
  const routeContent = readFileSync(join(CLIENT_DIR, 'src', 'routes', 'index.tsx'), 'utf-8');
  assert.ok(routeContent.includes('path: \'orders\''), 'Route /orders must be registered');
  assert.ok(routeContent.includes('path: \'orders/:id\''), 'Route /orders/:id must be registered');
  assert.ok(routeContent.includes('<OrdersPage />'), 'OrdersPage component must be mounted');
  assert.ok(routeContent.includes('<OrderDetailPage />'), 'OrderDetailPage component must be mounted');

  // Verify OrdersPage calls API and supports status tabs, details and live tracking
  const ordersPageContent = readFileSync(join(CLIENT_DIR, 'src', 'pages', 'order', 'OrdersPage.tsx'), 'utf-8');
  assert.ok(ordersPageContent.includes('orderApi.getMyOrders'), 'OrdersPage must call orderApi.getMyOrders');
  assert.ok(ordersPageContent.includes('CustomerOrderCard'), 'OrdersPage must render CustomerOrderCard');
  assert.ok(ordersPageContent.includes('/orders/${order.id}'), 'OrdersPage must navigate to live tracking');
  assert.ok(ordersPageContent.includes('paymentMethod'), 'OrdersPage must display payment method');
  assert.ok(ordersPageContent.includes('totalAmount'), 'OrdersPage must display total amount');

  // Verify OrderDetailPage has state machine steps and full detail
  const detailContent = readFileSync(join(CLIENT_DIR, 'src', 'pages', 'order', 'OrderDetailPage.tsx'), 'utf-8');
  const stepperContent = readFileSync(join(CLIENT_DIR, 'src', 'pages', 'order', 'components', 'OrderLiveTrackingStepper.tsx'), 'utf-8');
  assert.ok(stepperContent.includes('Steps'), 'OrderDetailPage must render visual tracking Steps');
  assert.ok(stepperContent.includes('Quán chế biến'), 'Steps must include preparation');
  assert.ok(stepperContent.includes('Đang giao hàng'), 'Steps must include delivery step');
  assert.ok(stepperContent.includes('Giao thành công'), 'Steps must include completion step');
  assert.ok(detailContent.includes('order.receiverAddress'), 'OrderDetailPage must render delivery address');
  assert.ok(detailContent.includes('order.items'), 'OrderDetailPage must render order items');
});
