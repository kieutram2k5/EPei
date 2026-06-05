/* ============================================
   EPei - products.js  v2.1 — Stable
   ============================================ */
'use strict';

window.PRODUCTS_CACHE = [];

const CAT_LABELS = {
  writing:   'Giấy viết',
  packaging: 'Đóng gói',
  art:       'Nghệ thuật',
  office:    'Văn phòng',
  card:      'Thiệp',
  bookmark:  'Bookmark',
  recycle:   'Tái chế',
};

/* ── Fallback products (hiển thị khi API chưa sẵn sàng) ─────────────────── */
const FALLBACK_PRODUCTS = [
  {id:1,name:'Giấy viết sinh thái A4',category:'writing',price:45000,unit:'ream (500 tờ)',eco_score:95,ingredient:'Bã mía 70% + Lá cây 30%',icon:'fas fa-file-alt',img_class:'img-1',badge:'Bán chạy',description:'Giấy viết cao cấp từ bã mía và lá cây, độ trắng tự nhiên 92%.',stock:200},
  {id:2,name:'Giấy đóng gói Kraft sinh thái',category:'packaging',price:38000,unit:'kg',eco_score:98,ingredient:'Bã mía 100%',icon:'fas fa-box',img_class:'img-2',badge:'Mới',description:'Giấy kraft bền vững từ 100% bã mía, độ bền kéo cao.',stock:150},
  {id:3,name:'Giấy nghệ thuật sinh thái',category:'art',price:65000,unit:'tập 50 tờ',eco_score:97,ingredient:'Lá cây 60% + Bã mía 40%',icon:'fas fa-paint-brush',img_class:'img-3',badge:'Cao cấp',description:'Giấy nghệ thuật texture tự nhiên, bề mặt mịn đặc biệt.',stock:80},
  {id:4,name:'Sổ tay văn phòng xanh',category:'office',price:55000,unit:'cuốn',eco_score:96,ingredient:'Bã mía 80% + Lá cây 20%',icon:'fas fa-book',img_class:'img-4',badge:'',description:'Sổ tay bìa cứng tái chế, ruột giấy sinh thái 80 trang.',stock:120},
  {id:5,name:'Giấy in sinh thái A4',category:'writing',price:52000,unit:'ream (500 tờ)',eco_score:94,ingredient:'Bã mía 65% + Lá cây 35%',icon:'fas fa-print',img_class:'img-5',badge:'',description:'Giấy in chất lượng cao, tương thích mọi loại máy in.',stock:180},
  {id:6,name:'Túi giấy đóng gói cao cấp',category:'packaging',price:8000,unit:'chiếc',eco_score:99,ingredient:'Bã mía 100%',icon:'fas fa-shopping-bag',img_class:'img-6',badge:'Eco 99%',description:'Túi giấy kraft cao cấp, quai xách chắc chắn.',stock:500},
  {id:7,name:'Giấy tái chế đa năng',category:'recycle',price:28000,unit:'kg',eco_score:100,ingredient:'Giấy tái chế 100%',icon:'fas fa-recycle',img_class:'img-7',badge:'100% Tái chế',description:'Giấy từ 100% nguyên liệu tái chế.',stock:300},
  {id:8,name:'Bộ văn phòng phẩm xanh',category:'office',price:185000,unit:'bộ',eco_score:96,ingredient:'Bã mía + Lá cây + Tái chế',icon:'fas fa-pencil-ruler',img_class:'img-8',badge:'Combo',description:'Bộ văn phòng phẩm hoàn chỉnh: sổ tay, bút chì tái chế.',stock:60},
  {id:9,name:'Thiệp sinh nhật sinh thái',category:'card',price:25000,unit:'chiếc',eco_score:97,ingredient:'Bã mía 80% + Hoa khô tự nhiên',icon:'fas fa-birthday-cake',img_class:'img-card-1',badge:'Hot',description:'Thiệp sinh nhật handcraft từ giấy bã mía, ép hoa khô tự nhiên.',stock:200},
  {id:10,name:'Thiệp cưới cao cấp EPei',category:'card',price:45000,unit:'chiếc',eco_score:96,ingredient:'Bã mía 70% + Lá cây 30%',icon:'fas fa-heart',img_class:'img-card-2',badge:'Sang trọng',description:'Thiệp cưới cao cấp từ giấy sinh thái, thiết kế tối giản.',stock:150},
  {id:11,name:'Thiệp cảm ơn doanh nghiệp',category:'card',price:15000,unit:'chiếc',eco_score:98,ingredient:'Bã mía 90% + Lá cây 10%',icon:'fas fa-envelope-open-text',img_class:'img-card-3',badge:'',description:'Thiệp cảm ơn chuyên nghiệp cho doanh nghiệp.',stock:300},
  {id:12,name:'Bộ thiệp 4 mùa EPei',category:'card',price:85000,unit:'bộ 8 chiếc',eco_score:97,ingredient:'Bã mía + Hoa lá tự nhiên',icon:'fas fa-leaf',img_class:'img-card-4',badge:'Bộ sưu tập',description:'Bộ 8 thiệp theo 4 mùa xuân-hạ-thu-đông.',stock:80},
  {id:13,name:'Bookmark lá cây ép khô',category:'bookmark',price:12000,unit:'chiếc',eco_score:99,ingredient:'Lá cây tự nhiên 100%',icon:'fas fa-bookmark',img_class:'img-bm-1',badge:'Độc đáo',description:'Bookmark từ lá cây thật được ép khô và phủ bảo vệ sinh thái.',stock:400},
  {id:14,name:'Bookmark giấy bã mía in họa tiết',category:'bookmark',price:8000,unit:'chiếc',eco_score:96,ingredient:'Bã mía 100%',icon:'fas fa-bookmark',img_class:'img-bm-2',badge:'',description:'Bookmark giấy bã mía dày dặn, in họa tiết thiên nhiên.',stock:500},
  {id:15,name:'Bộ bookmark nghệ thuật 5 chiếc',category:'bookmark',price:35000,unit:'bộ',eco_score:97,ingredient:'Bã mía + Lá cây + Hoa khô',icon:'fas fa-bookmark',img_class:'img-bm-3',badge:'Bộ sưu tập',description:'Bộ 5 bookmark nghệ thuật với 5 thiết kế khác nhau.',stock:200},
  {id:16,name:'Bookmark từ tính sinh thái',category:'bookmark',price:18000,unit:'chiếc',eco_score:95,ingredient:'Bã mía 85% + Lá cây 15%',icon:'fas fa-magnet',img_class:'img-bm-4',badge:'Thực dụng',description:'Bookmark từ tính tiện lợi, không cần kẹp vào trang sách.',stock:250},
];

