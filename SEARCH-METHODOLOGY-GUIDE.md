# Comprehensive Search Methodology Guide

## 🔍 Purpose
This guide documents the systematic approach for searching through the Document Generator codebase to understand integration patterns, find hidden connections, and map the complete system architecture.

## 📋 Search Strategy Layers

### 1. **Filename Pattern Searches**
```bash
# UPPERCASE patterns (system-critical files)
find . -name "*.js" | grep -E "[A-Z]{3,}"

# Hyphenated patterns (integration bridges)
find . -name "*-*-*.js"

# CamelCase patterns (class/service files)  
find . -name "[A-Z][a-z]*[A-Z]*.js"

# Special suffixes indicating role
find . -name "*-bridge.js"
find . -name "*-mapper.js"
find . -name "*-transformer.js"
find . -name "*-orchestrator.js"
```

### 2. **Content Pattern Searches**
```bash
# Encoding/decoding patterns
grep -r "encode\|decode\|transform\|convert" --include="*.js"

# Layer references
grep -r "layer\|tier\|level\|depth" --include="*.js"

# Integration keywords
grep -r "bridge\|connect\|link\|integrate" --include="*.js"

# Character/identity patterns
grep -r "identity\|character\|codename\|persona" --include="*.js"
```

### 3. **Cross-Reference Tracking**
```javascript
// Import/require patterns to trace
const importPatterns = [
  /require\(['"](.+)['"]\)/g,
  /import .+ from ['"](.+)['"]/g,
  /import\(['"](.+)['"]\)/g
];

// Symlink patterns
const symlinkPatterns = [
  /symlink.*['"](.+)['"]/g,
  /readlink.*['"](.+)['"]/g,
  /\/tier-[0-9]\//g
];
```

### 4. **XML Mapping Searches**
```bash
# Find all XML files
find . -name "*.xml"

# Search for specific XML patterns
grep -r "<transformation>" --include="*.xml"
grep -r "<layerMapping>" --include="*.xml"
grep -r "<reversibilityProof>" --include="*.xml"

# Find XML references in JS files
grep -r "\.xml" --include="*.js"
```

### 5. **Database & Schema Searches**
```sql
-- Schema patterns to look for
-- identity tables
-- encoding_mappings
-- layer_access
-- character_transformations
```

## 🎯 Search Methodology by Goal

### **Finding Integration Points**
1. Start with orchestrator files
2. Trace their imports/requires
3. Follow bridge connections
4. Map cross-system references

### **Understanding Encoding Chains**
1. Find transformer files
2. Identify input/output formats
3. Trace transformation pipeline
4. Verify reversibility proofs

### **Mapping Character Systems**
1. Search for identity generators
2. Find codename mappings
3. Trace context switches
4. Map layer access controls

### **Discovering Hidden Features**
1. Look for TODO/FIXME comments
2. Search for console.log debugging
3. Find commented-out code blocks
4. Check for experimental features

## 📊 Search Result Documentation

### **Template for Findings**
```markdown
## Component: [Name]
- **File**: path/to/file.js
- **Purpose**: What it does
- **Connections**: What it links to
- **Status**: Working/Broken/Unknown
- **Tests**: Unit/Integration/E2E coverage
- **Dependencies**: Required components
```

### **Integration Map Format**
```
Component A ──[bridge]──> Component B
     │                         │
     └──[transform]──> Component C
```

## 🔧 Advanced Search Techniques

### **Regex Patterns for Deep Analysis**
```javascript
// Find emoji-to-color mappings
/['"]([^'"]+)['"]\s*:\s*['"]([🎮🎯🎲🎪🎭🎨])/g

// Find confidence scores
/confidence\s*[:=]\s*(0\.\d+|\d+)/g

// Find layer definitions
/layer\s*[:=]\s*(\d+|['"][^'"]+['"])/g
```

### **Multi-File Pattern Matching**
```bash
# Find files that reference each other
for file in $(find . -name "*.js"); do
  basename=$(basename "$file" .js)
  grep -l "$basename" --include="*.js" -r . | grep -v "$file"
done
```

### **Dependency Graph Generation**
```bash
# Generate import/require graph
grep -r "require\|import" --include="*.js" | \
  sed 's/:.*require[(]['"]/\t/g' | \
  sed 's/['"]).*//' > dependency-graph.txt
```

## 🚨 Common Search Pitfalls

1. **Case Sensitivity**: Some systems use camelCase, others use snake_case
2. **Dynamic Imports**: Look for dynamic require/import patterns
3. **Indirect References**: Components may reference via configuration
4. **Symlinks**: Real files may be elsewhere in tier structure
5. **Generated Code**: Some files are auto-generated, check sources

## 📈 Search Optimization Tips

1. **Use `.gitignore` patterns** to exclude node_modules
2. **Create search aliases** for common patterns
3. **Cache search results** for large codebases
4. **Use parallel search** with `rg` (ripgrep) for speed
5. **Index codebase** with ctags for quick navigation

## 🎭 Special Search Contexts

### **Hollowtown Layer**
- Search for emoji patterns
- Look for spooky/halloween references
- Find circus/bozo contexts

### **Sailing/Maritime**
- Ocean/sea/wave patterns
- Navigation references
- Port/harbor systems

### **Identity/Character**
- Codename generators
- Context switches
- Layer access patterns

## 📋 Search Checklist

- [ ] Searched all filename patterns
- [ ] Searched content with key terms
- [ ] Traced import/require chains
- [ ] Found XML mappings
- [ ] Identified database schemas
- [ ] Documented integration points
- [ ] Created dependency graph
- [ ] Verified with test files

---

*This methodology ensures systematic discovery of all system components and their relationships.*