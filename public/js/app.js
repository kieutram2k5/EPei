/* ============================================
   EPei - app.js  v2.0 — Main Controller
   ============================================ */
'use strict';

let currentPage = 'home';

/* ── Navigate to products with pre-selected filter ───────────────────────── */
function showPageFilter(page, filter) {
  showPage(page);
  setTimeout(() => {
    const tab = document.querySelector(`.filter-tab[data-filter="${filter}"]`);
    if (tab) {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderProducts(filter);
    }
  }, 150);
}

/* ── Page navigation ─────────────────────────────────────────────────────── */
function showPage(page) {
  // Auth guards
  if (page === 'admin') {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('Bạn cần đăng nhập với tài khoản Admin', 'error');
      showPage('login');
      return;
    }
  }
  if (page === 'customer') {
    if (!currentUser) {
      showToast('Vui lòng đăng nhập để xem tài khoản', 'info');
      showPage('login');
      return;
    }
    if (currentUser.role === 'admin') { showPage('admin'); return; }
  }

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (!target) { console.warn('Page not found:', page); return; }
  target.classList.add('active');
  currentPage = page;

  // Update nav active
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-page') === page);
  });

  // Show/hide footer & navbar for admin
  const footer = document.getElementById('mainFooter');
  const navbar = document.getElementById('navbar');
  if (page === 'admin') {
    if (footer) footer.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
  } else {
    if (footer) footer.style.display = '';
    if (navbar) navbar.style.display = '';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMenu();

  // Page-specific init
  switch (page) {
    case 'home':
      renderHomeProducts().then(() => setTimeout(initFadeIn, 50));
      setTimeout(initCounters, 400);
      break;
    case 'products':
      renderProducts('all').then(() => setTimeout(initFadeIn, 50));
      break;
    case 'order':
      renderOrderProducts();
      renderCartSummary();
      break;
    case 'cart':
      renderFullCart();
      break;
    case 'admin':
      renderAdminDashboard();
      break;
    case 'customer':
      renderCustomerDashboard();
      break;
    case 'sustainability':
      setTimeout(initCounters, 400);
      break;
    case 'about':
      setTimeout(initTimeline, 200);
      break;
    case 'process':
      setTimeout(initProcessSteps, 200);
      break;
  }

  // Don't call initFadeIn here for pages that render async
  if (!['home','products'].includes(page)) {
    setTimeout(initFadeIn, 100);
  }
}

/* ── Customer dashboard ──────────────────────────────────────────────────── */
function renderCustomerDashboard() {
  if (!currentUser) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

  set('customerWelcome', `Xin chào, ${currentUser.name}! 🌿`);
  set('customerName',    currentUser.name);
  set('customerEmail',   currentUser.email);
  setVal('profileName',    currentUser.name);
  setVal('profileEmail',   currentUser.email);
  setVal('profilePhone',   currentUser.phone);
  setVal('profileAddress', currentUser.address);

  renderMyOrders();
}

/* ── Init ────────────────────────────────────────────────────────────────── */
async function init() {
  // Check session
  await initAuth();

  // Particles
  initParticles();

  // Parallax + tilt
  initParallax();
  initCardTilt();

  // Cart badge
  updateCartCount();

  // Show home
  showPage('home');

  // Global fade-in
  setTimeout(initFadeIn, 600);
}

document.addEventListener('DOMContentLoaded', init);
