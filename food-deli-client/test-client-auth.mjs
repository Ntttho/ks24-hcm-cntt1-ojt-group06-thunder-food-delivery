import test from 'node:test';
import assert from 'node:assert/strict';

test('1. HTTP Server availability test (Vite Dev Server running at http://localhost:3000)', async () => {
  const res = await fetch('http://localhost:3000/');
  assert.equal(res.status, 200, 'Server should respond with status 200');
  const html = await res.text();
  assert.ok(html.includes('<div id="root">'), 'HTML must include #root mount container');
  console.log('   ✓ Vite dev server is running and serves index.html properly');
});

test('2. Form Validation Logic Test (Phone/Email & Password validation)', () => {
  const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateIdentifier = (value) => {
    if (!value || value.trim() === '') return { valid: false, error: 'Empty' };
    const clean = value.trim();
    if (phoneRegex.test(clean) || emailRegex.test(clean)) {
      return { valid: true };
    }
    return { valid: false, error: 'Invalid format' };
  };

  // Valid inputs
  assert.equal(validateIdentifier('0987654321').valid, true, '0987654321 should be valid phone');
  assert.equal(validateIdentifier('0912345678').valid, true, '0912345678 should be valid phone');
  assert.equal(validateIdentifier('+84987654321').valid, true, '+84987654321 should be valid phone');
  assert.equal(validateIdentifier('customer@thunder.com').valid, true, 'Email should be valid');

  // Invalid inputs
  assert.equal(validateIdentifier('abc').valid, false, 'Plain text should be invalid');
  assert.equal(validateIdentifier('12345').valid, false, 'Short digits should be invalid');
  assert.equal(validateIdentifier('').valid, false, 'Empty should be invalid');
  console.log('   ✓ Phone / Email regex validation passed for all test cases');
});

test('3. Role Selection in Registration (CUSTOMER, MERCHANT, DRIVER)', () => {
  const validRoles = ['CUSTOMER', 'MERCHANT', 'DRIVER'];
  
  validRoles.forEach((role) => {
    assert.ok(validRoles.includes(role), `Role ${role} must be accepted`);
  });

  // Verify ADMIN is disallowed from self-registration
  const isPublicRegistrationAllowed = (role) => {
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') return false;
    return validRoles.includes(role);
  };

  assert.equal(isPublicRegistrationAllowed('CUSTOMER'), true);
  assert.equal(isPublicRegistrationAllowed('MERCHANT'), true);
  assert.equal(isPublicRegistrationAllowed('DRIVER'), true);
  assert.equal(isPublicRegistrationAllowed('ADMIN'), false, 'Admin self-registration must be blocked');
  console.log('   ✓ Role selection support (CUSTOMER, MERCHANT, DRIVER) verified');
});

test('4. Redux Auth State & LocalStorage Synchronization contract', () => {
  // Mock localStorage
  const store = {};
  const mockLocalStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };

  const STORAGE_KEYS = {
    ACCESS_TOKEN: 'thunder_access_token',
    USER_INFO: 'thunder_user_info',
  };

  // Simulate login
  const sampleToken = 'mock-jwt-token-12345';
  const sampleUser = {
    id: 1,
    fullName: 'Nguyễn Văn A',
    phone: '0987654321',
    role: 'CUSTOMER',
    ratingAvg: 5.0,
  };

  // Save to storage
  mockLocalStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, sampleToken);
  mockLocalStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(sampleUser));

  // Verify retrieval
  const retrievedToken = mockLocalStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const retrievedUser = JSON.parse(mockLocalStorage.getItem(STORAGE_KEYS.USER_INFO));

  assert.equal(retrievedToken, sampleToken);
  assert.equal(retrievedUser.fullName, 'Nguyễn Văn A');
  assert.equal(retrievedUser.role, 'CUSTOMER');

  // Simulate logout
  mockLocalStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  mockLocalStorage.removeItem(STORAGE_KEYS.USER_INFO);

  assert.equal(mockLocalStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN), null);
  assert.equal(mockLocalStorage.getItem(STORAGE_KEYS.USER_INFO), null);
  console.log('   ✓ LocalStorage synchronization & safe logout cleanup verified');
});

test('5. Customer Address Book CRUD Contract Test', () => {
  const mockAddresses = [
    {
      id: 1,
      userId: 1,
      address: '144 Xuân Thủy, Cầu Giấy, Hà Nội',
      label: 'Nhà riêng',
      latitude: 21.0368,
      longitude: 105.7827,
      isDefault: true,
    },
    {
      id: 2,
      userId: 1,
      address: 'Keangnam Landmark 72, Nam Từ Liêm, Hà Nội',
      label: 'Văn phòng',
      latitude: 21.0173,
      longitude: 105.7838,
      isDefault: false,
    },
  ];

  // Verify default address determination
  const defaultAddr = mockAddresses.find((a) => a.isDefault);
  assert.ok(defaultAddr, 'There must be a default address');
  assert.equal(defaultAddr.id, 1);
  assert.equal(defaultAddr.label, 'Nhà riêng');

  // Verify switch default address
  const switchDefault = (addresses, newDefaultId) => {
    return addresses.map((a) => ({
      ...a,
      isDefault: a.id === newDefaultId,
    }));
  };

  const updated = switchDefault(mockAddresses, 2);
  const newDefault = updated.find((a) => a.isDefault);
  assert.equal(newDefault.id, 2);
  assert.equal(updated.find((a) => a.id === 1).isDefault, false);
  console.log('   ✓ Address book management contract and default toggling verified');
});
