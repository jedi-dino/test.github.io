# Build
npm run build

# Navigate into the build output directory
Set-Location dist

# Create .nojekyll file to bypass Jekyll processing
New-Item -ItemType File -Name ".nojekyll" -Force

# Initialize git repository if not already initialized
git init
git checkout -B main
git add -A
git commit -m "deploy"

# Deploy to GitHub Pages using HTTPS
git push -f https://github.com/jedi-dino/test.github.io.git main:gh-pages

# Navigate back
Set-Location ..