/* ── Load products from API, fallback to hardcode ────────────────────────── */
async function loadProducts(category) {
  try {
    const cat = (category && category !== 'all') ? category : '';
    const res = await API.getProducts(cat);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      window.PRODUCTS_CACHE = res.data;
      return res.data;
    }
    // Fallback to hardcode if API fails or returns empty
    console.warn('API returned no products, using fallback data');
    const filtered = cat ? FALLBACK_PRODUCTS.filter(p => p.category === cat) : FALLBACK_PRODUCTS;
    window.PRODUCTS_CACHE = FALLBACK_PRODUCTS;
    return filtered;
  } catch (err) {
    console.error('loadProducts error:', err);
    const cat2 = (category && category !== 'all') ? category : '';
    const filtered = cat2 ? FALLBACK_PRODUCTS.filter(p => p.category === cat2) : FALLBACK_PRODUCTS;
    window.PRODUCTS_CACHE = FALLBACK_PRODUCTS;
    return filtered;
  }
}

/* ── Build product card HTML ─────────────────────────────────────────────── */
function productCardHTML(p) {
  const price    = Number(p.price) || 0;
  const eco      = Number(p.eco_score) || 95;
  const catLabel = CAT_LABELS[p.category] || p.category || '';
  const imgClass = p.img_class || 'img-1';
  const icon     = p.icon || 'fas fa-leaf';
  const name     = p.name || '';
  const unit     = p.unit || '';
  const badge    = p.badge || '';
  const ing      = p.ingredient || '';
  const id       = p.id;

  return `<div class="product-card" data-category="${p.category || ''}">
    <div class="product-image ${imgClass}">
      <i class="${icon}"></i>
      <div class="product-badges">
        <span class="eco-score"><i class="fas fa-leaf"></i> Eco ${eco}%</span>
        ${badge ? `<span class="badge-new">${badge}</span>` : ''}
      </div>
    </div>
    <div class="product-body">
      <span class="product-cat-badge">${catLabel}</span>
      <div class="product-name">${name}</div>
      <div class="product-ingredient"><i class="fas fa-leaf" style="color:var(--sage)"></i> ${ing}</div>
      <div class="product-footer">
        <span class="product-price">${price.toLocaleString('vi-VN')}đ<small style="font-weight:400;color:var(--olive)"> / ${unit}</small></span>
        <span class="product-bio"><i class="fas fa-recycle"></i> Eco</span>
      </div>
      <div class="product-actions">
        <button class="btn btn-cart" onclick="addToCart(${id})">
          <i class="fas fa-cart-plus"></i> Thêm vào giỏ
        </button>
        <button class="btn btn-detail" onclick="openProductModal(${id})">
          <i class="fas fa-eye"></i>
        </button>
      </div>
    </div>
  </div>`;
}

