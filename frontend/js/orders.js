/* ============================================
   EPei - orders.js  v2.0
   ============================================ */
'use strict';

/* ── Submit order ────────────────────────────────────────────────────────── */
async function submitOrder(e) {
  e.preventDefault();

  if (cart.length === 0) {
    showToast('Vui lòng chọn ít nhất một sản phẩm', 'error');
    return;
  }

  const name    = document.getElementById('orderName').value.trim();
  const phone   = document.getElementById('orderPhone').value.trim();
  const address = document.getElementById('orderAddress').value.trim();

  if (!name || !phone || !address) {
    showToast('Vui lòng điền đầy đủ thông tin giao hàng', 'error');
    return;
  }

  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cod';

  const orderData = {
    customer_name:    name,
    customer_phone:   phone,
    customer_email:   document.getElementById('orderEmail').value.trim(),
    customer_address: address,
    note:             document.getElementById('orderNote').value.trim(),
    payment_method:   paymentMethod,
    items: cart.map(i => ({ id: i.id, qty: i.qty })),
  };

  showLoading(true);
  const res = await API.createOrder(orderData);
  showLoading(false);

  if (res.success) {
    // Build success info
    const payLabel = paymentMethod === 'transfer'
      ? '<span style="color:#2980b9"><i class="fas fa-qrcode"></i> Chuyển khoản</span>'
      : '<span style="color:var(--deep-green)"><i class="fas fa-money-bill-wave"></i> COD</span>';

    document.getElementById('orderSuccessInfo').innerHTML = `
      <div style="background:var(--ivory);border-radius:14px;padding:18px;margin-top:16px;text-align:left;border:1px solid rgba(163,177,138,0.25)">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(163,177,138,0.2)">
          <span style="color:var(--olive);font-size:0.88rem">Mã đơn hàng</span>
          <strong style="color:var(--deep-green);font-family:var(--font-heading)">${res.order_id}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <span style="color:var(--olive);font-size:0.88rem">Tổng tiền</span>
          <strong style="color:var(--deep-green);font-size:1.1rem">${Number(res.total).toLocaleString('vi-VN')}đ</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--olive);font-size:0.88rem">Thanh toán</span>
          <span style="font-size:0.88rem">${payLabel}</span>
        </div>
        ${paymentMethod === 'transfer' ? `
        <div style="margin-top:12px;padding:10px;background:rgba(41,128,185,0.08);border-radius:8px;font-size:0.82rem;color:var(--olive)">
          <i class="fas fa-info-circle" style="color:#2980b9"></i>
          Vui lòng chuyển khoản và ghi nội dung: <strong>${res.order_id}</strong>
        </div>` : ''}
      </div>`;

    document.getElementById('orderSuccessModal').classList.add('active');

    // Clear cart & form
    cart = [];
    saveCart();
    updateCartCount();
    document.getElementById('orderForm').reset();
    document.getElementById('qrPaymentInfo').classList.add('hidden');
    renderOrderProducts();
    renderCartSummary();
  } else {
    showToast(res.message || 'Lỗi đặt hàng. Vui lòng thử lại.', 'error');
  }
}

