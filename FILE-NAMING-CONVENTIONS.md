# 📁 File Naming Conventions & Standards
*A Comprehensive Guide to Consistent File Organization in Document Generator*

## 🎯 Purpose

This document establishes file naming standards to:
- Prevent duplicate files and name collisions
- Make files easily discoverable and searchable
- Maintain consistency across the entire codebase
- Track lineage and deprecation properly
- Support the modular, reproducible architecture

## 📋 General Naming Rules

### 1. Case Conventions
- **UPPER-KEBAB-CASE**: Documentation, configs, and important system files
  - Examples: `README.md`, `CHANGELOG.md`, `FILE-NAMING-CONVENTIONS.md`
  - Use for: Top-level docs, system-wide configs, architectural decisions
  
- **lower-kebab-case**: Source code files and regular documentation
  - Examples: `ship-component-generator.js`, `auth-service.js`
  - Use for: JavaScript, TypeScript, service files, utilities
  
- **PascalCase**: Component files (React/Vue) and class-based files
  - Examples: `ShipBuilder.jsx`, `DocumentParser.ts`
  - Use for: UI components, class definitions

### 2. Allowed Characters
- ✅ Letters (a-z, A-Z)
- ✅ Numbers (0-9) 
- ✅ Hyphens (-) for word separation
- ✅ Dots (.) for file extensions only
- ✅ Underscores (_) ONLY for special system files
- ❌ NO spaces
- ❌ NO special characters (!@#$%^&*()+={}[]|\\:;"'<>,?/)

### 3. File Name Structure
```
[prefix]-[descriptive-name]-[suffix].[extension]

Examples:
- test-ship-component.js
- util-file-parser.js
- config-database.json
- deprecated-old-system.js
```

## 🏗️ Directory Structure Standards

### Top-Level Directories
```
Document-Generator/
├── docs/                      # All documentation
├── scripts/                   # Executable scripts
├── config/                    # Configuration files
├── services/                  # Service modules
├── components/               # Reusable components
├── templates/                # Template files
├── tests/                    # Test files
├── generated-*/              # Generated output (gitignored)
├── tier-1/                   # Ephemeral layer
├── tier-2/                   # Working layer
├── tier-3/                   # Permanent/Meta layer
└── archive/                  # Deprecated but preserved
```

### Feature-Based Organization
Group by feature, not file type:
```
ship-components/
├── ship-component-generator.js
├── ship-component-3d-renderer.js
├── ship-component-tests.js
├── ship-component-docs.md
└── ship-component-config.json
```

## 📝 File Type Specific Conventions

### JavaScript/TypeScript Files
```
Pattern: [action]-[subject]-[modifier].js

Examples:
- generate-ship-component.js      # Action-focused
- ship-component-generator.js     # Subject-focused
- validate-user-input.js          # Utility
- index.js                        # Entry points only
```

### Documentation Files
```
Pattern: [CATEGORY]-[TOPIC]-[TYPE].md

Examples:
- README.md                       # Standard readme
- SHIPREKT-WORLD-ARCHAEOLOGICAL-RECORD.md  # Project documentation
- API-USER-GUIDE.md              # API documentation
- CHANGELOG.md                    # Version history
```

### Configuration Files
```
Pattern: [scope].[type].[environment].json

Examples:
- config.json                     # Base config
- config.development.json         # Environment specific
- ship-components.config.json     # Feature specific
- .env.example                    # Environment template
```

### Test Files
```
Pattern: [tested-file].test.js or test-[feature].js

Examples:
- ship-component-generator.test.js
- test-integration-shipyard.js
- e2e-ship-building.test.js
```

## 🔄 Versioning & Deprecation

### Version Control Strategy
- **Use Git for versioning** - NOT file names
- **Branch names**: `feature/ship-components`, `fix/rendering-bug`
- **Tag releases**: `v1.0.0-shiprekt`, `v2.1.0-crafting`

### Deprecation Process
1. **Mark as deprecated**: Add `.deprecated` suffix
   ```
   old-system.js → old-system.deprecated.js
   ```

2. **Add deprecation notice**: At file top
   ```javascript
   /**
    * @deprecated Since v2.0.0 - Use ship-component-generator.js instead
    * @removal-date 2025-03-01
    * @migration-guide docs/migration/old-to-new-system.md
    */
   ```

3. **Archive after grace period**: Move to `/archive/YYYY-MM/`

## 🚫 Duplicate Prevention

### Before Creating Any File:
1. **Search existing files**:
   ```bash
   # Check for similar names
   find . -name "*ship*component*" -type f
   
   # Search for similar functionality
   grep -r "ship.*component" --include="*.js"
   ```

2. **Check the file registry** (when implemented):
   ```bash
   node file-registry-system.js check "new-file-name.js"
   ```

3. **Review related features**: Check if functionality exists elsewhere

### Name Collision Resolution
If similar file exists:
1. **Extend existing file** if same feature
2. **Use specific modifier** if different aspect:
   ```
   ship-component-generator.js          # Base generator
   ship-component-generator-3d.js       # 3D specific
   ship-component-generator-ascii.js    # ASCII specific
   ```

## 🏷️ Naming Prefixes & Suffixes

### Standard Prefixes
- `test-` : Test files
- `util-` : Utility functions
- `config-` : Configuration files
- `service-` : Service modules
- `component-` : Reusable components
- `interface-` : UI interfaces
- `api-` : API related files
- `db-` : Database related
- `auth-` : Authentication related

### Standard Suffixes
- `-service` : Service classes
- `-controller` : Controllers
- `-model` : Data models
- `-view` : View components
- `-util` : Utilities
- `-helper` : Helper functions
- `-config` : Configuration
- `-types` : Type definitions
- `.deprecated` : Deprecated files
- `.backup` : Backup files

## 📊 Special Cases

### Generated Files
```
Pattern: generated-[purpose]/[timestamp]-[content].[ext]

Examples:
generated-ship-components/
├── 2025-01-13-093000-hull-components.json
├── 2025-01-13-093000-sail-components.json
└── manifest.json
```

### Temporary Files
```
Pattern: .tmp-[purpose]-[random].[ext]

Examples:
.tmp-processing-a3b2c1.json
.tmp-upload-x9y8z7.md
```

### System Files
- Start with dot: `.gitignore`, `.env`, `.eslintrc`
- Use underscores for Python: `__init__.py`, `__main__.py`
- Follow ecosystem conventions

## 🔍 File Discovery & Search

### Naming for Searchability
1. **Use descriptive words**: 
   - ❌ `sc-gen.js`
   - ✅ `ship-component-generator.js`

2. **Include feature context**:
   - ❌ `processor.js`
   - ✅ `document-to-ship-processor.js`

3. **Avoid abbreviations**:
   - ❌ `auth-svc.js`
   - ✅ `authentication-service.js`

## 📐 Implementation Guidelines

### Creating New Files
1. **Check naming conventions** (this document)
2. **Search for existing similar files**
3. **Verify with file registry** (when available)
4. **Follow the pattern for file type**
5. **Add to appropriate directory**
6. **Update relevant indexes/registries**

### Refactoring Existing Files
1. **Document the change** in CHANGELOG
2. **Create redirect/alias** if breaking change
3. **Update all imports**
4. **Add deprecation notice** to old location
5. **Set removal date** (minimum 30 days)

## 🎯 Examples by Feature

### ShipRekt Components
```
ship-components/
├── ship-component-generator.js
├── ship-component-3d-renderer.js
├── ship-component-materials.js
├── ship-component-gacha.js
├── SHIP-COMPONENT-SPECIFICATION.md
├── ship-components.config.json
└── tests/
    ├── ship-component-generator.test.js
    └── ship-component-3d-renderer.test.js
```

### Natural Language to 3D Pipeline
```
nl-to-3d/
├── natural-language-parser.js
├── concept-extractor.js
├── model-generator.js
├── texture-mapper.js
├── NL-TO-3D-PIPELINE-SPEC.md
├── nl-to-3d.config.json
└── examples/
    ├── text-to-ship.example.js
    └── document-to-world.example.js
```

## 📋 Quick Reference Checklist

Before naming a file, ensure:
- [ ] Uses correct case convention
- [ ] No spaces or special characters
- [ ] Descriptive and searchable
- [ ] Follows type-specific pattern
- [ ] No similar files exist
- [ ] In correct directory
- [ ] Includes appropriate prefix/suffix
- [ ] Not abbreviated unnecessarily

## 🔄 Living Document

This convention guide is a living document. Updates require:
1. Discussion in team/PR
2. Update this document
3. Announce changes
4. Grace period for compliance
5. Automated tooling updates

---

*Last Updated: 2025-01-13*
*Version: 1.0.0*

**Remember: Good naming is self-documenting code!**