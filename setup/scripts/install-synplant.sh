#!/bin/zsh
# Install only Synplant 2 (and the Sonic Charge Authenticator) from the Sonic Charge
# Plugins bundle, skipping Bitspeek, Echobode, Microtonic and Permut8.
# Usage: sudo zsh setup/scripts/install-synplant.sh ~/Downloads/"Sonic Charge Plugins 2024.08.30.dmg"
#
# Known issue with the 2024.08.30 bundle: Synplant 2.0.2's postinstall script fails its
# own MD5 check (the binaries hash to df3930039a3feccd807ee33624e44834, the script expects
# 04b4b7c814bfee7bf3c8236abe04892e), so macOS rolls the install back. If that happens,
# the VST2 plugin still lands; finish by copying it to AU and VST3 as the script would:
#   sudo rsync -a --delete "/Library/Audio/Plug-Ins/VST/Sonic Charge/Synplant.vst/" /Library/Audio/Plug-Ins/Components/Synplant.component
#   sudo mkdir -p "/Library/Audio/Plug-Ins/VST3/Sonic Charge"
#   sudo rsync -a --delete "/Library/Audio/Plug-Ins/VST/Sonic Charge/Synplant.vst/" "/Library/Audio/Plug-Ins/VST3/Sonic Charge/Synplant.vst3"
set -e
dmg="${1:?usage: sudo zsh $0 <Sonic Charge Plugins .dmg>}"
choices="${0:A:h}/synplant-choices.xml"
# A failed earlier run can leave the image mounted; attach a copy so that can't block us.
tmp=$(mktemp -d)
cp "$dmg" "$tmp/sc.dmg"
mkdir "$tmp/mnt"
hdiutil attach -quiet -nobrowse -readonly -mountpoint "$tmp/mnt" "$tmp/sc.dmg"
echo "==> installing Synplant 2 only"
installer -pkg "$tmp/mnt/Sonic Charge Plugins.pkg" -applyChoiceChangesXML "$choices" -target / || true
hdiutil detach -quiet "$tmp/mnt"
rm -rf "$tmp"
echo "==> done (if the installer failed, see the MD5 note at the top of this script)"
