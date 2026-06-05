/* ============================================
   EPei - admin.js  v3.0 — Full & Clean
   ============================================ */
'use strict';

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */
async function renderAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') return;
  const nameEl = document.getElementById('adminUserName');
  if (nameEl) nameEl.textContent = currentUser.name;

  const statsRes = await API.getStats();
  if (statsRes.success) {
    const d = statsRes.data;
    _set('totalOrdersCount', d.total_orders);
    _set('totalRevenue',     Number(d.revenue).toLocaleString('vi-VN') + 'đ');
    _set('totalCustomers',   d.customers);
    _set('pendingOrders',    d.pending_orders);
    const badge = document.getElementById('unreadBadge');
    if (badge) {
      badge.textContent = d.unread_messages;
      badge.classList.toggle('hidden', d.unread_messages === 0);
    }
  }

  const ordersRes = await API.getOrders();
  if (ordersRes.success) {
    const el = document.getElementById('recentOrdersTable');
    if (el) el.innerHTML = ordersTableHTML(ordersRes.data.slice(0, 5));
    renderOrdersTable(ordersRes.data);
  }

  renderAdminProducts();
  renderCustomersTable();
  renderMessagesTable();
}

function _set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ════════════════════════════════════════════
   TABS
════════════════════════════════════════════ */
function showAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
  const tabEl = document.getElementById('admin-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (btn) btn.classList.add('active');
  const titles = {
    dashboard: 'Dashboard',
    orders:    'Quản lý đơn hàng',
    products:  'Quản lý sản phẩm',
    customers: 'Khách hàng',
    messages:  'Tin nhắn',
    payment:   'Cài đặt thanh toán QR',
  };
  _set('adminPageTitle', titles[tab] || tab);
  if (tab === 'payment') {
    loadPaymentSettings();
    setTimeout(_bindPreviewListeners, 150);
  }
}

/* ════════════════════════════════════════════
   ORDERS TABLE
════════════════════════════════════════════ */
function ordersTableHTML(orders) {
  if (!orders || !orders.length)
    return '<p style="padding:24px;color:var(--olive);text-align:center">Chưa có đơn hàng nào</p>';
  return `<div class="table-wrap"><table class="admin-table">
    <thead><tr>
      <th>Mã đơn</th><th>Khách hàng</th><th>Ngày</th>
      <th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th>
    </tr></thead>
    <tbody>${orders.map(o => `
      <tr>
        <td><strong style="color:var(--deep-green);font-size:0.82rem">${o.id}</strong></td>
        <td>${o.customer_name}<br><small>${o.customer_phone}</small></td>
        <td style="white-space:nowrap">${formatDate(o.created_at)}</td>
        <td><strong style="color:var(--deep-green)">${Number(o.total).toLocaleString('vi-VN')}đ</strong></td>
        <td><span style="font-size:0.78rem">${
          o.payment_method === 'transfer'
            ? '<i class="fas fa-qrcode" style="color:#2980b9"></i> Chuyển khoản'
            : '<i class="fas fa-money-bill-wave" style="color:var(--deep-green)"></i> COD'
        }</span>
        ${o.payment_status === 'paid' ? '<br><span style="font-size:0.72rem;color:var(--deep-green)">✓ Đã TT</span>' : ''}</td>
        <td><span class="status-badge status-${o.order_status}">${statusLabel(o.order_status)}</span></td>
        <td style="white-space:nowrap">
          <button class="action-btn view" onclick="viewOrderDetail('${o.id}')">
            <i class="fas fa-eye"></i>
          </button>
          ${o.order_status === 'pending'   ? `<button class="action-btn view"    onclick="updateOrderStatus('${o.id}','confirmed')">Xác nhận</button>` : ''}
          ${o.order_status === 'confirmed' ? `<button class="action-btn view"    onclick="updateOrderStatus('${o.id}','shipping')">Giao hàng</button>` : ''}
          ${o.order_status === 'shipping'  ? `<button class="action-btn confirm" onclick="updateOrderStatus('${o.id}','done')">Hoàn thành</button>` : ''}
          ${o.payment_method === 'transfer' && o.payment_status !== 'paid'
            ? `<button class="action-btn confirm" onclick="confirmPaymentAdmin('${o.id}')"><i class="fas fa-check-circle"></i> TT</button>` : ''}
          ${!['cancelled','done'].includes(o.order_status)
            ? `<button class="action-btn delete" onclick="updateOrderStatus('${o.id}','cancelled')">Hủy</button>` : ''}
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
  } else {
    showToast(res.message || 'Lỗi', 'error');
  }
}

