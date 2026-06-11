const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src', 'database', 'migrations');
const dest = path.join(__dirname, 'dist', 'database', 'migrations');

console.log('Src path:', src);
console.log('Dest path:', dest);

try {
  if (fs.existsSync(src)) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    console.log('Files to copy:', files);
    for (const file of files) {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied: ${file}`);
    }
    console.log('✅ Successfully copied all migrations');
  } else {
    console.warn('⚠️ Source migrations folder not found');
  }
} catch (err) {
  console.error('❌ Error copying migrations:', err);
  process.exit(1);
}
