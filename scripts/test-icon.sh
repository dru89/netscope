#!/bin/bash
# Quick iteration script for testing file icon changes.
# Builds the app, installs to /Applications, and clears icon caches.
set -e

# Prompt for sudo upfront so it doesn't interrupt the build.
if sudo -v; then
  while true; do sudo -n true; sleep 30; done 2>/dev/null &
  SUDO_PID=$!
  trap 'kill $SUDO_PID 2>/dev/null' EXIT
fi

echo "Building..."
make package

echo ""
echo "Removing old app..."
rm -rf /Applications/Netscope.app

echo "Clearing icon caches..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -u /Applications/Netscope.app 2>/dev/null || true
sudo find /private/var/folders -name "com.apple.iconservices*" -exec rm -rf {} + 2>/dev/null || true

echo "Installing new app..."
cp -R release/mac-arm64/Netscope.app /Applications/Netscope.app

echo "Registering..."
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f /Applications/Netscope.app

echo "Restarting Finder and Dock..."
killall Dock
killall Finder

echo ""
echo "Done. Check your .har files in Finder."
