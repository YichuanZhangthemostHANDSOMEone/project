const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'dist', 'bundle.js');
const dest = path.join(__dirname, '..', 'public', 'bundle.js');
fs.copyFileSync(src, dest);
console.log(`Copied ${src} to ${dest}`);

