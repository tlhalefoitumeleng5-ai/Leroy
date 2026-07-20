#!/usr/bin/env bash
# Cloud Agent install for Leroy AI (Flutter).
# Idempotent: safe to re-run on cached snapshots.
set -euo pipefail

FLUTTER_DIR="${FLUTTER_DIR:-$HOME/flutter}"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

ensure_path() {
  local bin_dir="$1"
  export PATH="$bin_dir:$PATH"
  for rc in "$HOME/.bashrc" "$HOME/.profile"; do
    if [[ -f "$rc" ]] || [[ "$rc" == "$HOME/.bashrc" ]]; then
      if ! grep -Fq "$bin_dir" "$rc" 2>/dev/null; then
        echo "export PATH=\"$bin_dir:\$PATH\"" >> "$rc"
      fi
    fi
  done
  if [[ -w /usr/local/bin ]] || command -v sudo >/dev/null 2>&1; then
    local name
    for name in flutter dart; do
      if [[ -x "$FLUTTER_DIR/bin/$name" ]]; then
        sudo ln -sfn "$FLUTTER_DIR/bin/$name" "/usr/local/bin/$name" 2>/dev/null || \
          ln -sfn "$FLUTTER_DIR/bin/$name" "/usr/local/bin/$name" 2>/dev/null || true
      fi
    done
  fi
}

install_flutter() {
  if command -v flutter >/dev/null 2>&1 && flutter --version >/dev/null 2>&1; then
    echo "Flutter already available: $(command -v flutter)"
    return
  fi

  if [[ ! -x "$FLUTTER_DIR/bin/flutter" ]]; then
    echo "Installing Flutter SDK into $FLUTTER_DIR..."
    git clone https://github.com/flutter/flutter.git -b stable --depth 1 "$FLUTTER_DIR"
  fi

  ensure_path "$FLUTTER_DIR/bin"
}

install_linux_deps() {
  # Lightweight deps Flutter/web/linux often need; ignore if apt unavailable.
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq || true
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
      curl git unzip xz-utils zip libglu1-mesa clang cmake ninja-build \
      pkg-config libgtk-3-dev openjdk-17-jdk-headless \
      >/dev/null 2>&1 || true
  fi
}

install_android_sdk() {
  export ANDROID_HOME
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
  mkdir -p "$ANDROID_HOME/cmdline-tools"

  if [[ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]]; then
    echo "Installing Android command-line tools..."
    local tmp
    tmp="$(mktemp -d)"
    curl -fsSL -o "$tmp/cmdline-tools.zip" \
      "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    unzip -q "$tmp/cmdline-tools.zip" -d "$tmp"
    rm -rf "$ANDROID_HOME/cmdline-tools/latest"
    mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
    # Zip contains a top-level cmdline-tools/ directory
    mv "$tmp/cmdline-tools/"* "$ANDROID_HOME/cmdline-tools/latest/"
    rm -rf "$tmp"
  fi

  ensure_path "$ANDROID_HOME/cmdline-tools/latest/bin"
  ensure_path "$ANDROID_HOME/platform-tools"
  ensure_path "$ANDROID_HOME/emulator"

  for rc in "$HOME/.bashrc" "$HOME/.profile"; do
    if [[ -f "$rc" ]] || [[ "$rc" == "$HOME/.bashrc" ]]; then
      if ! grep -Fq 'ANDROID_HOME' "$rc" 2>/dev/null; then
        {
          echo "export ANDROID_HOME=\"$ANDROID_HOME\""
          echo "export ANDROID_SDK_ROOT=\"\$ANDROID_HOME\""
        } >> "$rc"
      fi
    fi
  done

  yes | sdkmanager --licenses >/dev/null 2>&1 || true
  # Keep these in sync with what `flutter build apk` pulls on first run.
  sdkmanager \
    "platform-tools" \
    "platforms;android-36" \
    "platforms;android-34" \
    "build-tools;36.0.0" \
    "build-tools;34.0.0" \
    "build-tools;28.0.3" \
    "ndk;28.2.13676358" \
    "cmake;3.22.1" \
    "cmdline-tools;latest" \
    >/dev/null

  if command -v flutter >/dev/null 2>&1; then
    flutter config --android-sdk "$ANDROID_HOME" >/dev/null
  fi
}

main() {
  install_linux_deps
  install_flutter
  ensure_path "$FLUTTER_DIR/bin"

  flutter config --no-analytics >/dev/null
  flutter --version

  # Android SDK so `flutter build apk` works in cloud agents.
  install_android_sdk || echo "Warning: Android SDK setup incomplete; web/analyze still work."

  echo "Fetching Dart/Flutter packages..."
  flutter pub get

  echo "Leroy AI Flutter environment is ready."
  flutter doctor || true
}

main "$@"
