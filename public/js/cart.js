/* ============================================
   EPei - cart.js - Cart Management
   ============================================ */
'use strict';

let cart = JSON.parse(localStorage.getItem('epei_cart') || '[]');

function saveCart() {
  localStorage.setItem('epei_cart', JSON.stringify(cart));
}

function addToCart(productId) {
  const p = window.PRODUCTS_CACHE ? window.PRODUCTS_CACHE.find(x => x.id == productId) : null;
  if (!p) { showToast('Không tìm thấy sản phẩm', 'error'); return; }
  const existing = cart.find(x => x.id == productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: p.id, name: p.name, price: p.price, unit: p.unit,
      img_class: p.img_class, icon: p.icon, qty: 1
    });
  }
  saveCart();
  updateCartCount();
  showToast(`Đã thêm "${p.name}" vào giỏ hàng`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(x => x.id != productId);
  saveCart();
  updateCartCount();
  renderFullCart();
  renderCartSummary();
}

function updateCartQty(productId, delta) {
  const item = cart.find(x => x.id == productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  updateCartCount();
  renderFullCart();
  renderCartSummary();
}

function updateCartCount() {
  const total = cart.reduce((s, x) => s + x.qty, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = total;
}

function getCartTotal() {
  return cart.reduce((s, x) => s + x.price * x.qty, 0);
}

function renderFullCart() {
  const el = document.getElementById('fullCartItems');
  const summaryRows = document.getElementById('cartSummaryRows');
  const totalEl = document.getElementById('cartPageTotal');
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = `<div style="text-align:center;padding:60px 0;color:var(--olive)">
      <i class="fas fa-shopping-cart" style="font-size:3rem;opacity:0.25;display:block;margin-bottom:16px"></i>
      <p style="font-size:1.1rem;margin-bottom:20px">Giỏ hàng của bạn đang trống</p>
      <button class="btn btn-primary" onclick="showPage('products')"><i class="fas fa-shopping-bag"></i> Mua sắm ngay</button>
    </div>`;
    if (summaryRows) summaryRows.innerHTML = '';
    if (totalEl) totalEl.textContent = '0đ';
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <div class="cart-item-img ${item.img_class}"><i class="${item.icon}" style="color:rgba(255,255,255,0.65)"></i></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${Number(item.price).toLocaleString('vi-VN')}đ / ${item.unit}</div>
        <div class="cart-item-qty">
          <button onclick="updateCartQty(${item.id},-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCartQty(${item.id},1)">+</button>
          <span style="color:var(--deep-green);font-weight:700;margin-left:8px">${(item.price*item.qty).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Xóa"><i class="fas fa-trash"></i></button>
    </div>`).join('');
  if (summaryRows) summaryRows.innerHTML = cart.map(i => `
    <div class="total-row"><span>${i.name} x${i.qty}</span><span>${(i.price*i.qty).toLocaleString('vi-VN')}đ</span></div>`).join('');
  if (totalEl) totalEl.textContent = getCartTotal().toLocaleString('vi-VN') + 'đ';
}

function renderCartSummary() {
  const el = document.getElementById('cartItems');
  const totalEl = document.getElementById('totalAmt');
  const subtotalEl = document.getElementById('subtotalAmt');
  const cartTotalDiv = document.getElementById('cartTotal');
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = '<p class="empty-cart-msg">Chưa có sản phẩm nào</p>';
    if (cartTotalDiv) cartTotalDiv.style.display = 'none';
    return;
  }
  el.innerHTML = cart.map(i => `
    <div class="total-row"><span>${i.name} x${i.qty}</span><span>${(i.price*i.qty).toLocaleString('vi-VN')}đ</span></div>`).join('');
  const total = getCartTotal();
  if (subtotalEl) subtotalEl.textContent = total.toLocaleString('vi-VN') + 'đ';
  if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + 'đ';
  if (cartTotalDiv) cartTotalDiv.style.display = 'block';
}
