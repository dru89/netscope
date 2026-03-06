#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Read version from package.json
VERSION=$(node -p "require('./package.json').version")
TAG="v$VERSION"

echo "Releasing $TAG..."

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists. Skipping tag creation."
else
  echo "Creating tag $TAG..."
  git tag "$TAG"
fi

# Push commits and tag
echo "Pushing to origin..."
git push origin main
git push origin "$TAG"

# Build, sign, notarize, and publish
echo "Building and publishing release..."
tsc && vite build && electron-builder --mac --publish always

echo ""
echo "Release $TAG published!"
echo "https://github.com/Dru89/har-analyzer/releases/tag/$TAG"
