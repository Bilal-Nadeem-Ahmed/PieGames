// Copies the built debug APK to dist/PieGames-<versionName>.apk (removing older ones)
// and writes the version into the web app so the grown-ups area can show it.
import { readFileSync, copyFileSync, readdirSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
const gradle = readFileSync('android/app/build.gradle', 'utf8');
const version = /versionName "([^"]+)"/.exec(gradle)[1];
mkdirSync('dist', { recursive: true });
for (const f of readdirSync('dist')) if (/^PieGames.*\.apk$/.test(f)) unlinkSync('dist/' + f);
copyFileSync('android/app/build/outputs/apk/debug/app-debug.apk', `dist/PieGames-${version}.apk`);
console.log(`dist/PieGames-${version}.apk`);
