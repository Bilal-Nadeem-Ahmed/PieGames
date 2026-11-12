# Pie Games – project notes (working reference)

Read this first when picking the project back up. Keep it updated after each release.

## The family / users
- Built for **Rahma** ("Pie", age 2) and her cousin **Ibrahim** (≈2). Dad (repo owner, Bilal) is the grown-up.
- She loves: sheep (Shaun-like toys – but we must NOT copy Shaun/Elmo; use original generic art), balloons, ladybirds, animals, colouring.
- Both can count and know the alphabet. Content must be toddler-safe: big targets, no fail states, gentle "no".
- Dad wants **higher quality, not basic UIs**, levels, more content per game, and family voices instead of a robot voice.

## Tech
- Plain HTML/CSS/JS ES modules in `www/` (no bundler). Capacitor 8 wraps it into an Android APK.
- Plugins: `@capacitor/screen-orientation` (per-screen lock), `@capacitor-community/text-to-speech` (optional fallback only).
- Router: `www/js/app.js` – hash routes (`#home`, `#balloons`, …). Each game exports `mount(el, args)` returning a cleanup fn.
  Route change: cleanup → `lockFor(route)` (orientation.js waits for rotation) → mount.
- Android: `android/` committed. MainActivity = immersive full screen, keep-awake, back button → `window.pgBack()`.
  Manifest: VIBRATE, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, TTS queries, default `sensorLandscape`.
- Signing: fixed debug keystore `android/app/piegames-debug.keystore` (passwords `android`) so updates install over old versions.

## Build / release workflow (do this for every change)
1. Test in a headless browser: `cd www && python3 -m http.server 8080` then Playwright scripts (Chromium preinstalled; use
   `require('playwright')`). Test both 844x390 (landscape) and 390x844 (portrait). Check `pageerror`s.
2. `scripts/ship.sh "message"` → bumps versionName (x.y → x.y+1) + versionCode, runs `npm run apk`
   (write-version → copy-vendor → cap sync → gradle assembleDebug → `scripts/release-apk.mjs` copies to
   `dist/PieGames-<version>.apk`, deleting older ones), commits (with Co-Authored-By + Claude-Session lines), pushes
   `main` and `claude/pie-games-app`.
3. Make a QR code for the download link: `https://github.com/Bilal-Nadeem-Ahmed/PieGames/raw/main/dist/PieGames-<version>.apk`
   (repo is private → user must be signed in to GitHub in the phone browser). A `qr.py` helper lives in the session
   scratchpad; recreate with the `qrcode` pip package if missing. Send QR to user after each shipped game/change.
4. Android SDK lives in `/home/user/android-sdk` (ANDROID_HOME). If the container is fresh: download cmdline-tools from
   dl.google.com, `sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"`.
- Version shown at bottom of grown-ups area (`www/js/version.js`, generated).
- Current version at time of writing: **1.19** (+ Pie Pet in progress → 1.20).

## Orientation (forced)
`www/js/orientation.js`: portrait = balloons, bubbles, roundup. Everything else (home, grown-ups, other games) landscape.

## Shared modules
- `store.js` – players (avatar options; default p1 Rahma, p2 Ibrahim), settings (sound, voice, music, volumes `vol.*`,
  defaultVoices, phoneVoice, voices[], voiceNames, pop/runner options), `storage.read/write`.
- `sound.js` – WebAudio synth sfx (pop, chime, yay fanfare, ding, roar, munch, knock, screw, saw, vroom, beep, rocket…),
  `playClip(name)` for family voice notes in `www/audio/*.m4a` (balloons, standing), `audioOut()`.
- `music.js` – background songs (public-domain nursery tunes + "Sheepy Hop"), pause/resume, duck.
- `voices.js` + `voice-catalog.js` – family voice clips (see below). `speech.js` `say(text)` → clips (TTS only if phoneVoice).
- `animals.js` – real animal recordings `www/audio/animals/*.m4a` (credits in CREDITS.md). No pigs! Elephants wanted.
- `fx.js` – confetti, burst, `celebrate(text)` (fanfare + avatar cheer + praise clip).
- `draw.js` (canvas balloon/bubble/sheep/dino/star/ladybird), `scenery.js` (meadow with zones for runner), `sea.js`,
  `avatar.js` (SVG kids), `pictures.js` (colouring pages), `ui.js` (homeBtn, chips, draggable, inside, wait…).

## Voices (family clips)
- Bundled: `www/audio/voice/<key>/<voice>-<n>.m4a` + `manifest.json`. Voices: `me` = Dad, `pie` = Rahma.
- Import new clips: name `<words>-pie.wav` / `<words>-me.wav` → `python3 scripts/import_voice.py <folder>` →
  `node scripts/voice-checklist.mjs` (regenerates `docs/VOICE_CLIPS.md`).
- Text → clips: split on punctuation; a segment plays only if every non-filler word has a clip.
- Voice choice is weighted random: `settings.voiceWeights` (default Rahma 80, Dad 20, new voices 50), sliders in Grown-ups → Voices.
- Grown-ups → Voices: per voice ▶/●record/⬆upload/🗑, add voices (IndexedDB `pg-voices`), "Remove default voices" toggle,
  "Phone voice for missing words" toggle.

## Games (home tiles, in order)
Pie Pet, Balloons, Bubbles, Run & Jump, Dino Eggs, Colouring, Music, Peekaboo, Shapes, Build it, Feed, Pairs,
Sheep pen, Puzzles, Find it, Counting, Letters.

## TODO list (as of this note)
- [x] Forced orientation (1.17/1.18)
- [x] Voice system (1.19)
- [x] **Pie Pet** (`games/pet.js`, `games/pet-art.js`) shipped 1.20: real-Tamagotchi: needs decay in real time (IN_APP 30x), sick+medicine,
      sleep/lights, poops, bath, toys, growth stages. Fixing: poops under dock, pet too small (crop viewBox), food tray
      covers pet (move to side), offline decay too harsh (auto-sleep, 0.6x), faster sleep refill.
- [x] Feed v2 (1.21): reuses pet-art.js animals (+cow, elephant, duck), wander/feed/pet. Class `.foodbasket` (`.basket` belongs to the sorter).
- [x] Levels (1.23): `www/js/levels.js` – GAMES table (max, wins per level), `getLevel/win/setLevel/levelBadge/resetAllLevels`, per child key `pg.levels.<playerId>`. Each game: badge + `win(game, badge)` at round end + difficulty from `getLevel`.
- [x] Picture prompts (`askPill` in ui.js) so find-it rounds work without voice clips.
- [ ] README: APK location + QR, install, every game with screenshot, levels + reset, voices how-to; keep updated.
- [ ] Dino eggs improvement.
- [ ] Colouring: more pictures (different animals etc.).
- [x] Music: xylophone + bells added (1.24).
- [ ] Peekaboo improvement.
- [ ] Build it: more projects/options and polish.
- [ ] Puzzles: more pictures. Pairs: more card images.
- [ ] Voice clips still to record: see docs/VOICE_CLIPS.md (27/178 done at 1.19). Numbers 1–20 are the priority.

## Gotchas learned
- CSS class name clashes between games (`.card`, `.board`) – prefix new game classes.
- Effects drawn over tap targets must have `pointer-events: none`.
- Saving state on unmount can overwrite test edits – leave the screen before editing localStorage in tests.
- Playwright clicks wait for "stable" elements: use `{force:true}` on bouncing/pulsing buttons.
- `const` arrow helpers used before definition inside `mount` → TDZ errors; use function declarations.
- Wikimedia upload server rate-limits (429) this container; OpenGameArt works for CC0 sounds.
