# Document Preview & Badge Generator Tools

Simple, standalone tools for visualizing documents, creating badges, and generating user manuals.

## 🚀 Quick Start

### 1. Open the Preview Tool
Simply open `document-preview.html` in your browser:
```bash
open document-preview.html
# or
google-chrome document-preview.html
```

### 2. View Document Preview
The tool automatically loads with a sample document. You can:
- 📑 **Document Preview** - See your document formatted nicely
- 🏆 **Badges & Certificates** - Generate achievement badges
- 📚 **User Manual** - Auto-generate a user manual
- 🔧 **JSON Structure** - View document as structured data

## 📄 Loading Your Own Documents

### Option 1: Use the Document Loader (Recommended)
```bash
# Generate a live preview from your markdown file
node document-loader.js test-document.md

# This creates document-preview-live.html with your content
open document-preview-live.html
```

### Option 2: Export to JSON
```bash
# Export document structure as JSON
node document-loader.js test-document.md --json

# Or generate both HTML and JSON
node document-loader.js test-document.md --all
```

## 🏆 Badge Generator

Analyze your documents and create visual badges:

```bash
# Analyze what badges your document has earned
node badge-generator.js analyze test-document.md

# Generate a specific badge
node badge-generator.js badge ai-powered

# Create an achievement certificate
node badge-generator.js certificate test-document.md

# Generate all badges as a collection
node badge-generator.js pack
```

### Available Badges
- 🤖 **AI-Powered** - Uses AI for intelligent automation
- 🚀 **MVP Ready** - Ready for rapid MVP development
- ⚡ **Rapid Deploy** - Deploy in under 30 minutes
- 📚 **Well Documented** - Comprehensive documentation included
- ✅ **Test Ready** - Includes test specifications
- 📈 **Scalable** - Built for growth and scale

## 🎨 Features

### Document Preview
- Clean, professional formatting
- Automatic section detection
- Feature highlighting
- Technical requirements display
- User stories and success criteria

### Badge System
- Visual badges with gradients and icons
- Export as images or HTML
- Achievement certificates
- Automatic badge earning based on content

### User Manual Generation
- Table of contents
- Getting started guide
- Feature documentation
- Technical setup instructions
- Troubleshooting section
- FAQ

### JSON Export
- Structured document representation
- MVP generation metadata
- Template suggestions
- Complexity assessment

## 📋 Example Workflow

1. **Write your document** in Markdown format
2. **Generate preview**: `node document-loader.js my-doc.md`
3. **Open in browser**: View all visualizations
4. **Check earned badges**: `node badge-generator.js analyze my-doc.md`
5. **Generate certificate**: `node badge-generator.js certificate my-doc.md`
6. **Export for sharing**: Use the export buttons in the UI

## 🛠️ Customization

### Adding New Badges
Edit `badge-generator.js` and add to the `badges` object:
```javascript
'custom-badge': {
    icon: '🌟',
    title: 'Custom Badge',
    description: 'Your custom achievement',
    colors: ['#color1', '#color2']
}
```

### Modifying Document Parser
Edit `document-loader.js` to customize how markdown is parsed and what sections are extracted.

### Styling Changes
All styles are embedded in the HTML files for easy customization. Modify the `<style>` sections as needed.

## 🖨️ Export Options

- **Print to PDF**: Use browser print function (Ctrl/Cmd+P)
- **Save badges**: Right-click and save images
- **Export JSON**: Built-in export button
- **Copy to clipboard**: JSON structure can be copied

## 💡 Tips

- The preview tool works entirely in the browser - no server needed
- All generated files are standalone and shareable
- Badges are resolution-independent (SVG format)
- User manuals are print-ready with proper formatting

## 🚫 No Dependencies Required

These tools are designed to work with just Node.js built-in modules. No npm install needed!

---

*Simple tools for turning documents into visual, shareable assets* 🎯