/* ── Render home preview (4 sản phẩm) ───────────────────────────────────── */
async function renderHomeProducts() {
  const grid = document.getElementById('homeProductGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-products"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

  const products = await loadProducts('');
  if (!products.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--olive);padding:40px;grid-column:1/-1">Chưa có sản phẩm. Hãy chạy install.php trước.</p>';
    return;
  }

  grid.innerHTML = products.slice(0, 4).map(p => productCardHTML(p)).join('');
  setTimeout(initFadeIn, 100);
}

/* ── Render products page ────────────────────────────────────────────────── */
async function renderProducts(filter) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading-products"><i class="fas fa-spinner fa-spin"></i> Đang tải sản phẩm...</div>';

  const products = await loadProducts(filter);
  if (!products.length) {
    grid.innerHTML = '<p style="text-align:center;color:var(--olive);padding:60px;grid-column:1/-1">Không có sản phẩm nào.</p>';
    return;
  }

  grid.innerHTML = products.map(p => productCardHTML(p)).join('');
  setTimeout(initFadeIn, 100);
}

/* ── Render order product picker ─────────────────────────────────────────── */
async function renderOrderProducts() {
  const grid = document.getElementById('orderProductGrid');
  if (!grid) return;

  const products = await loadProducts('');
  if (!products.length) {
    grid.innerHTML = '<p style="color:var(--olive);text-align:center;padding:20px">Không có sản phẩm</p>';
    return;
  }

  grid.innerHTML = products.map(p => {
    const cartItem = cart.find(x => x.id == p.id);
    const qty      = cartItem ? cartItem.qty : 0;
    const price    = Number(p.price) || 0;
    return `<div class="order-product-card ${qty > 0 ? 'selected' : ''}" id="opc-${p.id}">
      <div class="opc-img ${p.img_class || 'img-1'}">
        <i class="${p.icon || 'fas fa-leaf'}" style="color:rgba(255,255,255,0.7)"></i>
      </div>
      <div class="opc-name">${p.name}</div>
      <div class="opc-price">${price.toLocaleString('vi-VN')}đ/${p.unit}</div>
      <div class="opc-qty">
        <button onclick="orderQtyChange(${p.id},-1)">−</button>
        <span id="opc-qty-${p.id}">${qty}</span>
        <button onclick="orderQtyChange(${p.id},1)">+</button>
      </div>
    </div>`;
  }).join('');
}

