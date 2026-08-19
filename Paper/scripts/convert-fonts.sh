#!/usr/bin/env bash
# Convert the font files in Paper/Fonts/ into web-ready .woff2 copies.
# Originals are never modified. Run from the project root:
#   bash Paper/scripts/convert-fonts.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

python3 -c "import fontTools" 2>/dev/null || {
  echo "Installing fonttools (needed once)..."
  python3 -m pip install --quiet "fonttools[woff]"
}

mkdir -p public/fonts/apple public/fonts/euclid

convert() {
  local src="$1" out="$2"
  if [ ! -f "$src" ]; then
    echo "  skip (not found): $src"
    return
  fi
  python3 -m fontTools.ttLib.woff2 compress -o "$out" "$src" >/dev/null
  echo "  $(basename "$out")"
}

echo "Converting fonts..."
convert "Paper/Fonts/SF-Pro-Display-Regular.otf"   "public/fonts/apple/SF-Pro-Display-Regular.woff2"
convert "Paper/Fonts/SF-Pro-Text-Thin.otf"         "public/fonts/apple/SF-Pro-Text-Thin.woff2"
convert "Paper/Fonts/SF-Mono-Light.otf"            "public/fonts/apple/SF-Mono-Light.woff2"
convert "Paper/Fonts/SF-Mono-Semibold.otf"         "public/fonts/apple/SF-Mono-Semibold.woff2"
convert "Paper/Fonts/SF-Mono-Bold.otf"             "public/fonts/apple/SF-Mono-Bold.woff2"
convert "Paper/Fonts/NewYork.ttf"                  "public/fonts/apple/NewYork.woff2"
convert "Paper/Fonts/NewYorkExtraLarge-Bold.otf"   "public/fonts/apple/NewYorkExtraLarge-Bold.woff2"
convert "Paper/Fonts/Euclid Circular B Light.ttf"  "public/fonts/euclid/EuclidCircularB-Light.woff2"

echo
echo "Done. Refresh the Lab and the new faces appear in the Theme tab."
