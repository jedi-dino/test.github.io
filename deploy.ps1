# Build
npm run build

# Navigate into the build output directory
Set-Location dist

# Create .nojekyll file to bypass Jekyll processing
New-Item -ItemType File -Name ".nojekyll" -Force

# Initialize git repository if not already initialized
git init
git add -A
git commit -m "deploy"

# Add origin if not already added
git remote add origin https://github.com/jedi-dino/test.github.io.git

# Deploy to GitHub Pages
git push origin master --force

# Navigate back
Set-Location ..
