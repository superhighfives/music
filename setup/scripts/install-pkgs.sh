#!/bin/zsh
# Install every .pkg inside one or more .dmg installers (FabFilter, Soundtoys, Sonic Charge…).
# Usage: sudo zsh setup/scripts/install-pkgs.sh ~/Downloads/ffsaturn213.dmg ~/Downloads/fftimeless310.dmg
# Check a package before installing: pkgutil --check-signature <pkg>
set -e
[ $# -gt 0 ] || { echo "usage: sudo zsh $0 <installer.dmg>..."; exit 1; }
for dmg in "$@"; do
  mnt=$(mktemp -d)
  hdiutil attach -quiet -nobrowse -readonly -mountpoint "$mnt" "$dmg"
  for pkg in "$mnt"/*.pkg; do
    echo "==> ${pkg:t}"
    installer -pkg "$pkg" -target /
  done
  hdiutil detach -quiet "$mnt"
done
echo "==> done"
