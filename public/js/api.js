/* ============================================================
   EPei - api.js  v5.0  — JWT stateless, Vercel-ready
   ============================================================ */
'use strict';

const API_BASE = (() => {
  const { hostname, port } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return '/api';
  if (port === '3000' || port === '') return '/api';
  return 'http://localhost:3000/api';
})();

const TOKEN_KEY = 'epei_token';
const USER_KEY  = 'epei_user';

function saveAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user)  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
function getToken()     { return localStorage.getItem(TOKEN_KEY); }
function getSavedUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

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
      return { success: false, message: 'Lỗi server: ' + text.slice(0, 80) };
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('API error:', e);
    return { success: false, message: 'Không kết nối được server' };
  }
}

const API = {
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
  logout() { clearAuth(); return Promise.resolve({ success: true }); },
  getMe() {
    const user = getSavedUser();
    if (user && getToken()) return Promise.resolve({ success: true, user });
    return Promise.resolve({ success: false, message: 'Chưa đăng nhập' });
  },

  getProducts:   (cat='') => apiCall(`${API_BASE}/products${cat && cat!=='all' ? '?category='+encodeURIComponent(cat) : ''}`),
  getProduct:    id       => apiCall(`${API_BASE}/products?id=${id}`),
  createProduct: d        => apiCall(`${API_BASE}/products`, 'POST', d),
  updateProduct: (id, d)  => apiCall(`${API_BASE}/products?id=${id}`, 'PUT', d),
  deleteProduct: id       => apiCall(`${API_BASE}/products?id=${id}`, 'DELETE'),

  createOrder:       d            => apiCall(`${API_BASE}/orders`, 'POST', d),
  getOrders:         (s='',st='') => apiCall(`${API_BASE}/orders?search=${encodeURIComponent(s)}&status=${st}`),
  getMyOrders:       ()           => apiCall(`${API_BASE}/orders?action=mine`),
  getOrder:          id           => apiCall(`${API_BASE}/orders?id=${encodeURIComponent(id)}`),
  updateOrderStatus: (id, status) => apiCall(`${API_BASE}/orders?id=${encodeURIComponent(id)}&action=status`, 'PATCH', { status }),
  confirmPayment:    id           => apiCall(`${API_BASE}/orders?id=${encodeURIComponent(id)}&action=payment`, 'PATCH'),

  sendMessage:     d  => apiCall(`${API_BASE}/messages`, 'POST', d),
  getMessages:     () => apiCall(`${API_BASE}/messages`),
  markMessageRead: id => apiCall(`${API_BASE}/messages?id=${id}`, 'PATCH'),

  getPaymentInfo:    () => apiCall(`${API_BASE}/payment`),
  updatePaymentInfo:  d => apiCall(`${API_BASE}/payment`, 'PUT', d),

  getUsers:      () => apiCall(`${API_BASE}/users`),
  updateProfile:  d => apiCall(`${API_BASE}/users?action=profile`, 'PATCH', d),
  getStats:      () => apiCall(`${API_BASE}/users?action=stats`),

  uploadQrImage(formData) {
    const token = getToken();
    return fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData,
    }).then(r => r.json()).catch(e => ({ success: false, message: e.message }));
  },
};
