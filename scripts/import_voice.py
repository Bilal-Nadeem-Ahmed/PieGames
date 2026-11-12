#!/usr/bin/env python3
"""Import recorded voice clips into the app.

Usage:  python3 scripts/import_voice.py <folder-with-clips>

File names say what is spoken and who said it:  "<words>-<voice>.wav"
  e.g.  red-pie.wav,  Good Job - me.wav,  well-done.pie.wav,  excellent-pie 2.wav (a second take)
Voice codes: pie = Rahma, me = Dad (see VOICE_NAMES). Any audio format ffmpeg reads is fine.

Clips are trimmed, volume-levelled and saved as www/audio/voice/<word-key>/<voice>-<n>.m4a,
and www/audio/voice/manifest.json is rebuilt. Running it again with new clips adds to what is there.
"""
import json, os, re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'www' / 'audio' / 'voice'
VOICES = {'pie': 'pie', 'rahma': 'pie', 'me': 'me', 'dad': 'me'}


def key_of(words: str) -> str:
    """Same rule as voices.js keyOf(): lower case, letters/digits only, words joined by '-'."""
    w = words.lower().replace("'", '').replace('’', '')
    w = re.sub(r'[^a-z0-9]+', '-', w).strip('-')
    return w


def parse(name: str):
    stem = os.path.splitext(name)[0].strip()
    stem = re.sub(r'\s+\d+$', '', stem)              # "excellent-pie 2" -> take 2
    stem = re.sub(r'-(\d+)$', '', stem)               # "black-me-2" -> take 2
    m = re.match(r'^(.*?)[\s\-\.]+(pie|rahma|me|dad)$', stem, re.I)
    if not m:
        return None
    return key_of(m.group(1)), VOICES[m.group(2).lower()]


def main(src):
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    skipped = []
    for f in sorted(pathlib.Path(src).rglob('*')):
        if not f.is_file() or f.name.startswith('.') or '__MACOSX' in f.parts:
            continue
        p = parse(f.name)
        if not p:
            skipped.append(f.name)
            continue
        key, voice = p
        d = OUT / key
        d.mkdir(exist_ok=True)
        takes = manifest.setdefault(key, {}).setdefault(voice, 0)
        out = d / f'{voice}-{takes + 1}.m4a'
        cmd = ['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-af',
               'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03,areverse,'
               'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.06,areverse,'
               'loudnorm=I=-15:TP=-1.5:LRA=11', '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', '80k', str(out)]
        subprocess.run(cmd, check=True)
        manifest[key][voice] = takes + 1
        print(f'{f.name:32} -> {key}/{out.name}')
    manifest_path.write_text(json.dumps(dict(sorted(manifest.items())), indent=1) + '\n')
    if skipped:
        print('\nSkipped (name not understood, expected "<words>-pie" or "<words>-me"):', *skipped, sep='\n  ')


if __name__ == '__main__':
    main(sys.argv[1])