/* ── My orders ───────────────────────────────────────────────────────────── */
async function renderMyOrders() {
  const el = document.getElementById('myOrdersList');
  if (!el || !currentUser) return;
  el.innerHTML = '<div class="loading-products"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

  const res = await API.getMyOrders();
  if (!res.success || !res.data.length) {
    el.innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:var(--olive)">
        <i class="fas fa-shopping-bag" style="font-size:3rem;opacity:0.2;display:block;margin-bottom:16px"></i>
        <p style="font-size:1rem;margin-bottom:20px">Bạn chưa có đơn hàng nào</p>
        <button class="btn btn-primary" onclick="showPage('products')">
          <i class="fas fa-shopping-bag"></i> Mua sắm ngay
        </button>
      </div>`;
    return;
  }

  el.innerHTML = res.data.map(o => `
    <div class="my-order-card">
      <div class="my-order-header">
        <span class="my-order-id"><i class="fas fa-receipt" style="margin-right:4px;opacity:0.6"></i>${o.id}</span>
        <span class="status-badge status-${o.order_status}">${statusLabel(o.order_status)}</span>
      </div>
      <div class="my-order-items">
        <i class="fas fa-box" style="color:var(--sage);margin-right:4px"></i>
        ${o.item_count} sản phẩm
        ${o.payment_method === 'transfer'
          ? '<span style="margin-left:8px;font-size:0.75rem;color:#2980b9"><i class="fas fa-qrcode"></i> Chuyển khoản</span>'
          : '<span style="margin-left:8px;font-size:0.75rem;color:var(--olive)"><i class="fas fa-money-bill-wave"></i> COD</span>'}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.85rem">
        <span style="color:var(--olive)"><i class="fas fa-calendar" style="margin-right:4px"></i>${formatDate(o.created_at)}</span>
        <span class="my-order-total">${Number(o.total).toLocaleString('vi-VN')}đ</span>
      </div>
    </div>`).join('');
}

/* ── Status helpers ──────────────────────────────────────────────────────── */
function statusLabel(s) {
  const map = {
    pending:   'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipping:  'Đang giao',
    done:      'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  return map[s] || s;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

/* ── Payment method toggle ───────────────────────────────────────────────── */
document.addEventListener('change', e => {
  if (e.target.name === 'payment') {
    const qrBox = document.getElementById('qrPaymentInfo');
    if (!qrBox) return;
    if (e.target.value === 'transfer') {
      qrBox.classList.remove('hidden');
      loadPaymentInfo();
    } else {
      qrBox.classList.add('hidden');
    }
  }
});

/* ── Load payment QR info ────────────────────────────────────────────────── */
async function loadPaymentInfo() {
  const el = document.getElementById('qrInfoContent');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:12px"><i class="fas fa-spinner fa-spin" style="color:var(--sage)"></i></div>';

  const res = await API.getPaymentInfo();
  if (res.success && res.data) {
    const d = res.data;
    el.innerHTML = `
      <p style="font-weight:600;color:var(--charcoal);margin-bottom:14px;display:flex;align-items:center;gap:8px">
        <i class="fas fa-university" style="color:var(--deep-green)"></i> Thông tin chuyển khoản
      </p>
      <div style="display:grid;gap:8px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:0.88rem;padding:8px 0;border-bottom:1px solid rgba(163,177,138,0.15)">
          <span style="color:var(--olive)">Ngân hàng</span>
          <strong>${d.bank_name}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.88rem;padding:8px 0;border-bottom:1px solid rgba(163,177,138,0.15)">
          <span style="color:var(--olive)">Số tài khoản</span>
          <strong style="color:var(--deep-green);font-size:1rem">${d.account_number}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.88rem;padding:8px 0">
          <span style="color:var(--olive)">Chủ tài khoản</span>
          <strong>${d.account_name}</strong>
        </div>
      </div>
      ${d.qr_content ? `
        <div style="text-align:center;margin:12px 0">
          <img src="${d.qr_content}" alt="QR Code thanh toán" class="qr-img"
               onerror="this.parentElement.innerHTML='<p style=color:var(--olive);font-size:0.82rem>Không tải được ảnh QR</p>'" />
          <p style="font-size:0.75rem;color:var(--olive);margin-top:6px">Quét mã QR để thanh toán</p>
        </div>` : ''}
      ${d.description ? `
        <div style="background:rgba(41,128,185,0.08);border-radius:8px;padding:10px 12px;font-size:0.82rem;color:var(--olive)">
          <i class="fas fa-info-circle" style="color:#2980b9;margin-right:6px"></i>${d.description}
        </div>` : ''}`;
  } else {
    el.innerHTML = `
      <div style="text-align:center;padding:16px;color:var(--olive)">
        <i class="fas fa-phone" style="font-size:1.5rem;color:var(--sage);display:block;margin-bottom:8px"></i>
        <p style="font-size:0.88rem">Chưa có thông tin thanh toán QR.</p>
        <p style="font-size:0.88rem;margin-top:4px">Vui lòng liên hệ: <strong>0981 175 522</strong></p>
      </div>`;
  }
}
