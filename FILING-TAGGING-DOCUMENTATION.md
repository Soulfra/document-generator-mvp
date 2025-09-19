# Filing & Tagging System Documentation

## 🎨 Paint-by-Numbers Color Coding System

The Document Generator uses a sophisticated color-coding system inspired by Habbo Hotel and Unix timestamps to organize and visualize system state.

## 🌈 Color Status System

### Database Schema (from `migrations/add-color-status-to-users.sql`)

```sql
-- Color status fields in unified_users table
color_status VARCHAR(20) DEFAULT 'offline'     -- User state
color_hex VARCHAR(7) DEFAULT '#FF0000'         -- Visual color
last_activity_unix BIGINT DEFAULT 0            -- Unix timestamp (ms)
days_since_epoch INTEGER DEFAULT 0             -- Days since 1970-01-01
motto VARCHAR(255)                             -- Encoded messages
```

### Color Mappings

| Status | Color | Hex Code | Meaning | System Behavior |
|--------|-------|----------|---------|-----------------|
| online | Green | #00FF00 | Active, available | Full access, real-time updates |
| away | Yellow | #FFFF00 | Semi-active | Delayed updates, cached responses |
| offline | Red | #FF0000 | Inactive | No real-time features |
| newUser | Cyan | #00FFFF | Recently joined | Tutorial mode, extra guidance |
| premium | Gold | #FFD700 | Paid subscriber | Enhanced features, priority routing |
| inactive | Gray | #808080 | Long absence | Archived, cleanup candidate |
| epoch | Black | #000000 | System/special | Mason (Unix epoch user) |

### Special Users

- **Mason**: The legendary Unix epoch user (created at 1970-01-01 00:00:00)
  - Represents system origin point
  - Used for time calculations
  - Has special permissions

## 📁 Document Filing System

### Filing Categories

1. **By Environment Context**
   ```
   /context-profiles/
   ├── dev/          # High experimentation, verbose logging
   ├── staging/      # Balanced testing environment
   ├── prod/         # Strict security, minimal logging
   └── remote/       # Network-optimized settings
   ```

2. **By System Layer**
   ```
   /tier-3/          # Meta-architectures (permanent)
   /tier-2/          # Working services (regeneratable)
   /tier-1/          # Generated output (ephemeral)
   ```

3. **By Document Type**
   ```
   /templates/       # Reusable components
   /generated-mvps/  # Output from document processing
   /archives/        # Historical versions
   /audit-trails/    # Compliance records
   ```

## 🏷️ Tagging System Architecture

### Tag Hierarchy

```javascript
const tagHierarchy = {
  // System tags (highest priority)
  system: ['critical', 'security', 'audit', 'compliance'],
  
  // Environment tags
  environment: ['dev', 'staging', 'prod', 'remote'],
  
  // Status tags  
  status: ['active', 'archived', 'deprecated', 'experimental'],
  
  // Category tags
  category: ['gaming', 'crypto', 'auth', 'ui', 'backend'],
  
  // Performance tags
  performance: ['optimized', 'slow', 'needs-work', 'critical-path'],
  
  // Access tags
  access: ['public', 'private', 'restricted', 'admin-only']
};
```

### Tag Broadcasting System

While no explicit "flag-tag-system.js" was found, the tagging concept is implemented through several mechanisms:

1. **Event Bus Tags** (via Integration Event Bus)
   ```javascript
   // Events are tagged for routing
   eventBus.emit('document:processed', {
     tags: ['gaming', 'experimental', 'high-priority'],
     data: processedDocument
   });
   ```

2. **Service Registry Tags**
   ```javascript
   // Services tagged with capabilities
   serviceRegistry.register('ai-service', {
     tags: ['ai', 'experimental', 'resource-heavy'],
     stability: 'beta'
   });
   ```

3. **Audit Trail Tags**
   ```javascript
   // Actions tagged for compliance
   auditLogger.log({
     action: 'document-access',
     tags: ['security', 'compliance', 'user-data'],
     userId: user.id
   });
   ```

## 🎯 Visual Organization Patterns

### Color-Coded Filing

Documents and services are visually organized by their operational status:

```javascript
function getFileColor(file) {
  if (file.isActive && file.recentlyModified) return '#00FF00'; // Green
  if (file.isActive && !file.recentlyModified) return '#FFFF00'; // Yellow
  if (!file.isActive) return '#FF0000'; // Red
  if (file.isExperimental) return '#FF00FF'; // Magenta
  if (file.isArchived) return '#808080'; // Gray
  return '#FFFFFF'; // White (default)
}
```

### Registry Systems

1. **Service Registry** - Tracks all active services with health status
2. **Model Registry** - Available AI models and their capabilities
3. **Template Registry** - Reusable document templates
4. **Character Registry** - User profiles and their settings

