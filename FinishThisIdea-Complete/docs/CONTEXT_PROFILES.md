# Context Profiles Documentation

## Overview

Context Profiles are a powerful feature in FinishThisIdea that allows you to customize how the AI cleans and organizes your code. By using JSON-based profiles, you can define coding standards, style preferences, and AI behavior for different projects or languages.

## What is a Context Profile?

A Context Profile is a comprehensive configuration that includes:
- **Coding style preferences** (indentation, quotes, semicolons, etc.)
- **Naming conventions** for variables, functions, and files
- **Import organization** rules
- **AI behavior customization** (tone, priorities, patterns to avoid/prefer)
- **Framework-specific settings** (React, Vue, Angular, etc.)
- **Quality thresholds** and requirements

## Default Profiles

FinishThisIdea comes with several pre-configured profiles:

### 1. JavaScript Standard (`js-standard`)
- Modern ES6+ style guide
- 2 spaces indentation, no semicolons
- Single quotes, ES5 trailing commas
- Focus on readability and functional programming

### 2. TypeScript Strict (`ts-strict`)
- Strict type safety focus
- 2 spaces indentation, with semicolons
- Single quotes, all trailing commas
- Emphasis on null safety and exhaustive type checking

### 3. Python PEP 8 (`python-pep8`)
- Follows PEP 8 conventions
- 4 spaces indentation
- Snake_case naming
- Focus on Pythonic idioms

### 4. React Modern (`react-modern`)
- Functional components and hooks
- Component file naming in PascalCase
- Optimized for React 18+
- Performance and accessibility focus

## Using Profiles

### 1. Via Web Upload (Simple)
```javascript
// Include profileId in FormData when uploading
const formData = new FormData();
formData.append('file', zipFile);
formData.append('profileId', 'js-standard'); // Use a default profile

fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

### 2. Via Job Creation API
```javascript
// POST /api/jobs
{
  "uploadId": "uuid-here",
  "type": "cleanup",
  "profileId": "ts-strict",  // Use a specific profile
  "options": {
    "removeComments": false,
    "formatCode": true
  }
}
```

### 3. With Custom Profile (Inline)
```javascript
// POST /api/jobs
{
  "uploadId": "uuid-here",
  "type": "cleanup",
  "customProfile": {
    "name": "My Custom Style",
    "description": "Company coding standards",
    "style": {
      "indentation": "tabs",
      "indentSize": 1,
      "semicolons": true,
      // ... other style settings
    },
    "rules": {
      // ... naming and import rules
    }
  }
}
```

## Profile API Endpoints

### List Available Profiles
```http
GET /api/profiles
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "js-standard",
      "name": "JavaScript Standard",
      "description": "...",
      "language": "javascript",
      "isDefault": true
    },
    // ... more profiles
  ]
}
```

### Get Profile Suggestion
```http
GET /api/profiles/suggest?language=javascript&framework=react
```

### Get Specific Profile
```http
GET /api/profiles/:id
```

### Create Custom Profile
```http
POST /api/profiles
Content-Type: application/json

{
  "name": "My Team Style",
  "description": "Our team's coding standards",
  "language": "typescript",
  "style": {
    "indentation": "spaces",
    "indentSize": 4,
    // ... complete style configuration
  },
  "rules": {
    // ... complete rules configuration
  },
  "aiContext": {
    "tone": "professional",
    "priorities": ["maintainability", "readability"]
  }
}
```

### Update Profile
```http
PUT /api/profiles/:id
```

### Delete Profile
```http
DELETE /api/profiles/:id
```

### Clone Profile
```http
POST /api/profiles/:id/clone
Content-Type: application/json

{
  "name": "My Modified Version"
}
```

### Export Profile
```http
GET /api/profiles/:id/export
```

### Import Profile
```http
POST /api/profiles/import
Content-Type: application/json

{
  "json": "{... exported profile JSON ...}"
}
```

## Creating Custom Profiles

### Profile Structure

```typescript
interface ContextProfile {
  id: string;
  name: string;
  description: string;
  language?: string;
  framework?: string;
  
  style: {
    indentation: 'spaces' | 'tabs';
    indentSize: number;
    lineEnding: 'lf' | 'crlf' | 'auto';
    quoteStyle: 'single' | 'double' | 'auto';
    semicolons: boolean;
    trailingComma: 'none' | 'es5' | 'all';
    bracketSpacing: boolean;
    arrowParens: 'always' | 'avoid';
    maxLineLength?: number;
  };
  
  rules: {
    naming: {
      functions: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
      variables: 'camelCase' | 'snake_case' | 'PascalCase' | 'CONSTANT_CASE';
      constants: 'UPPER_SNAKE' | 'camelCase' | 'PascalCase';
      classes: 'PascalCase' | 'snake_case';
      interfaces?: 'PascalCase' | 'IPascalCase';
      files: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';
    };
    imports: {
      orderBy: 'alphabetical' | 'grouped' | 'custom';
      groups?: string[];
      removeUnused: boolean;
      addMissing: boolean;
      preferRelative: boolean;
    };
    comments: {
      style: 'line' | 'block' | 'jsdoc';
      requireForPublicApi: boolean;
      removeRedundant: boolean;
      preserveTodos: boolean;
    };
  };
  
