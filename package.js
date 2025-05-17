// package.js - Script to create a zip file of the extension
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// First, run the build script
console.log('Running build script...');
try {
  execSync('node build.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// Create a zip file of the extension-package directory
console.log('Creating zip file...');

// Determine the appropriate zip command based on platform
const isWindows = process.platform === 'win32';
let zipCommand;

if (isWindows) {
  // On Windows, use PowerShell's Compress-Archive
  zipCommand = 'powershell -command "Compress-Archive -Path extension-package\\* -DestinationPath decopress-pms-indicator.zip -Force"';
} else {
  // On Unix-like systems, use zip command
  zipCommand = 'cd extension-package && zip -r ../decopress-pms-indicator.zip *';
}

try {
  execSync(zipCommand, { stdio: 'inherit' });
  console.log('Zip file created: decopress-pms-indicator.zip');
} catch (error) {
  console.error('Failed to create zip file:', error);
  process.exit(1);
}

console.log('Packaging completed!'); 