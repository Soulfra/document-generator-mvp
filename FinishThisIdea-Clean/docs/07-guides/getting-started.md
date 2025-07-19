# Getting Started

Welcome to FinishThisIdea! This guide will help you transform your first messy codebase into clean, production-ready code in just a few minutes.

## Quick Start (2 minutes)

### 1. Sign Up
Visit [finishthisidea.com](https://finishthisidea.com) and create your account. No credit card required for your first cleanup!

### 2. Upload Your Code
```bash
# Zip your project (excluding node_modules, etc.)
zip -r myproject.zip . -x "node_modules/*" ".git/*" "dist/*"
```

Drag and drop your zip file onto the upload area, or click to browse.

### 3. Pay $1
Complete the secure Stripe checkout. Just $1 for your first cleanup!

### 4. Get Clean Code
Wait ~30 minutes (usually faster). You'll receive an email when done, or watch the real-time progress.

## What Gets Cleaned?

Our AI-powered cleanup service will:

✅ **Format all code** - Consistent indentation, spacing, and style  
✅ **Remove dead code** - Unused functions, variables, and imports  
✅ **Optimize imports** - Sort, deduplicate, and organize  
✅ **Fix naming** - Convert to consistent camelCase/PascalCase  
✅ **Add documentation** - Basic JSDoc comments for functions  
✅ **Organize files** - Group related files logically  
✅ **Remove debug code** - console.logs, debugger statements  
✅ **Update dependencies** - Flag outdated/vulnerable packages  

## Supported Languages

Currently supporting:
- JavaScript/TypeScript
- React/Vue/Angular
- Node.js
- Python
- HTML/CSS
- JSON/YAML

Coming soon:
- Go
- Rust  
- Java
- C#

## Your First Cleanup

### Step 1: Prepare Your Code

Before uploading:
1. **Save your work** - Commit current changes
2. **Remove secrets** - No API keys or passwords
3. **Check size** - Must be under 50MB zipped

```bash
# Good to check
git status        # Ensure everything is committed
git secret scan   # Check for secrets
du -sh .         # Check size
```

### Step 2: Create Archive

```bash
# Simple zip
zip -r project.zip .

# Exclude common directories
zip -r project.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "coverage/*" \
  -x "*.log"

# Or use tar
tar -czf project.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  .
```

### Step 3: Upload & Process

1. Go to [finishthisidea.com](https://finishthisidea.com)
2. Drop your file in the upload zone
3. Review what will be cleaned
4. Pay $1 via Stripe
5. Watch real-time progress

### Step 4: Download Results

Once complete, you'll get:
- **Cleaned code** - Download as zip
- **Change report** - What was modified
- **Metrics** - Quality improvements
- **Next steps** - Recommendations

## Advanced Usage

### Using the API

For automation, use our API:

```javascript
const FTI = require('@finishthisidea/sdk');
const client = new FTI({ apiKey: 'your-api-key' });

async function cleanupProject() {
  // Upload
  const upload = await client.upload('./project.zip');
  
  // Start cleanup
  const job = await client.cleanup({
    uploadId: upload.id,
    options: {
      style: 'prettier',
      removeComments: false,
      generateDocs: true
    }
  });
  
  // Wait for completion
  const result = await client.waitForCompletion(job.id);
  
  // Download
  await client.download(result.downloadUrl, './cleaned.zip');
}
```

### CLI Tool

Install our CLI for easy command-line usage:

```bash
# Install globally
npm install -g @finishthisidea/cli

# Run cleanup
fti cleanup ./my-project --output ./cleaned

# With options
fti cleanup ./my-project \
  --style prettier \
  --keep-comments \
  --generate-docs \
  --output ./cleaned
```

### GitHub Action

Add to your workflow:

```yaml
name: Cleanup Code
on: [push]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: FinishThisIdea Cleanup
        uses: finishthisidea/cleanup-action@v1
        with:
          api-key: ${{ secrets.FTI_API_KEY }}
          path: ./src
          
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git commit -m "🧹 Automated cleanup"
          git push
```

## Understanding the Tinder Interface

After uploading, you can review individual changes:

### Swipe Controls
- **👉 Swipe Right** - Approve this change
- **👈 Swipe Left** - Reject this change  
- **👆 Swipe Up** - Always do this type of change
- **👇 Swipe Down** - Never do this type of change

### Keyboard Shortcuts
- **→** or **D** - Approve
- **←** or **A** - Reject
- **↑** or **W** - Always
- **↓** or **S** - Never
- **Space** - Show details
- **Enter** - Quick approve

### Smart Learning
The more you use it, the smarter it gets! The system learns your preferences and applies them automatically in future cleanups.

## Best Practices

### 1. Start Small
Test with a single module first:
```bash
zip -r component.zip ./src/components/Header
```

### 2. Review Changes
Always review the cleanup report to understand what changed.

### 3. Use Version Control
```bash
git checkout -b cleanup
# Upload and process
# Download results
git add .
git commit -m "Apply automated cleanup"
git push origin cleanup
```

### 4. Incremental Cleanup
For large codebases, clean up in sections:
- Frontend first
- Then backend
- Then tests
- Finally, configuration

## Common Questions

**Q: Will it break my code?**  
A: No! We only make safe transformations. All functionality is preserved.

**Q: What about my code style?**  
A: You can configure style preferences or use the Tinder interface to train the AI.

**Q: How long does it take?**  
A: Usually 15-30 minutes. Complex projects may take up to 60 minutes.

**Q: Can I preview changes?**  
A: Yes! Use the Tinder interface to review each change before applying.

**Q: Is my code secure?**  
A: Absolutely. Encrypted upload/download, processed in isolation, deleted after 24 hours.

## Next Steps

🎯 **Try More Services**
- [Documentation Generator](https://finishthisidea.com/services/documentation) - $3
- [API Generator](https://finishthisidea.com/services/api) - $5
- [Test Generator](https://finishthisidea.com/services/tests) - $4

📚 **Learn More**
- [API Documentation](/docs/api) - Integrate with your workflow
- [Template System](/docs/templates) - Create custom services
- [Best Practices](/docs/best-practices) - Get the most out of FTI

💬 **Join the Community**
- [Discord](https://discord.gg/finishthisidea) - Chat with other developers
- [GitHub](https://github.com/finishthisidea) - Contribute to the project
- [Twitter](https://twitter.com/finishthisidea) - Latest updates

## Troubleshooting

### Upload Issues
- **File too large**: Split into smaller archives
- **Invalid format**: Use .zip or .tar.gz only
- **Network timeout**: Try smaller file or better connection

### Processing Issues
- **Stuck processing**: Contact support@finishthisidea.com
- **Partial results**: Check the error report for skipped files
- **Unexpected changes**: Use Tinder interface for more control

### Download Issues
- **Link expired**: Links valid for 24 hours, contact support
- **Corrupted file**: We'll regenerate it for free
- **Missing files**: Check the processing report

## Get Help

- 📧 Email: support@finishthisidea.com
- 💬 Discord: [Join our server](https://discord.gg/finishthisidea)
- 📚 Docs: [Full documentation](https://docs.finishthisidea.com)
- 🐛 Issues: [GitHub Issues](https://github.com/finishthisidea/issues)

---

Ready to clean up your code? [Start now](https://finishthisidea.com) - first cleanup is just $1! 🚀