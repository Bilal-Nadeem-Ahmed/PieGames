#!/usr/bin/env bash
# Usage: scripts/ship.sh "commit message"  -> bumps version (x.y -> x.y+1), builds APK, commits, pushes main.
set -e
cd "$(dirname "$0")/.."
f=android/app/build.gradle
code=$(grep -oP 'versionCode \K\d+' $f); ver=$(grep -oP 'versionName "\K[^"]+' $f)
new="${ver%.*}.$(( ${ver##*.} + 1 ))"
sed -i "s/versionCode $code\$/versionCode $((code+1))/; s/versionName \"$ver\"/versionName \"$new\"/" $f
export ANDROID_HOME=${ANDROID_HOME:-/home/user/android-sdk}
npm run -s apk 2>&1 | grep -E "BUILD|dist/"
git add -A
git commit -q -F - <<MSG
$1 (version $new)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RyopxMYo4eGreAeLbh7AsM
MSG
git branch -f claude/pie-games-app main
for i in 1 2 3 4; do git push -q origin main claude/pie-games-app && break; sleep $((2**i)); done
echo "shipped $new"