async function filterOrders() {
  const search = document.getElementById('orderSearch')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || '';
  const res = await API.getOrders(search, status);
  if (res.success) renderOrdersTable(res.data);
}

async function viewOrderDetail(orderId) {
  showLoading(true);
  const res = await API.getOrder(orderId);
  showLoading(false);
  if (!res.success) { showToast('Không tìm thấy đơn hàng', 'error'); return; }
  const o = res.data;
  document.getElementById('orderDetailContent').innerHTML = `
    <h3 style="margin-bottom:20px">
      Chi tiết đơn hàng:
      <span style="color:var(--deep-green);font-size:1rem">${o.id}</span>
    </h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;font-size:0.9rem">
      <div><span style="color:var(--olive)">Khách hàng:</span><br><strong>${o.customer_name}</strong></div>
      <div><span style="color:var(--olive)">Điện thoại:</span><br><strong>${o.customer_phone}</strong></div>
      <div><span style="color:var(--olive)">Email:</span><br>${o.customer_email || 'N/A'}</div>
      <div><span style="color:var(--olive)">Ngày đặt:</span><br>${formatDate(o.created_at)}</div>
      <div style="grid-column:1/-1"><span style="color:var(--olive)">Địa chỉ:</span><br>${o.customer_address}</div>
      ${o.note ? `<div style="grid-column:1/-1"><span style="color:var(--olive)">Ghi chú:</span><br>${o.note}</div>` : ''}
    </div>
    <table class="admin-table" style="margin-bottom:16px">
      <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
      <tbody>${(o.items || []).map(i => `
        <tr>
          <td>${i.product_name}</td>
          <td>${Number(i.price).toLocaleString('vi-VN')}đ</td>
          <td>${i.quantity}</td>
          <td><strong style="color:var(--deep-green)">${Number(i.subtotal).toLocaleString('vi-VN')}đ</strong></td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="display:flex;justify-content:space-between;align-items:center;
                background:var(--ivory);padding:14px 16px;border-radius:10px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <span class="status-badge status-${o.order_status}">${statusLabel(o.order_status)}</span>
        <span style="font-size:0.82rem;color:${o.payment_status==='paid'?'var(--deep-green)':'var(--olive)'}">
          ${o.payment_method==='transfer'?'Chuyển khoản':'COD'} —
          ${o.payment_status==='paid'?'✓ Đã thanh toán':'Chưa thanh toán'}
        </span>
      </div>
      <strong style="font-size:1.15rem;color:var(--deep-green)">
        ${Number(o.total).toLocaleString('vi-VN')}đ
      </strong>
    </div>`;
  document.getElementById('orderDetailModal').classList.add('active');
}

/* ════════════════════════════════════════════
   PRODUCTS TABLE
════════════════════════════════════════════ */
async function renderAdminProducts() {
  const el = document.getElementById('adminProductsTable');
  if (!el) return;
  el.innerHTML = '<div class="loading-products"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
  const res = await API.getProducts();
  if (!res.success) { el.innerHTML = '<p style="color:red;padding:20px">Lỗi tải sản phẩm</p>'; return; }
  el.innerHTML = `<div class="table-wrap"><table class="admin-table">
    <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Eco</th><th>Kho</th><th>Thao tác</th></tr></thead>
    <tbody>${res.data.map(p => `
      <tr>
        <td>
          <strong>${p.name}</strong>
          ${p.badge ? `<span class="badge-new" style="font-size:0.68rem;margin-left:6px">${p.badge}</span>` : ''}
          <br><small style="color:var(--olive)">${p.ingredient}</small>
        </td>
        <td>${_catLabel(p.category)}</td>
        <td><strong style="color:var(--deep-green)">${Number(p.price).toLocaleString('vi-VN')}đ</strong><br><small>${p.unit}</small></td>
        <td><span class="eco-score">Eco ${p.eco_score}%</span></td>
        <td>${p.stock}</td>
        <td style="white-space:nowrap">
          <button class="action-btn edit"   onclick="openEditProductModal(${p.id})"><i class="fas fa-edit"></i> Sửa</button>
          <button class="action-btn delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

function _catLabel(c) {
  const m = { writing:'Giấy viết', packaging:'Đóng gói', art:'Nghệ thuật', office:'Văn phòng', card:'Thiệp', bookmark:'Bookmark', recycle:'Tái chế' };
  return m[c] || c;
}

function openAddProductModal() {
  _set('productModalTitle', 'Thêm sản phẩm mới');
  document.getElementById('editProductId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('addProductModal').classList.add('active');
}

async function openEditProductModal(id) {
  const res = await API.getProduct(id);
  if (!res.success) { showToast('Không tải được sản phẩm', 'error'); return; }
  const p = res.data;
  _set('productModalTitle', 'Chỉnh sửa sản phẩm');
  const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  sv('editProductId', p.id);
  sv('pName',        p.name);
  sv('pCategory',    p.category);
  sv('pPrice',       p.price);
  sv('pUnit',        p.unit);
  sv('pEco',         p.eco_score);
  sv('pStock',       p.stock);
  sv('pIngredient',  p.ingredient);
  sv('pBadge',       p.badge);
  sv('pDesc',        p.description);
  sv('pIcon',        p.icon);
  sv('pImgClass',    p.img_class);
  document.getElementById('addProductModal').classList.add('active');
}

async function saveProduct(e) {
  e.preventDefault();
  const id   = document.getElementById('editProductId').value;
  const gv   = (id) => document.getElementById(id)?.value || '';
  const data = {
    name: gv('pName'), category: gv('pCategory'),
    price: parseInt(gv('pPrice')), unit: gv('pUnit'),
    eco_score: parseInt(gv('pEco')), stock: parseInt(gv('pStock')),
    ingredient: gv('pIngredient'), badge: gv('pBadge'),
    description: gv('pDesc'), icon: gv('pIcon'), img_class: gv('pImgClass'),
  };
  if (!data.name || !data.category || !data.price) {
    showToast('Vui lòng nhập tên, danh mục và giá', 'error'); return;
  }
  showLoading(true);
  const res = id ? await API.updateProduct(id, data) : await API.createProduct(data);
  showLoading(false);
  if (res.success) {
    showToast(res.message || 'Lưu thành công', 'success');
    document.getElementById('addProductModal').classList.remove('active');
    renderAdminProducts();
    window.PRODUCTS_CACHE = [];
  } else {
    showToast(res.message || 'Lỗi lưu sản phẩm', 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Xóa sản phẩm này?')) return;
  const res = await API.deleteProduct(id);
  if (res.success) {
    showToast('Đã xóa sản phẩm', 'success');
    renderAdminProducts();
    window.PRODUCTS_CACHE = [];
  } else {
    showToast(res.message || 'Lỗi xóa', 'error');
  }
}

/* ════════════════════════════════════════════
   CUSTOMERS TABLE
════════════════════════════════════════════ */
async function renderCustomersTable() {
  const el = document.getElementById('customersTable');
  if (!el) return;
  const res = await API.getUsers();
  if (!res.success) return;
  if (!res.data.length) {
    el.innerHTML = '<p style="padding:20px;color:var(--olive);text-align:center">Chưa có khách hàng</p>';
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table class="admin-table">
    <thead><tr><th>Tên</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Ngày đăng ký</th></tr></thead>
    <tbody>${res.data.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || '—'}</td>
        <td><span class="role-badge ${u.role}">${u.role === 'admin' ? '🛡 Admin' : '👤 Khách hàng'}</span></td>
        <td>${formatDate(u.created_at)}</td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

/* ════════════════════════════════════════════
   MESSAGES TABLE
════════════════════════════════════════════ */
async function renderMessagesTable() {
  const el = document.getElementById('messagesTable');
  if (!el) return;
  const res = await API.getMessages();
  if (!res.success) return;
  if (!res.data.length) {
    el.innerHTML = '<p style="padding:24px;color:var(--olive);text-align:center">Chưa có tin nhắn nào</p>';
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table class="admin-table">
    <thead><tr><th>Người gửi</th><th>Email</th><th>Chủ đề</th><th>Ngày</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>${res.data.map(m => `
      <tr style="${!m.is_read ? 'font-weight:600;background:rgba(74,124,89,0.04)' : ''}">
        <td>${m.name}${m.organization ? `<br><small style="color:var(--olive)">${m.organization}</small>` : ''}</td>
        <td><a href="mailto:${m.email}" style="color:var(--deep-green)">${m.email}</a></td>
        <td style="max-width:200px;word-break:break-word">${m.subject || m.content.substring(0,50)+'...'}</td>
        <td>${formatDate(m.created_at)}</td>
        <td>${m.is_read
          ? '<span style="color:var(--olive);font-size:0.78rem">Đã đọc</span>'
          : '<span style="color:var(--deep-green);font-size:0.78rem;font-weight:700">● Mới</span>'}</td>
        <td style="white-space:nowrap">
          ${!m.is_read ? `<button class="action-btn view" onclick="markMessageRead(${m.id})"><i class="fas fa-check"></i></button>` : ''}
          <button class="action-btn view" onclick="viewMessage(${m.id})"><i class="fas fa-eye"></i></button>
        </td>
      </tr>`).join('')}
    </tbody></table></div>`;

  // Cache messages for viewMessage
  window._messagesCache = res.data;
}

async function markMessageRead(id) {
  await API.markMessageRead(id);
  renderMessagesTable();
  // Update badge
  const statsRes = await API.getStats();
  if (statsRes.success) {
    const badge = document.getElementById('unreadBadge');
    if (badge) {
      badge.textContent = statsRes.data.unread_messages;
      badge.classList.toggle('hidden', statsRes.data.unread_messages === 0);
    }
  }
}

function viewMessage(id) {
  const m = (window._messagesCache || []).find(x => x.id == id);
  if (!m) return;
  document.getElementById('orderDetailContent').innerHTML = `
    <h3 style="margin-bottom:20px"><i class="fas fa-envelope" style="color:var(--deep-green);margin-right:8px"></i>Tin nhắn từ ${m.name}</h3>
    <div style="display:grid;gap:12px;font-size:0.9rem;margin-bottom:20px">
      <div style="display:flex;gap:8px"><span style="color:var(--olive);min-width:80px">Email:</span><strong>${m.email}</strong></div>
      ${m.organization ? `<div style="display:flex;gap:8px"><span style="color:var(--olive);min-width:80px">Tổ chức:</span><span>${m.organization}</span></div>` : ''}
      ${m.subject ? `<div style="display:flex;gap:8px"><span style="color:var(--olive);min-width:80px">Chủ đề:</span><span>${m.subject}</span></div>` : ''}
      <div style="display:flex;gap:8px"><span style="color:var(--olive);min-width:80px">Ngày:</span><span>${formatDate(m.created_at)}</span></div>
    </div>
    <div style="background:var(--ivory);border-radius:12px;padding:18px;margin-bottom:20px">
      <p style="color:var(--olive);font-size:0.8rem;margin-bottom:8px">Nội dung:</p>
      <p style="line-height:1.75;color:var(--charcoal)">${m.content}</p>
    </div>
    <div style="display:flex;gap:10px">
      <a href="mailto:${m.email}" class="btn btn-primary"><i class="fas fa-reply"></i> Trả lời Email</a>
      <a href="tel:0981175522" class="btn btn-sage"><i class="fas fa-phone"></i> Gọi điện</a>
    </div>`;
  document.getElementById('orderDetailModal').classList.add('active');
  if (!m.is_read) markMessageRead(id);
}

/* ════════════════════════════════════════════
   PAYMENT SETTINGS — QR Upload
════════════════════════════════════════════ */
window._currentQrUrl = '';

async function loadPaymentSettings() {
  const res = await API.getPaymentInfo();
  if (res.success && res.data) {
    const d = res.data;
    _sv('payBankName',      d.bank_name);
    _sv('payAccountNumber', d.account_number);
    _sv('payAccountName',   d.account_name);
    _sv('payQrContent',     d.qr_content);
    _sv('payDescription',   d.description);
    // Set current QR URL
    if (d.qr_content) {
      window._currentQrUrl = d.qr_content;
      _showQrPreviewImg(d.qr_content);
    }
    _updatePreview();
  }
}

function _sv(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

async function savePaymentSettings(e) {
  e.preventDefault();
  const gv = (id) => document.getElementById(id)?.value?.trim() || '';

  // Lấy QR URL: ưu tiên file đã upload, rồi URL tab
  const qrContent = window._currentQrUrl || gv('payQrContent');

  const data = {
    bank_name:      gv('payBankName'),
    account_number: gv('payAccountNumber'),
    account_name:   gv('payAccountName'),
    qr_content:     qrContent,
    description:    gv('payDescription'),
  };

  if (!data.bank_name || !data.account_number || !data.account_name) {
    showToast('Vui lòng nhập ngân hàng, số tài khoản và tên chủ TK', 'error');
    return;
  }

  showLoading(true);
  const res = await API.updatePaymentInfo(data);
  showLoading(false);

  if (res.success) {
    showToast('✅ Đã lưu cài đặt thanh toán QR', 'success');
    _updatePreview();
  } else {
    showToast(res.message || 'Lỗi lưu cài đặt', 'error');
  }
}

/* ── Tab switching ── */
function switchQrTab(tab, btn) {
  document.querySelectorAll('.qr-input-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.qr-tab-panel').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  if (btn) btn.classList.add('active');
  const panel = document.getElementById('qrTab-' + tab);
  if (panel) { panel.classList.remove('hidden'); panel.classList.add('active'); }
}

/* ── Drag & Drop ── */
function handleDragOver(e) {
  e.preventDefault(); e.stopPropagation();
  document.getElementById('qrUploadZone')?.classList.add('drag-over');
}
function handleDragLeave(e) {
  document.getElementById('qrUploadZone')?.classList.remove('drag-over');
}
function handleFileDrop(e) {
  e.preventDefault(); e.stopPropagation();
  document.getElementById('qrUploadZone')?.classList.remove('drag-over');
  const file = e.dataTransfer?.files?.[0];
  if (file) _processQrFile(file);
}
function handleQrFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) _processQrFile(file);
}

async function _processQrFile(file) {
  const allowed = ['image/png','image/jpeg','image/jpg','image/webp','image/gif'];
  if (!allowed.includes(file.type)) { showToast('Chỉ chấp nhận PNG, JPG, WEBP, GIF', 'error'); return; }
  if (file.size > 2 * 1024 * 1024) { showToast('File quá lớn. Tối đa 2MB', 'error'); return; }

  // Local preview ngay lập tức
  const reader = new FileReader();
  reader.onload = (ev) => _showQrPreviewImg(ev.target.result);
  reader.readAsDataURL(file);

  _setUploadStatus('uploading', '<i class="fas fa-spinner fa-spin"></i> Đang upload ảnh...');

  const fd = new FormData();
  fd.append('qr_image', file);
  const res = await API.uploadQrImage(fd);

  if (res.success) {
    window._currentQrUrl = res.url;
    _showQrPreviewImg(res.url);
    _setUploadStatus('success', `<i class="fas fa-check-circle"></i> Upload thành công — ${res.filename}`);
    _updatePreview();
    showToast('Upload ảnh QR thành công!', 'success');
  } else {
    _setUploadStatus('error', `<i class="fas fa-times-circle"></i> ${res.message || 'Upload thất bại'}`);
    showToast(res.message || 'Upload thất bại', 'error');
  }
}

function _showQrPreviewImg(src) {
  const zone = document.getElementById('qrUploadZone');
  const ph   = document.getElementById('qrUploadPlaceholder');
  const img  = document.getElementById('qrUploadPreview');
  if (!img) return;
  if (ph) ph.classList.add('hidden');
  img.src = src;
  img.classList.remove('hidden');
  img.onerror = () => {
    img.classList.add('hidden');
    if (ph) ph.classList.remove('hidden');
  };
}

function _setUploadStatus(type, html) {
  const el = document.getElementById('qrUploadStatus');
  if (!el) return;
  el.className = 'qr-upload-status ' + type;
  el.innerHTML = html;
  el.classList.remove('hidden');
}

/* ── URL tab ── */
function previewQrUrl() {
  const url = document.getElementById('payQrContent')?.value?.trim();
  if (!url) { showToast('Vui lòng nhập URL ảnh QR', 'error'); return; }
  window._currentQrUrl = url;
  _updatePreview();
  showToast('Đã cập nhật xem trước', 'success');
}
function previewQR() { previewQrUrl(); } // backward compat

/* ── VietQR generator ── */
function generateVietQR() {
  const bank   = (document.getElementById('payBankName')?.value || '').trim().toUpperCase().replace(/\s+/g,'');
  const accNum = (document.getElementById('payAccountNumber')?.value || '').trim();
  const name   = (document.getElementById('payAccountName')?.value || '').trim();

  if (!bank || !accNum) {
    showToast('Vui lòng nhập ngân hàng và số tài khoản trước', 'error'); return;
  }

  const bankMap = {
    VIETCOMBANK:'VCB', VCB:'VCB', VIETINBANK:'ICB', ICB:'ICB',
    BIDV:'BIDV', AGRIBANK:'AGRIBANK', TECHCOMBANK:'TCB', TCB:'TCB',
    MB:'MB', MBBANK:'MB', MBB:'MB', ACB:'ACB', VPBANK:'VPB', VPB:'VPB',
    TPBANK:'TPB', TPB:'TPB', SACOMBANK:'STB', STB:'STB', HDBANK:'HDB',
    OCB:'OCB', SHB:'SHB', SEABANK:'SEAB', SEAB:'SEAB', MOMO:'MOMO',
  };

  const code = bankMap[bank] || bank;
  const nm   = encodeURIComponent(name || 'CONG TY EPEI');
  const url  = `https://img.vietqr.io/image/${code}-${accNum}-compact2.png?amount=0&addInfo=EPei&accountName=${nm}`;

  window._currentQrUrl = url;

  const resultEl = document.getElementById('vietqrResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `
      <p style="font-size:0.84rem;color:var(--olive);margin-bottom:10px">
        <i class="fas fa-check-circle" style="color:var(--deep-green)"></i>
        Link VietQR (${code}):
      </p>
      <code style="font-size:0.75rem;word-break:break-all;background:var(--ivory);
                   padding:8px 10px;border-radius:8px;display:block;margin-bottom:12px;
                   border:1px solid rgba(163,177,138,0.3)">${url}</code>
      <img src="${url}" alt="VietQR" style="max-width:180px;border-radius:10px;margin:0 auto;display:block;box-shadow:var(--shadow)"
           onerror="this.insertAdjacentHTML('afterend','<p style=color:#c0392b;font-size:0.82rem;margin-top:8px>⚠ Không load được — kiểm tra lại mã ngân hàng: ${code}</p>');this.remove()" />`;
  }
  _updatePreview();
  showToast(`VietQR tạo thành công cho ${code}!`, 'success');
}

/* ── Live preview ── */
function _updatePreview() {
  const gv = (id) => document.getElementById(id)?.value?.trim() || '';

  _set('ppBankName', gv('payBankName')      || '—');
  _set('ppAccNum',   gv('payAccountNumber') || '—');
  _set('ppAccName',  gv('payAccountName')   || '—');
  _set('ppDesc',     gv('payDescription')   || 'Nội dung: [Mã đơn hàng] - [Tên]');

  const qrUrl   = window._currentQrUrl || gv('payQrContent');
  const ppImg   = document.getElementById('ppQrImg');
  const ppEmpty = document.getElementById('ppQrEmpty');

  if (qrUrl && ppImg) {
    ppImg.src = qrUrl;
    ppImg.classList.remove('hidden');
    if (ppEmpty) ppEmpty.classList.add('hidden');
    ppImg.onerror = () => {
      ppImg.classList.add('hidden');
      if (ppEmpty) ppEmpty.classList.remove('hidden');
    };
  } else {
    if (ppImg)   ppImg.classList.add('hidden');
    if (ppEmpty) ppEmpty.classList.remove('hidden');
  }
}

function _bindPreviewListeners() {
  ['payBankName','payAccountNumber','payAccountName','payDescription','payQrContent'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el._previewBound) {
      el.addEventListener('input', _updatePreview);
      el._previewBound = true;
    }
  });
}

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function statusLabel(s) {
  return { pending:'Chờ xử lý', confirmed:'Đã xác nhận', shipping:'Đang giao', done:'Hoàn thành', cancelled:'Đã hủy' }[s] || s;
}
