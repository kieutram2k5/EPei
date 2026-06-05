/* ============================================================
   EPei - auth.js  v3.0 — JWT stateless
   ============================================================ */
'use strict';

let currentUser = null;

async function initAuth() {
  const res = await API.getMe();
  if (res.success && res.user) {
    currentUser = res.user;
    updateNavForUser();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showToast('Vui lòng nhập email và mật khẩu', 'error'); return; }

  showLoading(true);
  const res = await API.login({ email, password });
  showLoading(false);

  if (res.success) {
    currentUser = res.user;
    updateNavForUser();
    showToast(`Chào mừng ${res.user.name}! 🌿`, 'success');
    setTimeout(() => showPage(res.user.role === 'admin' ? 'admin' : 'customer'), 300);
  } else {
    showToast(res.message || 'Đăng nhập thất bại', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const phone    = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  if (password !== confirm) { showToast('Mật khẩu xác nhận không khớp', 'error'); return; }
  if (password.length < 6)  { showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error'); return; }

  showLoading(true);
  const res = await API.register({ name, email, phone, password });
  showLoading(false);

  if (res.success) {
    currentUser = res.user;
    updateNavForUser();
    showToast(`Đăng ký thành công! Chào mừng ${name} 🌿`, 'success');
    setTimeout(() => showPage('customer'), 300);
  } else {
    showToast(res.message || 'Đăng ký thất bại', 'error');
  }
}

async function handleLogout() {
  await API.logout();
  currentUser = null;
  updateNavForUser();
  showToast('Đã đăng xuất', 'info');
  showPage('home');
}

function toggleAuthBox() {
  document.getElementById('loginBox').classList.toggle('hidden');
  document.getElementById('registerBox').classList.toggle('hidden');
}

function togglePassword(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
}

function updateNavForUser() {
  const btn = document.getElementById('navLoginBtn');
  if (!btn) return;
  if (currentUser) {
    const name = currentUser.name.split(' ').pop();
    btn.innerHTML = `<i class="fas fa-user-circle"></i> ${name}`;
    btn.onclick   = () => showPage(currentUser.role === 'admin' ? 'admin' : 'customer');
  } else {
    btn.innerHTML = '<i class="fas fa-user"></i> Đăng nhập';
    btn.onclick   = () => showPage('login');
  }
}

async function updateProfile(e) {
  e.preventDefault();
  if (!currentUser) return;
  const data = {
    name:    document.getElementById('profileName').value.trim(),
    phone:   document.getElementById('profilePhone').value.trim(),
    address: document.getElementById('profileAddress').value.trim(),
  };
  if (!data.name) { showToast('Tên không được để trống', 'error'); return; }
  showLoading(true);
  const res = await API.updateProfile(data);
  showLoading(false);
  if (res.success) {
    currentUser = res.user;
    // Cập nhật token mới nếu có
    if (res.token) localStorage.setItem('epei_token', res.token);
    updateNavForUser();
    showToast('Đã cập nhật thông tin', 'success');
  } else {
    showToast(res.message || 'Lỗi', 'error');
  }
}
