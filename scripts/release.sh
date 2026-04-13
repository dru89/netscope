#!/bin/bash
set -e

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
  echo "Error: Tag $TAG already exists. Bump the version in package.json first."
  exit 1
fi

# Create tag and push — the GitHub Actions workflow handles the rest
echo "Creating tag $TAG..."
git tag "$TAG"

echo "Pushing to origin..."
git push origin main
git push origin "$TAG"

echo ""
echo "Tag $TAG pushed. GitHub Actions will build and publish the release."
echo "Watch progress: https://github.com/Dru89/netscope/actions"
