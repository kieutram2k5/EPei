// Sync frontend/js/*.js và frontend/css/*.css vào public/
const fs = require('fs'), path = require('path');
const root = __dirname;
const items = [
  ['frontend/js/products.js', 'public/js/products.js'],
  ['frontend/js/orders.js',   'public/js/orders.js'],
  ['frontend/js/admin.js',    'public/js/admin.js'],
  ['frontend/js/app.js',      'public/js/app.js'],
  ['frontend/js/ui.js',       'public/js/ui.js'],
  ['frontend/css/main.css',        'public/css/main.css'],
  ['frontend/css/components.css',  'public/css/components.css'],
  ['frontend/css/pages.css',       'public/css/pages.css'],
  ['frontend/css/admin.css',       'public/css/admin.css'],
  ['frontend/css/responsive.css',  'public/css/responsive.css'],
  ['frontend/index.html',          'public/index.html'],
];
items.forEach(([src, dest]) => {
  try {
    const s = path.join(root, src), d = path.join(root, dest);
    fs.mkdirSync(path.dirname(d), { recursive: true });
    fs.copyFileSync(s, d);
    console.log('✅', dest);
  } catch(e) { console.error('❌', dest, e.message); }
});
console.log('\nDone!');
