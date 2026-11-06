# Pie Games 🎈🐑

A collection of simple, ad-free games for toddlers, packaged as an Android app (APK) to sideload.
Everything works offline. Art is drawn in code and music/effects are generated; animal sounds are free recordings listed in [CREDITS.md](CREDITS.md).

## Games
- **Balloons** – endless popping in a meadow. Buttons at the top choose what's inside: 🎈 count the pops, 🎨 colours, 🐮 animals (real animal sounds), ABC letters, 123 numbers. Farm animals (sheep, cow, duck, dog, cat, chicken, horse, elephant) float down from surprise balloons. Tapping her cartoon plays the family "balloons" voice note.
- **Bubbles** – a quiet underwater bubble-pop (no kids, no talking): lots of fish to tap, a crab, jellyfish, coral; surprise bubbles release fish.
- **Run & Jump** – the selected child runs through changing places (meadow → farm → seaside → snow → sunset). Tap to hop, hold to jump higher, double-jump. Low stars can be grabbed running, high stars need a jump. Bumping into sheep/elephants/dinos/logs makes them fall over, see stars and get back up (sometimes with the family "standing" voice note).
- **Dino Eggs** – tap eggs to crack them; baby dinosaurs hatch, wander, roar and say their colour.
- **Colouring** – tap-to-fill, freehand brush, rainbow colour, ⭐ stickers, eraser, undo. Includes colouring pages of each kid. Work saves automatically.
- **Music** – choose 🥁 drums (kick, snare, toms, hi-hat, cymbals), 🎸 guitar (tap or strum the strings) or 🎹 piano (multi-touch, slide for glissando). Every part lights up or moves when played; sounds are synthesised live. Background music pauses while playing.
- **Peekaboo** – animals (and sometimes the kids) hide behind bushes, barn doors, haystacks, boxes and trees; tap to find them, hear their real sound and name.
- **Shapes** – 🔷 drag shapes into matching holes on a wooden board, or 🎨 put fruit and toys into the basket of the same colour.
- **Build it** – pick a house, car or rocket: saw a plank, then hammer the nails and screw the screws as each part flies in; it gets painted and the house puffs smoke (builder waves from the door), the car drives off, the rocket blasts off.
- **Counting** – tap and count, "how many?", "find the number", pop the number, trace the number.
- **Letters** – A-is-for-apple flashcards, "find the letter", pop the letter, trace the letter.

Quick buttons (top right): talking voice on/off, and music (tap to change song or turn off). Songs: Twinkle Twinkle, Mary Had a Little Lamb, Old MacDonald, Row Your Boat, Sheepy Hop.

## Grown-ups area
On the home screen, **hold the gear button for 2 seconds**. Edit each kid's cartoon (hair, skin, clothes, bow, toy hammer…) and name (spoken in games), and change settings: sounds, talking voice, family voice notes, background music, numbers up to 5/10/20, pop speed/amount/size, counting aloud, surprises, runner speed.

## Install on Android
1. Copy `dist/PieGames-<version>.apk` (only the latest build is kept) to the phone/tablet (or download it there).
2. Open it and allow "Install unknown apps" for your file manager/browser when asked.
3. Tip: turn on **App pinning** (Settings → Security) so little ones can't leave the app.

The talking voice uses the device's built-in text-to-speech (Google TTS). If it's silent, check Settings → Accessibility → Text-to-speech.

## Develop
```bash
npm install
npm run serve            # play in a browser at http://localhost:8080
npm run apk              # build dist/PieGames-<version>.apk (needs Android SDK + JDK 21; version is versionName in android/app/build.gradle)
```
Code lives in `www/` (plain HTML/CSS/JS modules, no bundler). Capacitor 8 wraps it for Android.
Builds are signed with `android/app/piegames-debug.keystore` so each new APK installs over the old one and keeps saved data.
