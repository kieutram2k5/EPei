/* ============================================================
   EPei - api.js  v5.0
   Dùng JWT token (Bearer) — hoạt động trên cả localhost lẫn Vercel
   ============================================================ */
'use strict';

// Tự động detect URL backend
// - Vercel: cùng domain → dùng /api/...
// - Localhost port 3000: cùng origin → dùng /api/...
// - Localhost port 80 (Apache): gọi sang Node port 3000
const API_BASE = (() => {
  const { hostname, port } = window.location;
  // Vercel hoặc bất kỳ domain nào không phải localhost:80
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return '/api';
  if (port === '3000' || port === '') return '/api';
  // Apache port 80 → gọi Node port 3000
  return 'http://localhost:3000/api';
})();

// ── Token storage (JWT stateless) ────────────────────────────────────────────
const TOKEN_KEY = 'epei_token';
const USER_KEY  = 'epei_user';

function saveAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user)  localStorage.setItem(USER_KEY,  JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function getSavedUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}

// ── Core fetch ────────────────────────────────────────────────────────────────
async function apiCall(endpoint, method = 'GET', data = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token   = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const opts = { method, headers };
  if (data && method !== 'GET') opts.body = JSON.stringify(data);

  try {
    const res  = await fetch(endpoint, opts);
    const text = await res.text();
    if (!text.trim()) return { success: false, message: 'Server trả về rỗng' };
    if (text[0] !== '{' && text[0] !== '[') {
      console.error('Non-JSON:', text.slice(0, 300));
      return { success: false, message: 'Lỗi server' };
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('API error:', e);
    return { success: false, message: 'Không kết nối được server' };
  }
}

// ── API object ────────────────────────────────────────────────────────────────
const API = {
  /* Auth */
  login(d) {
    return apiCall(`${API_BASE}/auth?action=login`, 'POST', d).then(r => {
      if (r.success) saveAuth(r.token, r.user);
      return r;
    });
  },
  register(d) {
    return apiCall(`${API_BASE}/auth?action=register`, 'POST', d).then(r => {
      if (r.success) saveAuth(r.token, r.user);
      return r;
    });
  },
  logout() {
    clearAuth();
    return Promise.resolve({ success: true, message: 'Đã đăng xuất' });
  },
  getMe() {
    // Ưu tiên dùng token local để không cần round-trip
    const user = getSavedUser();
    if (user && getToken()) return Promise.resolve({ success: true, user });
    return Promise.resolve({ success: false, message: 'Chưa đăng nhập' });
  },

  /* Products */
  getProducts:   (cat='') => apiCall(`${API_BASE}/products${cat && cat!=='all' ? '?category='+encodeURIComponent(cat) : ''}`),
  getProduct:    id       => apiCall(`${API_BASE}/products?id=${id}`),
  createProduct: d        => apiCall(`${API_BASE}/products`,       'POST',   d),
  updateProduct: (id, d)  => apiCall(`${API_BASE}/products?id=${id}`, 'PUT', d),
  deleteProduct: id       => apiCall(`${API_BASE}/products?id=${id}`, 'DELETE'),

  /* Orders */
  createOrder:       d            => apiCall(`${API_BASE}/orders`,                    'POST',  d),
  getOrders:         (s='',st='') => apiCall(`${API_BASE}/orders?search=${encodeURIComponent(s)}&status=${st}`),
  getMyOrders:       ()           => apiCall(`${API_BASE}/orders?action=mine`),
  getOrder:          id           => apiCall(`${API_BASE}/orders?id=${encodeURIComponent(id)}`),
  updateOrderStatus: (id, status) => apiCall(`${API_BASE}/orders?id=${encodeURIComponent(id)}&action=status`, 'PATCH', { status }),
  confirmPayment:    id           => apiCall(`${API_BASE}/orders?id=${encodeURIComponent(id)}&action=payment`, 'PATCH'),

  /* Messages */
  sendMessage:     d  => apiCall(`${API_BASE}/messages`,       'POST',  d),
  getMessages:     () => apiCall(`${API_BASE}/messages`),
  markMessageRead: id => apiCall(`${API_BASE}/messages?id=${id}`, 'PATCH'),

  /* Payment */
  getPaymentInfo:    () => apiCall(`${API_BASE}/payment`),
  updatePaymentInfo:  d => apiCall(`${API_BASE}/payment`,       'PUT',   d),

  /* Users */
  getUsers:      () => apiCall(`${API_BASE}/users`),
  updateProfile:  d => apiCall(`${API_BASE}/users?action=profile`, 'PATCH', d),
  getStats:      () => apiCall(`${API_BASE}/users?action=stats`),

  /* Upload QR (multipart) */
  uploadQrImage(formData) {
    const token = getToken();
    return fetch(`${API_BASE}/upload?action=qr`, {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData,
    }).then(r => r.json()).catch(e => ({ success: false, message: e.message }));
  },
};
