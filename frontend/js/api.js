/* ============================================
   EPei - api.js  v4.0 — Node.js backend
   ============================================ */
'use strict';

// Node server chạy port 3000
const API_BASE = 'http://localhost:3000/api';

async function apiCall(endpoint, method = 'GET', data = null) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (data && method !== 'GET') opts.body = JSON.stringify(data);

  try {
    const res  = await fetch(endpoint, opts);
    const text = await res.text();
    if (!text.trim()) return { success: false, message: 'Server trả về rỗng' };
    if (text[0] !== '{' && text[0] !== '[') {
      console.error('Non-JSON:', text.slice(0, 200));
      return { success: false, message: 'Lỗi server. Xem console.' };
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('Fetch error:', e);
    return { success: false, message: 'Không kết nối được server. Hãy chạy: node server.js' };
  }
}

const API = {
  /* Auth */
  login:    d  => apiCall(`${API_BASE}/auth/login`,    'POST', d),
  register: d  => apiCall(`${API_BASE}/auth/register`, 'POST', d),
  logout:   () => apiCall(`${API_BASE}/auth/logout`,   'POST'),
  getMe:    () => apiCall(`${API_BASE}/auth/me`),

  /* Products */
  getProducts:   (cat='') => apiCall(`${API_BASE}/products${cat && cat!=='all' ? '?category='+encodeURIComponent(cat) : ''}`),
  getProduct:    id       => apiCall(`${API_BASE}/products/${id}`),
  createProduct: d        => apiCall(`${API_BASE}/products`,   'POST', d),
  updateProduct: (id, d)  => apiCall(`${API_BASE}/products/${id}`, 'PUT',  d),
  deleteProduct: id       => apiCall(`${API_BASE}/products/${id}`, 'DELETE'),

  /* Orders */
  createOrder:      d          => apiCall(`${API_BASE}/orders`,         'POST', d),
  getOrders:        (s='',st='')=> apiCall(`${API_BASE}/orders?search=${encodeURIComponent(s)}&status=${st}`),
  getMyOrders:      ()          => apiCall(`${API_BASE}/orders/mine`),
  getOrder:         id          => apiCall(`${API_BASE}/orders/${encodeURIComponent(id)}`),
  updateOrderStatus:(id, status)=> apiCall(`${API_BASE}/orders/${encodeURIComponent(id)}/status`, 'PATCH', { status }),
  confirmPayment:   id          => apiCall(`${API_BASE}/orders/${encodeURIComponent(id)}/payment`, 'PATCH'),

  /* Messages */
  sendMessage:     d  => apiCall(`${API_BASE}/messages`,        'POST', d),
  getMessages:     () => apiCall(`${API_BASE}/messages`),
  markMessageRead: id => apiCall(`${API_BASE}/messages/${id}/read`, 'PATCH'),

  /* Payment */
  getPaymentInfo:    () => apiCall(`${API_BASE}/payment`),
  updatePaymentInfo:  d => apiCall(`${API_BASE}/payment`, 'PUT', d),
  confirmPaymentById:id => apiCall(`${API_BASE}/payment/confirm/${encodeURIComponent(id)}`, 'PATCH'),

  /* Users */
  getUsers:      () => apiCall(`${API_BASE}/users`),
  updateProfile:  d => apiCall(`${API_BASE}/users/profile`, 'PATCH', d),
  getStats:      () => apiCall(`${API_BASE}/users/stats`),

  /* Upload */
  uploadQrImage: (formData) => fetch(`${API_BASE}/upload/qr`, {
    method: 'POST', credentials: 'include', body: formData,
  }).then(r => r.json()).catch(e => ({ success: false, message: e.message })),
};
