/* ============================================
   EPei - admin.js - Admin Dashboard Logic
   ============================================ */
'use strict';

async function renderAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') return;
  document.getElementById('adminUserName').textContent = currentUser.name;

  // Load stats
  const statsRes = await API.getStats();
  if (statsRes.success) {
    const d = statsRes.data;
    document.getElementById('totalOrdersCount').textContent = d.total_orders;
    document.getElementById('totalRevenue').textContent = Number(d.revenue).toLocaleString('vi-VN') + 'đ';
    document.getElementById('totalCustomers').textContent = d.customers;
    document.getElementById('pendingOrders').textContent = d.pending_orders;
    const badge = document.getElementById('unreadBadge');
    if (badge) {
      badge.textContent = d.unread_messages;
      badge.classList.toggle('hidden', d.unread_messages === 0);
    }
  }

  // Recent orders
  const ordersRes = await API.getOrders();
  if (ordersRes.success) {
    const recent = ordersRes.data.slice(0, 5);
    document.getElementById('recentOrdersTable').innerHTML = ordersTableHTML(recent);
    renderOrdersTable(ordersRes.data);
  }

  renderAdminProducts();
  renderCustomersTable();
  renderMessagesTable();
  loadPaymentSettings();
}

function showAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
  const tabEl = document.getElementById('admin-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (btn) btn.classList.add('active');
  const titles = { dashboard: 'Dashboard', orders: 'Quản lý đơn hàng', products: 'Quản lý sản phẩm', customers: 'Khách hàng', messages: 'Tin nhắn', payment: 'Cài đặt thanh toán QR' };
  document.getElementById('adminPageTitle').textContent = titles[tab] || tab;
}

