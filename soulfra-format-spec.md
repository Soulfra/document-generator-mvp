# .soulfra File Format Specification

## Overview
The `.soulfra` file format is a JSON-based configuration and state management system for the Soulfra platform. It handles session persistence, system revival, and configuration management.

## File Structure

### Basic Schema
```json
{
  "version": "1.0.0",
  "type": "revive_token | session_state | config_backup | system_export",
  "generated": "ISO 8601 timestamp",
  "id": "unique_identifier",
  "metadata": {
    "generator": "system_component",
    "purpose": "intended_use",
    "tier": "FREE | PAID | ENTERPRISE"
  },
  "data": {
    // Type-specific data structure
  },
  "signature": "base64_encoded_verification"
}
```

## File Types

### 1. Revive Token (`revive_token`)
Used to restore decaying systems back to full health.

```json
{
  "version": "1.0.0",
  "type": "revive_token",
  "generated": "2025-01-20T12:34:56.789Z",
  "id": "soulfra_1737377696789_abc123def",
  "metadata": {
    "generator": "revive-decay-system",
    "purpose": "system_revival",
    "tier": "FREE"
  },
  "revive": {
    "systems": [
      {
        "id": "auth-vault",
        "name": "Auth Vault Wormhole",
        "decay_level": 25.5,
        "revival_amount": 100
      }
    ],
    "timestamp": 1737377696789,
    "expiry": 1737464096789
  },
  "signature": "eyJoYXNoIjoiYWJjMTIzIiwidGltZXN0YW1wIjoxNzM3Mzc3Njk2Nzg5fQ=="
}
```

### 2. Session State (`session_state`)
Preserves user session data and authentication state.

```json
{
  "version": "1.0.0",
  "type": "session_state",
  "generated": "2025-01-20T12:34:56.789Z",
  "id": "session_1737377696789_xyz789",
  "metadata": {
    "generator": "auth-system",
    "purpose": "session_backup",
    "tier": "FREE"
  },
  "session": {
    "user_id": "anonymous_1737377696789",
    "auth_method": "free_tier",
    "permissions": ["voxel", "squash", "mvp", "wormhole"],
    "contract_type": "none",
    "created": 1737377696789,
    "expires": 1737464096789,
    "decay_resistance": 30
  },
  "signature": "base64_encoded_session_hash"
}
```

### 3. Config Backup (`config_backup`)
Backs up system configuration and settings.

```json
{
  "version": "1.0.0",
  "type": "config_backup",
  "generated": "2025-01-20T12:34:56.789Z",
  "id": "config_1737377696789_cfg456",
  "metadata": {
    "generator": "system-config",
    "purpose": "backup_restore",
    "tier": "FREE"
  },
  "config": {
    "systems_enabled": ["auth", "economy", "revive"],
    "decay_rates": {
      "auth-vault": 0.5,
      "agent-economy": 0.8,
      "stripe-api": 0.3
    },
    "revival_settings": {
      "auto_revive": false,
      "max_decay_before_alert": 20,
      "revive_cooldown": 300
    },
    "ui_preferences": {
      "theme": "dark",
      "animations": true,
      "sound_effects": false
    }
  },
  "signature": "base64_encoded_config_hash"
}
```

### 4. System Export (`system_export`)
Complete system state export for migration or backup.

```json
{
  "version": "1.0.0",
  "type": "system_export",
  "generated": "2025-01-20T12:34:56.789Z",
  "id": "export_1737377696789_exp999",
  "metadata": {
    "generator": "export-system",
    "purpose": "full_backup",
    "tier": "FREE"
  },
  "export": {
    "systems": [
      {
        "id": "auth-vault",
        "config": {},
        "state": "healthy",
        "decay": 100,
        "last_active": 1737377696789
      }
    ],
    "user_data": {
      "sessions": [],
      "preferences": {},
      "contracts": []
    },
    "platform_state": {
      "version": "1.0.0",
      "deployment": "free-tier",
      "uptime": 86400
    }
  },
  "signature": "base64_encoded_export_hash"
}
```

## Usage Patterns

### Creating .soulfra Files
```javascript
// Create revive token
const reviveToken = {
  version: "1.0.0",
  type: "revive_token",
  generated: new Date().toISOString(),
  id: `soulfra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  metadata: {
    generator: "revive-decay-system",
    purpose: "system_revival",
    tier: "FREE"
  },
  revive: {
    systems: getDecayingSystems(),
    timestamp: Date.now(),
    expiry: Date.now() + (24 * 60 * 60 * 1000)
  },
  signature: btoa(JSON.stringify({
    hash: computeHash(data),
    timestamp: Date.now()
  }))
};

// Save to file
const blob = new Blob([JSON.stringify(reviveToken, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `revive_${Date.now()}.soulfra`;
a.click();
```

### Loading .soulfra Files
```javascript
// Handle file drop/upload
function processSoulfraFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Validate format
      if (!validateSoulfraFormat(data)) {
        throw new Error('Invalid .soulfra format');
      }
      
      // Process based on type
      switch (data.type) {
        case 'revive_token':
          processReviveToken(data);
          break;
        case 'session_state':
          restoreSession(data);
          break;
        case 'config_backup':
          restoreConfig(data);
          break;
        case 'system_export':
          importSystemState(data);
          break;
      }
    } catch (err) {
      console.error('Failed to process .soulfra file:', err);
    }
  };
  reader.readAsText(file);
}
```

## File Naming Conventions

- **Revive Tokens**: `revive_TIMESTAMP.soulfra`
- **Session Backups**: `session_USERNAME_TIMESTAMP.soulfra`
- **Config Backups**: `config_SYSTEM_TIMESTAMP.soulfra`
- **System Exports**: `export_FULL_TIMESTAMP.soulfra`

## Security Considerations

1. **Signature Verification**: All .soulfra files include a signature field for integrity verification
2. **Expiry Timestamps**: Time-sensitive files include expiry times
3. **Tier Restrictions**: Metadata includes tier information for access control
4. **Hash Validation**: Critical data includes hash verification

## Integration Points

### With Free Tier Collapse
- Automatically generates session_state .soulfra when user selects FREE access
- Stores contract preferences for later reference

### With Revive System
- Creates revive_token .soulfra files when systems decay
- Processes dropped .soulfra files to restore system health

### With Auth System
- Backs up authentication state in session_state format
- Restores login status from .soulfra files

### With Export/Import
- Full system backup using system_export format
- Migration between deployments via .soulfra files

## File Association

Register .soulfra files with the browser/OS:
```javascript
// MIME type registration
{
  "mime_type": "application/x-soulfra",
  "extension": ".soulfra",
  "description": "Soulfra State File",
  "icon": "soulfra-icon.png"
}
```

## Version Compatibility

- **1.0.0**: Initial format specification
- Future versions will maintain backward compatibility
- Version field allows for format evolution