## 🔄 Dynamic Tagging Workflow

### Automatic Tag Assignment

```javascript
class AutoTagger {
  async tagDocument(document) {
    const tags = [];
    
    // Content-based tags
    if (document.content.includes('game')) tags.push('gaming');
    if (document.content.includes('crypto')) tags.push('blockchain');
    if (document.content.includes('auth')) tags.push('security');
    
    // Metadata-based tags
    if (document.size > 1000000) tags.push('large-file');
    if (document.created < Date.now() - 30*24*60*60*1000) tags.push('old');
    
    // AI-based tags (if available)
    const aiTags = await this.aiService.analyzeTags(document);
    tags.push(...aiTags);
    
    return [...new Set(tags)]; // Remove duplicates
  }
}
```

### Tag-Based Access Control

```javascript
function canAccessDocument(user, document) {
  const userTags = getUserTags(user);
  const docTags = document.tags;
  
  // Check restricted tags
  if (docTags.includes('admin-only') && !userTags.includes('admin')) {
    return false;
  }
  
  // Check environment tags
  if (docTags.includes('prod') && user.environment !== 'prod') {
    return false;
  }
  
  return true;
}
```

## 🗂️ Filing System Integration

### With Character Settings

Filing and tagging respect character personality:

```javascript
function getVisibleFiles(character) {
  let files = getAllFiles();
  
  // Filter by experimentation level
  if (character.personality.experimentation === 'disabled') {
    files = files.filter(f => !f.tags.includes('experimental'));
  }
  
  // Filter by security level
  if (character.constraints.securityChecks === 'paranoid') {
    files = files.filter(f => f.tags.includes('audited'));
  }
  
  return files;
}
```

### With Token Economy

Access to certain tags costs tokens:

```javascript
const tagCosts = {
  'premium': 100,      // Premium content
  'experimental': 50,  // Beta features
  'priority': 25,      // Priority processing
  'public': 0          // Free access
};

function calculateAccessCost(document) {
  return document.tags.reduce((cost, tag) => {
    return cost + (tagCosts[tag] || 0);
  }, 0);
}
```

## 📊 Habbo-Style Mottos

The motto field allows encoded messages and status indicators:

### Motto Patterns
- `*Z motion*` - Sleeping/AFK status
- `¬` - Minimal presence
- `]` - Away but monitoring
- `achromatic` - Premium colorless theme
- Custom encoded messages for agent communication

### Usage Example
```javascript
function updateUserMotto(user, status) {
  const mottoMap = {
    'busy': '!DND!',
    'trading': '$TRADE$',
    'gaming': '[GAME]',
    'coding': '<code/>',
    'available': '✓'
  };
  
  user.motto = mottoMap[status] || status;
  user.color_status = getStatusColor(status);
}
```

## 🎨 Visual Status Dashboard

The system can generate visual representations:

```html
<div class="user-status">
  <div class="status-indicator" style="background: ${user.color_hex}"></div>
  <span class="username">${user.username}</span>
  <span class="motto">${user.motto}</span>
  <span class="days-active">${user.days_since_epoch} days</span>
</div>
```

## 🔍 Tag Search & Discovery

### Search by Tags
```javascript
async function searchByTags(tags, operator = 'AND') {
  if (operator === 'AND') {
    // Must have all tags
    return documents.filter(doc => 
      tags.every(tag => doc.tags.includes(tag))
    );
  } else {
    // Must have at least one tag
    return documents.filter(doc => 
      tags.some(tag => doc.tags.includes(tag))
    );
  }
}
```

### Tag Recommendations
```javascript
function recommendTags(document, existingTags) {
  const related = {
    'gaming': ['3d', 'multiplayer', 'economy'],
    'crypto': ['blockchain', 'wallet', 'trading'],
    'auth': ['security', 'jwt', 'oauth']
  };
  
  const recommendations = [];
  existingTags.forEach(tag => {
    if (related[tag]) {
      recommendations.push(...related[tag]);
    }
  });
  
  return [...new Set(recommendations)];
}
```

## 🚀 Best Practices

1. **Use Semantic Tags** - Tags should describe content, not implementation
2. **Limit Tag Count** - 3-7 tags per item is optimal
3. **Hierarchical Organization** - Use parent-child tag relationships
4. **Color Consistency** - Maintain color meanings across the system
5. **Regular Cleanup** - Archive old tags and update deprecated ones
6. **Tag Validation** - Ensure tags follow naming conventions
7. **Performance** - Index frequently searched tags

---

*The Filing & Tagging System provides visual organization and semantic categorization throughout the Document Generator ecosystem, making content discoverable and access controllable.*