function ordersTableHTML(orders) {
  if (!orders || orders.length === 0) return '<p style="padding:24px;color:var(--olive);text-align:center">Chưa có đơn hàng nào</p>';
  return `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>${orders.map(o => `
      <tr>
        <td><strong style="color:var(--deep-green)">${o.id}</strong></td>
        <td>${o.customer_name}<br><small>${o.customer_phone}</small></td>
        <td>${formatDate(o.created_at)}</td>
        <td><strong style="color:var(--deep-green)">${Number(o.total).toLocaleString('vi-VN')}đ</strong></td>
        <td><span style="font-size:0.78rem">${o.payment_method === 'transfer' ? '<i class="fas fa-qrcode"></i> Chuyển khoản' : '<i class="fas fa-money-bill-wave"></i> COD'}</span></td>
        <td><span class="status-badge status-${o.order_status}">${statusLabel(o.order_status)}</span></td>
        <td>
          <button class="action-btn view" onclick="viewOrderDetail('${o.id}')"><i class="fas fa-eye"></i></button>
          ${o.order_status === 'pending' ? `<button class="action-btn view" onclick="updateOrderStatus('${o.id}','confirmed')">Xác nhận</button>` : ''}
          ${o.order_status === 'confirmed' ? `<button class="action-btn view" onclick="updateOrderStatus('${o.id}','shipping')">Giao hàng</button>` : ''}
          ${o.order_status === 'shipping' ? `<button class="action-btn confirm" onclick="updateOrderStatus('${o.id}','done')">Hoàn thành</button>` : ''}
          ${o.payment_method === 'transfer' && o.payment_status !== 'paid' ? `<button class="action-btn confirm" onclick="confirmPaymentAdmin('${o.id}')"><i class="fas fa-check"></i> Xác nhận TT</button>` : ''}
          ${o.order_status !== 'cancelled' && o.order_status !== 'done' ? `<button class="action-btn delete" onclick="updateOrderStatus('${o.id}','cancelled')">Hủy</button>` : ''}
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

function renderOrdersTable(orders) {
  const el = document.getElementById('ordersTable');
  if (el) el.innerHTML = ordersTableHTML(orders);
}

async function updateOrderStatus(orderId, status) {
  const res = await API.updateOrderStatus(orderId, status);
  if (res.success) {
    showToast(`Đơn ${orderId}: ${statusLabel(status)}`, 'success');
    renderAdminDashboard();
  } else {
    showToast(res.message || 'Lỗi cập nhật', 'error');
  }
}

async function confirmPaymentAdmin(orderId) {
  const res = await API.confirmPayment(orderId);
  if (res.success) {
    showToast('Đã xác nhận thanh toán', 'success');
    renderAdminDashboard();
  }
}

async function filterOrders() {
  const search = document.getElementById('orderSearch')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || '';
  const res = await API.getOrders(search, status);
  if (res.success) renderOrdersTable(res.data);
}

async function viewOrderDetail(orderId) {
  const res = await API.getOrder(orderId);
  if (!res.success) { showToast('Không tìm thấy đơn hàng', 'error'); return; }
  const o = res.data;
  document.getElementById('orderDetailContent').innerHTML = `
    <h3 style="margin-bottom:20px">Chi tiết đơn hàng: <span style="color:var(--deep-green)">${o.id}</span></h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div><strong>Khách hàng:</strong><p>${o.customer_name}</p></div>
      <div><strong>Điện thoại:</strong><p>${o.customer_phone}</p></div>
      <div><strong>Email:</strong><p>${o.customer_email || 'N/A'}</p></div>
      <div><strong>Ngày đặt:</strong><p>${formatDate(o.created_at)}</p></div>
      <div style="grid-column:1/-1"><strong>Địa chỉ:</strong><p>${o.customer_address}</p></div>
      ${o.note ? `<div style="grid-column:1/-1"><strong>Ghi chú:</strong><p>${o.note}</p></div>` : ''}
    </div>
    <h4 style="margin-bottom:12px">Sản phẩm đặt hàng:</h4>
    <table class="admin-table" style="margin-bottom:16px">
      <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th></tr></thead>
      <tbody>${(o.items || []).map(i => `
        <tr>
          <td>${i.product_name}</td>
          <td>${Number(i.price).toLocaleString('vi-VN')}đ</td>
          <td>${i.quantity}</td>
          <td><strong>${Number(i.subtotal).toLocaleString('vi-VN')}đ</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="text-align:right;font-size:1.1rem;font-weight:700;color:var(--deep-green)">
      Tổng cộng: ${Number(o.total).toLocaleString('vi-VN')}đ
    </div>
    <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
      <span class="status-badge status-${o.order_status}">${statusLabel(o.order_status)}</span>
      <span style="font-size:0.82rem;color:var(--olive)">${o.payment_method === 'transfer' ? 'Chuyển khoản' : 'COD'} – ${o.payment_status === 'paid' ? '<span style="color:var(--deep-green)">Đã thanh toán</span>' : 'Chưa thanh toán'}</span>
    </div>`;
  document.getElementById('orderDetailModal').classList.add('active');
}

async function renderAdminProducts() {
  const el = document.getElementById('adminProductsTable');
  if (!el) return;
  const res = await API.getProducts();
  if (!res.success) return;
  el.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Eco</th><th>Tồn kho</th><th>Thao tác</th></tr></thead>
    <tbody>${res.data.map(p => `
      <tr>
        <td><strong>${p.name}</strong><br><small>${p.ingredient}</small></td>
        <td>${p.category}</td>
        <td>${Number(p.price).toLocaleString('vi-VN')}đ/${p.unit}</td>
        <td><span class="eco-score">Eco ${p.eco_score}%</span></td>
        <td>${p.stock}</td>
        <td>
          <button class="action-btn edit" onclick="openEditProductModal(${p.id})"><i class="fas fa-edit"></i> Sửa</button>
          <button class="action-btn delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i> Xóa</button>
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

async function renderCustomersTable() {
  const el = document.getElementById('customersTable');
  if (!el) return;
  const res = await API.getUsers();
  if (!res.success) return;
  el.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr><th>Tên</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Ngày đăng ký</th></tr></thead>
    <tbody>${res.data.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || 'N/A'}</td>
        <td><span class="role-badge ${u.role}">${u.role === 'admin' ? 'Admin' : 'Khách hàng'}</span></td>
        <td>${formatDate(u.created_at)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

async function renderMessagesTable() {
  const el = document.getElementById('messagesTable');
  if (!el) return;
  const res = await API.getMessages();
  if (!res.success) return;
  if (res.data.length === 0) {
    el.innerHTML = '<p style="padding:24px;color:var(--olive);text-align:center">Chưa có tin nhắn nào</p>';
    return;
  }
  el.innerHTML = `<div style="overflow-x:auto"><table class="admin-table">
    <thead><tr><th>Người gửi</th><th>Email</th><th>Chủ đề</th><th>Ngày</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>${res.data.map(m => `
      <tr style="${!m.is_read ? 'font-weight:600;background:rgba(74,124,89,0.04)' : ''}">
        <td>${m.name}${m.organization ? `<br><small>${m.organization}</small>` : ''}</td>
        <td>${m.email}</td>
        <td>${m.subject || m.content.substring(0, 40) + '...'}</td>
        <td>${formatDate(m.created_at)}</td>
        <td>${m.is_read ? '<span style="color:var(--olive);font-size:0.8rem">Đã đọc</span>' : '<span style="color:var(--deep-green);font-size:0.8rem;font-weight:700">Mới</span>'}</td>
        <td>
          ${!m.is_read ? `<button class="action-btn view" onclick="markMessageRead(${m.id})"><i class="fas fa-check"></i> Đánh dấu đọc</button>` : ''}
          <button class="action-btn view" onclick="viewMessage(${m.id},'${encodeURIComponent(JSON.stringify(m))}')"><i class="fas fa-eye"></i></button>
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

async function markMessageRead(id) {
  await API.markMessageRead(id);
  renderMessagesTable();
  renderAdminDashboard();
}

function viewMessage(id, encodedMsg) {
  const m = JSON.parse(decodeURIComponent(encodedMsg));
  document.getElementById('orderDetailContent').innerHTML = `
    <h3 style="margin-bottom:20px">Tin nhắn từ ${m.name}</h3>
    <div style="display:grid;gap:12px">
      <div><strong>Email:</strong> ${m.email}</div>
      ${m.organization ? `<div><strong>Tổ chức:</strong> ${m.organization}</div>` : ''}
      ${m.subject ? `<div><strong>Chủ đề:</strong> ${m.subject}</div>` : ''}
      <div><strong>Ngày:</strong> ${formatDate(m.created_at)}</div>
      <div style="background:var(--ivory);border-radius:10px;padding:16px;margin-top:8px">
        <strong>Nội dung:</strong>
        <p style="margin-top:8px;line-height:1.7;color:var(--olive)">${m.content}</p>
      </div>
    </div>
    <div style="margin-top:20px">
      <a href="mailto:${m.email}" class="btn btn-primary"><i class="fas fa-reply"></i> Trả lời qua Email</a>
    </div>`;
  document.getElementById('orderDetailModal').classList.add('active');
  if (!m.is_read) markMessageRead(id);
}

// Product CRUD
function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'Thêm sản phẩm mới';
  document.getElementById('editProductId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('addProductModal').classList.add('active');
}

async function openEditProductModal(id) {
  const res = await API.getProduct(id);
  if (!res.success) return;
  const p = res.data;
  document.getElementById('productModalTitle').textContent = 'Chỉnh sửa sản phẩm';
  document.getElementById('editProductId').value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pUnit').value = p.unit;
  document.getElementById('pEco').value = p.eco_score;
  document.getElementById('pStock').value = p.stock;
  document.getElementById('pIngredient').value = p.ingredient;
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pIcon').value = p.icon;
  document.getElementById('pImgClass').value = p.img_class;
  document.getElementById('addProductModal').classList.add('active');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('editProductId').value;
  const data = {
    name: document.getElementById('pName').value,
    category: document.getElementById('pCategory').value,
    price: parseInt(document.getElementById('pPrice').value),
    unit: document.getElementById('pUnit').value,
    eco_score: parseInt(document.getElementById('pEco').value),
    stock: parseInt(document.getElementById('pStock').value),
    ingredient: document.getElementById('pIngredient').value,
    badge: document.getElementById('pBadge').value,
    description: document.getElementById('pDesc').value,
    icon: document.getElementById('pIcon').value,
    img_class: document.getElementById('pImgClass').value,
  };
  showLoading(true);
  const res = id ? await API.updateProduct(id, data) : await API.createProduct(data);
  showLoading(false);
  if (res.success) {
    showToast(res.message, 'success');
    document.getElementById('addProductModal').classList.remove('active');
    renderAdminProducts();
    window.PRODUCTS_CACHE = [];
  } else {
    showToast(res.message || 'Lỗi lưu sản phẩm', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
  const res = await API.deleteProduct(id);
  if (res.success) {
    showToast('Đã xóa sản phẩm', 'success');
    renderAdminProducts();
    window.PRODUCTS_CACHE = [];
  }
}

async function loadPaymentSettings() {
  const res = await API.getPaymentInfo();
  if (res.success && res.data) {
    const d = res.data;
    document.getElementById('payBankName').value = d.bank_name || '';
    document.getElementById('payAccountNumber').value = d.account_number || '';
    document.getElementById('payAccountName').value = d.account_name || '';
    document.getElementById('payQrContent').value = d.qr_content || '';
    document.getElementById('payDescription').value = d.description || '';
  }
}

async function savePaymentSettings(e) {
  e.preventDefault();
  const data = {
    bank_name: document.getElementById('payBankName').value,
    account_number: document.getElementById('payAccountNumber').value,
    account_name: document.getElementById('payAccountName').value,
    qr_content: document.getElementById('payQrContent').value,
    description: document.getElementById('payDescription').value,
  };
  showLoading(true);
  const res = await API.updatePaymentInfo(data);
  showLoading(false);
  if (res.success) {
    showToast('Đã lưu cài đặt thanh toán', 'success');
  } else {
    showToast(res.message || 'Lỗi lưu cài đặt', 'error');
  }
}

function previewQR() {
  const url = document.getElementById('payQrContent').value;
  const preview = document.getElementById('qrPreview');
  if (!url) { showToast('Vui lòng nhập URL QR', 'error'); return; }
  preview.innerHTML = `<p style="margin-bottom:10px;font-weight:600">Xem trước QR:</p><img src="${url}" alt="QR Preview" style="max-width:200px;margin:0 auto;border-radius:10px" onerror="this.parentElement.innerHTML='<p style=color:red>Không tải được ảnh QR</p>'" />`;
  preview.classList.remove('hidden');
}