/* ── Order qty change ────────────────────────────────────────────────────── */
function orderQtyChange(productId, delta) {
  const p = window.PRODUCTS_CACHE.find(x => x.id == productId);
  if (!p) return;

  const existing = cart.find(x => x.id == productId);
  if (existing) {
    existing.qty = Math.max(0, existing.qty + delta);
    if (existing.qty === 0) cart = cart.filter(x => x.id != productId);
  } else if (delta > 0) {
    cart.push({
      id: p.id, name: p.name, price: Number(p.price),
      unit: p.unit, img_class: p.img_class, icon: p.icon, qty: 1
    });
  }

  saveCart();
  updateCartCount();

  const qtyEl = document.getElementById('opc-qty-' + productId);
  const card  = document.getElementById('opc-' + productId);
  const item  = cart.find(x => x.id == productId);
  if (qtyEl) qtyEl.textContent = item ? item.qty : 0;
  if (card)  card.classList.toggle('selected', !!(item && item.qty > 0));
  renderCartSummary();
}

/* ── Product detail modal ────────────────────────────────────────────────── */
function openProductModal(productId) {
  const p = window.PRODUCTS_CACHE.find(x => x.id == productId);
  if (!p) { showToast('Không tìm thấy sản phẩm', 'error'); return; }

  const price    = Number(p.price) || 0;
  const eco      = Number(p.eco_score) || 95;
  const catLabel = CAT_LABELS[p.category] || p.category || '';

  document.getElementById('modalContent').innerHTML = `
    <div class="product-image ${p.img_class || 'img-1'}"
         style="height:220px;border-radius:16px;margin-bottom:22px;
                display:flex;align-items:center;justify-content:center">
      <i class="${p.icon || 'fas fa-leaf'}"
         style="font-size:4rem;color:rgba(255,255,255,0.7)"></i>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <span class="hero-badge" style="font-size:0.78rem;padding:5px 14px">
        <i class="fas fa-tag"></i> ${catLabel}
      </span>
      <span class="eco-score" style="font-size:0.78rem;padding:5px 14px">
        <i class="fas fa-leaf"></i> Eco ${eco}%
      </span>
      ${p.badge ? `<span class="badge-new" style="font-size:0.78rem;padding:5px 14px">${p.badge}</span>` : ''}
    </div>
    <h2 style="margin-bottom:10px">${p.name}</h2>
    <p style="color:var(--olive);margin-bottom:18px;line-height:1.75;font-size:0.95rem">
      ${p.description || 'Sản phẩm giấy sinh thái cao cấp từ EPei.'}
    </p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--ivory);border-radius:12px;padding:16px;text-align:center;
                  border:1px solid rgba(163,177,138,0.2)">
        <strong style="display:block;color:var(--deep-green);font-size:1.3rem;
                        font-family:var(--font-heading)">
          ${price.toLocaleString('vi-VN')}đ
        </strong>
        <span style="font-size:0.72rem;color:var(--olive)">/ ${p.unit}</span>
      </div>
      <div style="background:var(--ivory);border-radius:12px;padding:16px;text-align:center;
                  border:1px solid rgba(163,177,138,0.2)">
        <strong style="display:block;color:var(--deep-green);font-size:1.3rem;
                        font-family:var(--font-heading)">
          ${p.stock} ${p.unit}
        </strong>
        <span style="font-size:0.72rem;color:var(--olive)">Còn trong kho</span>
      </div>
    </div>
    <div style="background:rgba(74,124,89,0.06);border-radius:12px;padding:14px;
                margin-bottom:20px;border:1px solid rgba(74,124,89,0.15)">
      <p style="font-size:0.85rem;color:var(--olive)">
        <i class="fas fa-leaf" style="color:var(--sage);margin-right:6px"></i>
        <strong>Thành phần:</strong> ${p.ingredient || 'Nguyên liệu sinh thái'}
      </p>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-primary" style="flex:1;justify-content:center"
              onclick="addToCart(${p.id});closeProductModal()">
        <i class="fas fa-cart-plus"></i> Thêm vào giỏ
      </button>
      <button class="btn btn-sage" style="flex:1;justify-content:center"
              onclick="closeProductModal();showPage('order')">
        <i class="fas fa-shopping-bag"></i> Đặt ngay
      </button>
    </div>`;

  document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
  const m = document.getElementById('productModal');
  if (m) m.classList.remove('active');
}

/* ── Filter tabs ─────────────────────────────────────────────────────────── */
document.addEventListener('click', function(e) {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  renderProducts(tab.getAttribute('data-filter') || 'all');
});
