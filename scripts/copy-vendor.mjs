// Copies the Capacitor runtime into www so the plain-JS app can call native plugins.
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('www/js/vendor', { recursive: true });
copyFileSync('node_modules/@capacitor/core/dist/capacitor.js', 'www/js/vendor/capacitor.js');
console.log('copied capacitor.js');
