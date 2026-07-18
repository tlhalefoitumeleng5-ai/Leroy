#!/usr/bin/env bash
# Cloud Agent install for Leroy AI (Flutter).
# Idempotent: safe to re-run on cached snapshots.
set -euo pipefail

FLUTTER_DIR="${FLUTTER_DIR:-$HOME/flutter}"

if ! command -v flutter >/dev/null 2>&1; then
  if [[ ! -x "$FLUTTER_DIR/bin/flutter" ]]; then
    echo "Installing Flutter SDK into $FLUTTER_DIR..."
    git clone https://github.com/flutter/flutter.git -b stable --depth 1 "$FLUTTER_DIR"
  fi
  export PATH="$FLUTTER_DIR/bin:$PATH"
  if ! grep -q 'flutter/bin' "$HOME/.bashrc" 2>/dev/null; then
    echo "export PATH=\"$FLUTTER_DIR/bin:\$PATH\"" >> "$HOME/.bashrc"
  fi
fi

flutter config --no-analytics
flutter --version
flutter pub get

echo "Leroy AI environment is ready."
