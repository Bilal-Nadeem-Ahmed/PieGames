# Pie Games 🎈🐑

A collection of simple, ad-free games for toddlers, packaged as an Android app (APK) to sideload.
Everything works offline. Art is drawn in code and sounds are generated, so there are no third-party assets.

## Games
- **Balloons** / **Bubbles** – endless popping. Chips at the top choose what's inside: counting (123), colours, animals (with animal noises), letters, numbers. Sheep surprises float down; the kids' faces appear on some balloons.
- **Run & Jump** – the chosen kid runs through a meadow (the other kid follows). Tap to hop, hold to jump higher, double-jump allowed. Collect balloons and stars; bumping into sheep/logs/dinos never ends the game.
- **Dino Eggs** – tap eggs to crack them; baby dinosaurs hatch, roar and say their colour.
- **Colouring** – tap-to-fill or freehand brush, rainbow colour, eraser, undo. Includes colouring pages of each kid. Work saves automatically.
- **Counting** – tap and count, "how many?", "find the number".
- **Letters** – A-is-for-apple flashcards and "find the letter".

## Grown-ups area
On the home screen, **hold the gear button for 2 seconds**. Edit each kid's cartoon (hair, skin, clothes, bow, toy hammer…) and name (spoken in games), and change settings: sounds, talking voice, family voice notes, numbers up to 5/10/20, pop speed/amount/size, counting aloud, surprises, runner speed.

## Install on Android
1. Copy `dist/PieGames-1.0.apk` to the phone/tablet (or download it there).
2. Open it and allow "Install unknown apps" for your file manager/browser when asked.
3. Tip: turn on **App pinning** (Settings → Security) so little ones can't leave the app.

The talking voice uses the device's built-in text-to-speech (Google TTS). If it's silent, check Settings → Accessibility → Text-to-speech.

## Develop
```bash
npm install
npm run serve            # play in a browser at http://localhost:8080
npm run apk              # build android/app/build/outputs/apk/debug/app-debug.apk (needs Android SDK + JDK 21)
```
Code lives in `www/` (plain HTML/CSS/JS modules, no bundler). Capacitor 8 wraps it for Android.
Builds are signed with `android/app/piegames-debug.keystore` so each new APK installs over the old one and keeps saved data.
