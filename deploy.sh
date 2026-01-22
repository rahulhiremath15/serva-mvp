#!/bin/bash

echo "🚀 Serva Deployment Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

echo "✅ Found package.json"

# Build the frontend
echo "📦 Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Git status check
echo "📋 Checking git status..."
git status

echo ""
echo "🎯 Ready for deployment!"
echo ""
echo "📝 Next Steps:"
echo "1. Commit and push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy Frontend to Vercel:"
echo "   - Go to vercel.com"
echo "   - Connect your GitHub repo"
echo "   - Set REACT_APP_API_URL environment variable"
echo ""
echo "3. Deploy Backend to Render:"
echo "   - Go to render.com"
echo "   - Connect your GitHub repo"
echo "   - Root directory: server"
echo "   - Start command: npm start"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
