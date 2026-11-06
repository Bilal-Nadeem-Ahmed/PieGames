// Writes www/js/version.js from android/app/build.gradle's versionName.
import { readFileSync, writeFileSync } from 'node:fs';
const version = /versionName "([^"]+)"/.exec(readFileSync('android/app/build.gradle', 'utf8'))[1];
writeFileSync('www/js/version.js', `export const VERSION = '${version}';\n`);
console.log('version', version);
