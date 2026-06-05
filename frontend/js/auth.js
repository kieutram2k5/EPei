/* ============================================
   EPei - auth.js  v2.0
   ============================================ */
'use strict';

let currentUser = null;

/* ── Init: check existing session ────────────────────────────────────────── */
async function initAuth() {
  try {
    const res = await API.getMe();
    if (res.success && res.user) {
      currentUser = res.user;
      updateNavForUser();
    }
  } catch (e) {
    // Silent fail — user not logged in
  }
}

/* ── Login ───────────────────────────────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('Vui lòng nhập email và mật khẩu', 'error');
    return;
  }

  showLoading(true);
  const res = await API.login({ email, password });
  showLoading(false);

  if (res.success) {
    currentUser = res.user;
    updateNavForUser();
    showToast(`Chào mừng ${res.user.name}! 🌿`, 'success');
    setTimeout(() => {
      if (res.user.role === 'admin') showPage('admin');
      else showPage('customer');
    }, 400);
  } else {
    showToast(res.message || 'Đăng nhập thất bại', 'error');
    // Shake animation on form
    const form = document.querySelector('#loginBox form');
    if (form) {
      form.style.animation = 'shake 0.4s ease';
      setTimeout(() => { form.style.animation = ''; }, 400);
    }
  }
}

/* ── Register ────────────────────────────────────────────────────────────── */
async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const phone    = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  if (password !== confirm) {
    showToast('Mật khẩu xác nhận không khớp', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
    return;
  }

  showLoading(true);
  const res = await API.register({ name, email, phone, password });
  showLoading(false);

  if (res.success) {
    currentUser = res.user;
    updateNavForUser();
    showToast(`Đăng ký thành công! Chào mừng ${name} 🌿`, 'success');
    setTimeout(() => showPage('customer'), 400);
  } else {
    showToast(res.message || 'Đăng ký thất bại', 'error');
  }
}

/* ── Logout ──────────────────────────────────────────────────────────────── */
async function handleLogout() {
  showLoading(true);
  await API.logout();
  showLoading(false);
  currentUser = null;
  updateNavForUser();
  showToast('Đã đăng xuất thành công', 'info');
  showPage('home');
}

/* ── Toggle login/register ───────────────────────────────────────────────── */
function toggleAuthBox() {
  document.getElementById('loginBox').classList.toggle('hidden');
  document.getElementById('registerBox').classList.toggle('hidden');
}

/* ── Toggle password visibility ─────────────────────────────────────────── */
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  // Update icon
  const btn = input.nextElementSibling;
  if (btn) btn.innerHTML = isText
    ? '<i class="fas fa-eye"></i>'
    : '<i class="fas fa-eye-slash"></i>';
}

/* ── Update navbar for logged-in user ────────────────────────────────────── */
function updateNavForUser() {
  const loginBtn = document.getElementById('navLoginBtn');
  if (!loginBtn) return;
  if (currentUser) {
    const shortName = currentUser.name.split(' ').pop();
    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${shortName}`;
    loginBtn.onclick = () => showPage(currentUser.role === 'admin' ? 'admin' : 'customer');
    loginBtn.style.borderColor = 'rgba(163,177,138,0.5)';
  } else {
    loginBtn.innerHTML = '<i class="fas fa-user"></i> Đăng nhập';
    loginBtn.onclick = () => showPage('login');
    loginBtn.style.borderColor = '';
  }
}

/* ── Update profile ──────────────────────────────────────────────────────── */
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
    updateNavForUser();
    showToast('Đã cập nhật thông tin thành công', 'success');
  } else {
    showToast(res.message || 'Lỗi cập nhật', 'error');
  }
}
