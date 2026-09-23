const fs = require('fs');
const path = require('path');

const src = __dirname;
const dst = path.join(__dirname, 'www');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// Dateien die direkt im Root liegen
for (const file of ['index.html', 'sw.js']) {
  fs.copyFileSync(path.join(src, file), path.join(dst, file));
}

// Ordner
for (const dir of ['css', 'js']) {
  copyDir(path.join(src, dir), path.join(dst, dir));
}

console.log('www/ aktualisiert ✓');
