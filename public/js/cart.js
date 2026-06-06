/* EPei - cart.js */
'use strict';
let cart = JSON.parse(localStorage.getItem('epei_cart') || '[]');

function saveCart() { localStorage.setItem('epei_cart', JSON.stringify(cart)); }

function addToCart(productId) {
  const p = window.PRODUCTS_CACHE?.find(x => x.id == productId);
  if (!p) { showToast('Không tìm thấy sản phẩm', 'error'); return; }
  const ex = cart.find(x => x.id == productId);
  if (ex) ex.qty++;
  else cart.push({ id: p.id, name: p.name, price: p.price, unit: p.unit, img_class: p.img_class, icon: p.icon, qty: 1 });
  saveCart(); updateCartCount();
  showToast(`Đã thêm "${p.name}" vào giỏ hàng`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(x => x.id != productId);
  saveCart(); updateCartCount(); renderFullCart(); renderCartSummary();
}

function updateCartQty(productId, delta) {
  const item = cart.find(x => x.id == productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(); updateCartCount(); renderFullCart(); renderCartSummary();
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cart.reduce((s, x) => s + x.qty, 0);
}

function getCartTotal() { return cart.reduce((s, x) => s + x.price * x.qty, 0); }

function renderFullCart() {
  const el = document.getElementById('fullCartItems');
  if (!el) return;
  if (!cart.length) {
    el.innerHTML = `<div style="text-align:center;padding:60px;color:var(--olive)">
      <i class="fas fa-shopping-cart" style="font-size:3rem;opacity:0.25;display:block;margin-bottom:16px"></i>
      <p style="margin-bottom:16px">Giỏ hàng trống</p>
      <button class="btn btn-primary" onclick="showPage('products')">Mua sắm ngay</button>
    </div>`;
    const sr = document.getElementById('cartSummaryRows'); if (sr) sr.innerHTML='';
    const te = document.getElementById('cartPageTotal'); if (te) te.textContent='0đ';
    return;
  }
  el.innerHTML = cart.map(i => `
    <div class="cart-item-row">
      <div class="cart-item-img ${i.img_class}"><i class="${i.icon}" style="color:rgba(255,255,255,0.65)"></i></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">${Number(i.price).toLocaleString('vi-VN')}đ / ${i.unit}</div>
        <div class="cart-item-qty">
          <button onclick="updateCartQty(${i.id},-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="updateCartQty(${i.id},1)">+</button>
          <span style="color:var(--deep-green);font-weight:700;margin-left:8px">${(i.price*i.qty).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${i.id})"><i class="fas fa-trash"></i></button>
    </div>`).join('');
  const sr = document.getElementById('cartSummaryRows');
  if (sr) sr.innerHTML = cart.map(i=>`<div class="total-row"><span>${i.name} x${i.qty}</span><span>${(i.price*i.qty).toLocaleString('vi-VN')}đ</span></div>`).join('');
  const te = document.getElementById('cartPageTotal');
  if (te) te.textContent = getCartTotal().toLocaleString('vi-VN') + 'đ';
}

function renderCartSummary() {
  const el = document.getElementById('cartItems');
  if (!el) return;
  if (!cart.length) {
    el.innerHTML = '<p class="empty-cart-msg">Chưa có sản phẩm nào</p>';
    const cd = document.getElementById('cartTotal'); if (cd) cd.style.display='none';
    return;
  }
  el.innerHTML = cart.map(i=>`<div class="total-row"><span>${i.name} x${i.qty}</span><span>${(i.price*i.qty).toLocaleString('vi-VN')}đ</span></div>`).join('');
  const total = getCartTotal();
  const se = document.getElementById('subtotalAmt'); if (se) se.textContent = total.toLocaleString('vi-VN')+'đ';
  const te = document.getElementById('totalAmt');    if (te) te.textContent = total.toLocaleString('vi-VN')+'đ';
  const cd = document.getElementById('cartTotal');   if (cd) cd.style.display='block';
}
