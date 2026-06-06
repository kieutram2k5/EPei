// sync_public.js — copy frontend/* vào public/*
const fs   = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item), d = path.join(dest, item);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const root = __dirname;
copyDir(path.join(root, 'frontend'), path.join(root, 'public'));
console.log('✅ Synced frontend → public');
