/* ============================================
   EPei - api.js  v2.0
   ============================================ */
'use strict';

// Detect API base path — works for both:
// http://localhost/EPei/index.html  → /EPei/backend/api
// http://localhost/EPei/frontend/index.html → /EPei/backend/api
const API_BASE = (function() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // parts[0] is always the project folder: 'EPei'
  if (parts.length >= 1) {
    return '/' + parts[0] + '/backend/api';
  }
  return '/EPei/backend/api';
})();

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }
  try {
    const res  = await fetch(endpoint, options);
    const text = await res.text();

    if (!text.trim()) {
      console.error('Empty response from:', endpoint);
      return { success: false, message: 'Server trả về rỗng' };
    }

    // Check for PHP errors/warnings before JSON
    if (text.trim()[0] !== '{' && text.trim()[0] !== '[') {
      console.error('Non-JSON response from:', endpoint, '\n', text.substring(0, 300));
      return { success: false, message: 'Lỗi server PHP. Xem Console để biết chi tiết.' };
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', e, '\nResponse:', text.substring(0, 300));
      return { success: false, message: 'Lỗi parse JSON từ server' };
    }
  } catch (err) {
    console.error('Fetch error for', endpoint, ':', err);
    return { success: false, message: 'Không kết nối được server. Kiểm tra XAMPP đang chạy.' };
  }
}

const API = {
  /* Auth */
  login:    d  => apiCall(`${API_BASE}/auth.php?action=login`,    'POST', d),
  register: d  => apiCall(`${API_BASE}/auth.php?action=register`, 'POST', d),
  logout:   () => apiCall(`${API_BASE}/auth.php?action=logout`,   'POST'),
  getMe:    () => apiCall(`${API_BASE}/auth.php?action=me`),

  /* Products */
  getProducts:   (cat='') => apiCall(`${API_BASE}/products.php?action=list&category=${encodeURIComponent(cat)}`),
  getProduct:    id       => apiCall(`${API_BASE}/products.php?action=get&id=${id}`),
  createProduct: d        => apiCall(`${API_BASE}/products.php?action=create`, 'POST', d),
  updateProduct: (id, d)  => apiCall(`${API_BASE}/products.php?action=update&id=${id}`, 'POST', d),
  deleteProduct: id       => apiCall(`${API_BASE}/products.php?action=delete&id=${id}`, 'POST'),

  /* Orders */
  createOrder:     d            => apiCall(`${API_BASE}/orders.php?action=create`, 'POST', d),
  getOrders:       (s='',st='') => apiCall(`${API_BASE}/orders.php?action=list&search=${encodeURIComponent(s)}&status=${st}`),
  getMyOrders:     ()           => apiCall(`${API_BASE}/orders.php?action=my`),
  getOrder:        id           => apiCall(`${API_BASE}/orders.php?action=get&id=${encodeURIComponent(id)}`),
  updateOrderStatus:(id,status) => apiCall(`${API_BASE}/orders.php?action=update_status&id=${encodeURIComponent(id)}`, 'POST', {status}),

  /* Messages */
  sendMessage:     d  => apiCall(`${API_BASE}/messages.php?action=send`, 'POST', d),
  getMessages:     () => apiCall(`${API_BASE}/messages.php?action=list`),
  markMessageRead: id => apiCall(`${API_BASE}/messages.php?action=read&id=${id}`, 'POST'),

  /* Payment */
  getPaymentInfo:   ()  => apiCall(`${API_BASE}/payment.php?action=get`),
  updatePaymentInfo: d  => apiCall(`${API_BASE}/payment.php?action=update`, 'POST', d),
  confirmPayment:   id  => apiCall(`${API_BASE}/payment.php?action=confirm&order_id=${encodeURIComponent(id)}`, 'POST'),

  /* Users */
  getUsers:      () => apiCall(`${API_BASE}/users.php?action=list`),
  updateProfile: d  => apiCall(`${API_BASE}/users.php?action=update_profile`, 'POST', d),
  getStats:      () => apiCall(`${API_BASE}/users.php?action=stats`),
};
