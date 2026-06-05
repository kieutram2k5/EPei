/**
 * EPei - test.js
 * Chạy: node backend/setup/test.js
 * Kiểm tra toàn bộ API
 */
'use strict';

const http = require('http');

function req(method, path, body) {
  return new Promise((resolve) => {
    const data   = body ? JSON.stringify(body) : null;
    const opts   = {
      hostname: 'localhost', port: 3000, path,
      method, headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const r = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ code: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ code: res.statusCode, data: { raw } }); }
      });
    });
    r.on('error', e => resolve({ code: 0, error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

async function runTests() {
  const ok  = (msg) => console.log(`  ✅ ${msg}`);
  const err = (msg) => console.log(`  ❌ ${msg}`);

  console.log('\n═══════════════════════════════');
  console.log('  EPei Node.js API Tests');
  console.log('═══════════════════════════════\n');

  // 1. Auth /me
  let r = await req('GET', '/api/auth/me');
  r.data?.message === 'Chưa đăng nhập' ? ok('GET /api/auth/me — chưa đăng nhập') : err('auth/me: ' + JSON.stringify(r));

  // 2. Products
  r = await req('GET', '/api/products');
  r.data?.success && r.data.data?.length > 0
    ? ok(`GET /api/products — ${r.data.data.length} sản phẩm`)
    : err('products: ' + JSON.stringify(r.data));

  // 3. Login admin
  r = await req('POST', '/api/auth?action=login', { email: 'admin@epei.vn', password: 'admin123' });
  r.data?.success && r.data.user?.role === 'admin'
    ? ok('POST /api/auth?action=login — admin OK token:' + (r.data.token ? 'YES' : 'NO'))
    : err('login admin: ' + JSON.stringify(r.data));

  // 4. Login user
  r = await req('POST', '/api/auth?action=login', { email: 'user@epei.vn', password: 'user123' });
  r.data?.success
    ? ok(`POST /api/auth?action=login — ${r.data.user?.name} OK`)
    : err('login user: ' + JSON.stringify(r.data));

  // 5. Payment
  r = await req('GET', '/api/payment');
  r.data?.success && r.data.data?.bank_name
    ? ok(`GET /api/payment — ${r.data.data.bank_name}`)
    : err('payment: ' + JSON.stringify(r.data));

  // 6. Create order
  r = await req('POST', '/api/orders', {
    customer_name: 'Test EPei', customer_phone: '0981175522',
    customer_address: '123 Test HCM', payment_method: 'cod',
    items: [{ id: 1, qty: 2 }, { id: 3, qty: 1 }],
  });
  if (r.data?.success) {
    ok(`POST /api/orders — ${r.data.order_id} — ${Number(r.data.total).toLocaleString('vi-VN')}đ`);
    // Cleanup via direct DB (skip, test order sẽ xuất hiện trong admin)
  } else {
    err('order: ' + JSON.stringify(r.data));
  }

  // 7. Products filter
  r = await req('GET', '/api/products?category=card');
  r.data?.success
    ? ok(`GET /api/products?category=card — ${r.data.data?.length} thiệp`)
    : err('products filter: ' + JSON.stringify(r.data));

  // 8. Messages
  r = await req('POST', '/api/messages', { name: 'Test', email: 'test@epei.vn', content: 'Test message' });
  r.data?.success
    ? ok('POST /api/messages — gửi thành công')
    : err('messages: ' + JSON.stringify(r.data));

  console.log('\n═══════════════════════════════');
  console.log('  Mở: http://localhost:3000');
  console.log('═══════════════════════════════\n');
}

runTests().catch(console.error);
