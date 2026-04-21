const fs = require('fs');
const path = require('path');
const root = path.join('c:', 'Users', 'nycri', 'OneDrive', 'Desktop', 'SGPDC', 'front', 'sgpdc-app');
const exts = ['.tsx', '.ts'];
const changed = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!exts.includes(path.extname(entry.name))) continue;
    let text = fs.readFileSync(full, 'utf8');
    const newText = text.replace(/apiFetch\(/g, 'apiFetch(`').replace(/\)\`;?/g, '`)');
    // The replacement above is too naive, so we use a safer approach below.
    const safeText = text.split("apiFetch(/api").join("apiFetch(`/api");
    if (safeText !== text) {
      fs.writeFileSync(full, safeText, 'utf8');
      changed.push(full);
    }
  }
}

walk(root);
console.log('Modified files:', changed);
