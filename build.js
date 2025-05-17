// build.js - Script to copy files to the extension-package directory
import fs from 'fs';
import path from 'path';

// Files to copy
const filesToCopy = [
  'background.js',
  'content.js',
  'popup.js',
  'popup.html',
  'styles.css',
  'manifest.json',
  'config.js'
];

// Directories to ensure exist
const dirsToEnsure = [
  'extension-package',
  'extension-package/images'
];

// Ensure directories exist
dirsToEnsure.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Copy files
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(path.join('extension-package', file), content);
    console.log(`Copied: ${file} -> extension-package/${file}`);
  } else {
    console.error(`Error: File not found: ${file}`);
  }
});

// Copy images
const imageFiles = fs.readdirSync('images');
imageFiles.forEach(file => {
  const sourcePath = path.join('images', file);
  const destPath = path.join('extension-package/images', file);
  
  if (fs.statSync(sourcePath).isFile()) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${sourcePath} -> ${destPath}`);
  }
});

console.log('Build completed!'); 