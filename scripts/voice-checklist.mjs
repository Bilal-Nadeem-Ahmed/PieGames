// Writes docs/VOICE_CLIPS.md: every word the games can say, ticked when a default clip exists.
// Run: node scripts/voice-checklist.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { CATALOG } from '../www/js/voice-catalog.js';
const manifest = JSON.parse(readFileSync('www/audio/voice/manifest.json', 'utf8'));
const keyOf = (w) => String(w).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const who = (k) => { const m = manifest[k] || {}; return [m.me && 'Dad', m.pie && 'Rahma'].filter(Boolean).join(' + '); };
let total = 0, done = 0;
let out = `# Voice clips checklist

Every word or phrase the games can say. ✅ = a default clip exists (who recorded it is shown).
Record the missing ones and send them over, or record them on the phone in **Grown-ups → Voices**.

**File names:** \`<words>-pie.wav\` for Rahma, \`<words>-me.wav\` for Dad (e.g. \`red-pie.wav\`, \`where's the-me.wav\`,
\`A-pie.wav\` for the letter A, \`7-me.wav\` for seven). A second take of the same word: \`red-pie 2.wav\`.
Import them with \`python3 scripts/import_voice.py <folder>\` and re-run \`node scripts/voice-checklist.mjs\`.

Names (Rahma, Ibrahim, …) are also spoken if recorded - record each child's name as \`rahma-me.wav\`, \`ibrahim-me.wav\`.
`;
for (const [group, words] of CATALOG) {
  const rows = words.map((w) => { const k = keyOf(w), ok = !!manifest[k]; total++; if (ok) done++; return `- ${ok ? '✅' : '⬜'} ${w}${ok ? ` _(${who(k)})_` : ''}`; });
  out += `\n## ${group} (${words.filter((w) => manifest[keyOf(w)]).length}/${words.length})\n\n${rows.join('\n')}\n`;
}
out = out.replace('# Voice clips checklist', `# Voice clips checklist (${done}/${total} recorded)`);
mkdirSync('docs', { recursive: true });
writeFileSync('docs/VOICE_CLIPS.md', out);
console.log(`docs/VOICE_CLIPS.md: ${done}/${total} recorded`);
