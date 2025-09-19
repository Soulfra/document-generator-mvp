#!/bin/bash
echo "🌐 Deploying OSS components..."

# Switch to OSS branch
git checkout oss-release

# Copy OSS components
cp -r oss-components/* .
cp -r symlinks .
cp docker-compose.yml .
cp flask-backend/Dockerfile flask-backend/requirements.txt .

# Remove private data references
sed -i '' 's/private-components\///g' docker-compose.yml
sed -i '' '/user_uploads:/d' docker-compose.yml
sed -i '' '/user_processing:/d' docker-compose.yml
sed -i '' '/user_outputs:/d' docker-compose.yml

# Commit OSS release
git add .
git commit -m "OSS release: containerized document generator with data isolation"

echo "✅ OSS components ready for public release"
echo "🔗 Push with: git push origin oss-release"
