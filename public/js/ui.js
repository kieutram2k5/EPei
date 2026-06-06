/* ============================================
   EPei - ui.js  v2.0 — Rich Animations
   ============================================ */
'use strict';

/* ── Toast ───────────────────────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3600);
}

/* ── Loading ─────────────────────────────────────────────────────────────── */
function showLoading(show) {
  const el = document.getElementById('loadingOverlay');
  if (el) el.classList.toggle('hidden', !show);
}

/* ── Navbar scroll ───────────────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

function toggleMenu() {
  const menu = document.getElementById('navMenu');
  const ham  = document.getElementById('hamburger');
  menu.classList.toggle('open');
  if (ham) ham.classList.toggle('open');
}
function closeMenu() {
  const menu = document.getElementById('navMenu');
  const ham  = document.getElementById('hamburger');
  if (menu) menu.classList.remove('open');
  if (ham)  ham.classList.remove('open');
}

/* ── Particle Canvas ─────────────────────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // Leaf shapes
  const LEAF_PATHS = [
    (ctx, x, y, s) => {
      ctx.beginPath();
      ctx.ellipse(x, y, s * 1.4, s * 0.7, Math.PI / 4, 0, Math.PI * 2);
    },
    (ctx, x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.bezierCurveTo(x + s, y - s * 0.5, x + s, y + s * 0.5, x, y + s);
      ctx.bezierCurveTo(x - s, y + s * 0.5, x - s, y - s * 0.5, x, y - s);
    },
  ];

  const particles = Array.from({ length: 70 }, (_, i) => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 3.5 + 1,
    dx: (Math.random() - 0.5) * 0.55,
    dy: -(Math.random() * 0.65 + 0.18),
    alpha: Math.random() * 0.5 + 0.12,
    color: ['#A3B18A','#6B705C','#4A7C59','#B08968','#c8d8b0'][Math.floor(Math.random() * 5)],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    type: i % 3 === 0 ? 'leaf' : 'dot',
    leafIdx: Math.floor(Math.random() * LEAF_PATHS.length),
  }));

  // Connection lines between nearby particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(163,177,138,${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.type === 'leaf') {
        LEAF_PATHS[p.leafIdx](ctx, 0, 0, p.r * 1.8);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      p.x   += p.dx;
      p.y   += p.dy;
      p.rot += p.rotSpeed;
      if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.x < -20) p.x = W + 20;
      if (p.x > W + 20) p.x = -20;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }, { passive: true });
}

/* ── Counter Animation ───────────────────────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.page.active [data-target]');
  counters.forEach(el => {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target   = parseInt(el.getAttribute('data-target'));
    const duration = 2000;
    const step     = target / (duration / 16);
    let current    = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
        // Pop animation
        el.style.animation = 'counter-pop 0.4s ease';
        setTimeout(() => { el.style.animation = ''; }, 400);
      }
      el.textContent = target >= 1000
        ? Math.floor(current).toLocaleString('vi-VN')
        : Math.floor(current);
    }, 16);
  });
}

/* ── Timeline Animation ──────────────────────────────────────────────────── */
function initTimeline() {
  const items = document.querySelectorAll('#page-about .timeline-item');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.2 });
  items.forEach(i => obs.observe(i));
}

/* ── Process Steps Animation ─────────────────────────────────────────────── */
function initProcessSteps() {
  const steps = document.querySelectorAll('#page-process .process-step');
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 90);
    });
  }, { threshold: 0.12 });
  steps.forEach(s => obs.observe(s));
}

/* ── Fade-in Observer ────────────────────────────────────────────────────── */
function initFadeIn() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fade-in-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  const selectors = [
    '.feature-card','.mvv-card','.tech-card','.research-card',
    '.sdg-card','.team-card','.product-card','.impact-card',
    '.about-stat','.timeline-content','.step-content',
    '.contact-item','.footer-links','.footer-contact',
  ];
  document.querySelectorAll(selectors.join(',')).forEach((el, i) => {
    if (!el.classList.contains('fade-in-item')) {
      el.classList.add('fade-in-item', 'stagger-children');
      obs.observe(el);
    }
  });
}

/* ── Parallax on hero ────────────────────────────────────────────────────── */
function initParallax() {
  window.addEventListener('scroll', () => {
    const hero = document.querySelector('#page-home .hero');
    if (!hero) return;
    const scrolled = window.scrollY;
    const content  = hero.querySelector('.hero-content');
    if (content) content.style.transform = `translateY(${scrolled * 0.25}px)`;
  }, { passive: true });
}

/* ── Hover tilt on cards ─────────────────────────────────────────────────── */
function initCardTilt() {
  document.addEventListener('mousemove', e => {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const card = e.target.closest('.product-card, .feature-card, .tech-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  });
  document.addEventListener('mouseleave', e => {
    if (!e.target || typeof e.target.closest !== 'function') return;
    const card = e.target.closest('.product-card, .feature-card, .tech-card');
    if (card) card.style.transform = '';
  }, true);
}

/* ── Modal close ─────────────────────────────────────────────────────────── */
function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }
}

/* ── Customer tab ────────────────────────────────────────────────────────── */
function showCustomerTab(tab, btn) {
  document.querySelectorAll('.customer-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.customer-nav').forEach(n => n.classList.remove('active'));
  const tabEl = document.getElementById('customer-' + tab);
  if (tabEl) tabEl.classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ── Contact form ────────────────────────────────────────────────────────── */
async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name:         form.name.value,
    email:        form.email.value,
    organization: form.organization.value,
    subject:      form.subject.value,
    content:      form.content.value,
  };
  showLoading(true);
  const res = await API.sendMessage(data);
  showLoading(false);
  if (res.success) {
    form.reset();
    showToast(res.message, 'success');
  } else {
    showToast(res.message || 'Lỗi gửi tin nhắn', 'error');
  }
}

/* ── Number format helper ────────────────────────────────────────────────── */
function fmtVND(n) {
  return Number(n).toLocaleString('vi-VN') + 'đ';
}