  aiContext: {
    systemPrompt?: string;
    additionalContext?: string;
    tone: 'professional' | 'casual' | 'educational' | 'concise';
    priorities: string[];
    avoidPatterns?: string[];
    preferredPatterns?: string[];
    exampleCode?: string;
    focusAreas?: string[];
  };
}
```

### Example: Custom Enterprise Java Profile

```json
{
  "name": "Enterprise Java Standards",
  "description": "Corporate Java development standards",
  "language": "java",
  "style": {
    "indentation": "spaces",
    "indentSize": 4,
    "lineEnding": "lf",
    "quoteStyle": "double",
    "semicolons": true,
    "trailingComma": "none",
    "bracketSpacing": true,
    "arrowParens": "always",
    "maxLineLength": 120
  },
  "rules": {
    "naming": {
      "functions": "camelCase",
      "variables": "camelCase",
      "constants": "UPPER_SNAKE",
      "classes": "PascalCase",
      "interfaces": "IPascalCase",
      "files": "PascalCase"
    },
    "imports": {
      "orderBy": "grouped",
      "groups": ["java", "javax", "org", "com", "internal"],
      "removeUnused": true,
      "addMissing": false,
      "preferRelative": false
    },
    "comments": {
      "style": "jsdoc",
      "requireForPublicApi": true,
      "removeRedundant": true,
      "preserveTodos": true
    }
  },
  "aiContext": {
    "tone": "professional",
    "priorities": ["maintainability", "enterprise-patterns", "thread-safety"],
    "avoidPatterns": ["System.out.println", "raw types", "public fields"],
    "preferredPatterns": ["dependency injection", "builder pattern", "immutable objects"],
    "focusAreas": ["error-handling", "logging", "documentation"]
  }
}
```

## AI Behavior Customization

The `aiContext` section allows you to customize how the AI interprets and cleans your code:

### System Prompt
Provide a custom instruction that overrides the default AI behavior:
```json
"systemPrompt": "You are a React performance expert. Focus on optimizing renders and reducing bundle size."
```

### Priorities
Define what aspects the AI should focus on:
```json
"priorities": ["performance", "accessibility", "code-splitting", "type-safety"]
```

### Pattern Control
Specify patterns to avoid or prefer:
```json
"avoidPatterns": ["var", "console.log", "any", "!important"],
"preferredPatterns": ["const/let", "logger", "specific types", "CSS modules"]
```

### Focus Areas
Direct the AI's attention to specific concerns:
```json
"focusAreas": ["security", "error-boundaries", "memory-leaks", "api-optimization"]
```

## Framework-Specific Settings

### React Configuration
```json
"frameworkConfig": {
  "react": {
    "componentStyle": "functional",
    "hooksRules": true,
    "propTypesOrTypeScript": "typescript"
  }
}
```

### Vue Configuration
```json
"frameworkConfig": {
  "vue": {
    "apiStyle": "composition",
    "scriptSetup": true
  }
}
```

### Node.js Configuration
```json
"frameworkConfig": {
  "node": {
    "moduleSystem": "esm",
    "asyncStyle": "async-await"
  }
}
```

## Profile Usage Tracking

Profiles track their usage count, helping you identify the most popular configurations. This data is available when listing profiles and can help teams standardize on common patterns.

## Best Practices

1. **Start with Default Profiles**: Use the built-in profiles as a starting point and customize as needed.

2. **Team Standardization**: Create team-specific profiles and share them using the export/import functionality.

3. **Language-Specific Profiles**: Create different profiles for different languages in polyglot projects.

4. **Project-Specific Overrides**: Use inline custom profiles for one-off projects with unique requirements.

5. **Version Control**: Export your custom profiles and commit them to version control for team sharing.

6. **Incremental Refinement**: Start with basic style rules and gradually add more specific patterns as you identify them.

## Troubleshooting

### Profile Not Applied
- Ensure the profileId is correct
- Check that the profile exists (use GET /api/profiles to list)
- Verify the job input contains the profileId

### Unexpected Formatting
- Review the profile's style settings
- Check if conflicting rules exist
- Use a more specific profile for your framework

### Custom Profile Validation Errors
- Ensure all required fields are provided
- Check that enum values are valid (e.g., 'camelCase' not 'camel-case' for naming)
- Validate JSON syntax if importing

## Future Enhancements

- Profile inheritance (base profiles with overrides)
- Team profile sharing marketplace
- Auto-detection of optimal profile based on code analysis
- Profile versioning and history
- A/B testing different profiles for optimal results