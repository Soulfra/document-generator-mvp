# Character and Action Layer Symlinks

## Overview

This document describes the symlink structure created for the character layer and action layer components in the Document Generator project.

## Symlink Structure

All symlinks are created in the `/ai-os-clean` directory to provide a clean, organized structure for the layered architecture.

### Character Layer (`/ai-os-clean/character-layer/`)

The character layer contains 19 symlinked files:

#### Core Character Systems
- `character-system-max.js` - Main character system implementation
- `character-brain-bash.js` - Character brain processing system
- `character-instances-layer.js` - Character instance management

#### Character Execution
- `execute-character-system.js` - Character system executor
- `execute-character-brain-bash.js` - Character brain executor
- `bash-through-characters.js` - Character bash integration
- `character-execution-specialization.js` - Specialized character execution

#### Character Utilities
- `character-bash-templates.js` - Bash templates for characters
- `character-narrate-system.js` - Character narration system
- `unified-character-tool.js` - Unified character tooling

#### Advanced Features
- `character-emergence-pipeline.js` - Character emergence pipeline
- `conductor-character.js` - Character conductor system
- `cal-character-layer.js` - CAL character integration

#### Visual/Mascot Systems
- `ascii-character-skin-layer.js` - ASCII character visuals
- `mascot-character-dimensional-spam-bash.js` - Mascot character system
- `character-mascot-weapon-system.html` - Character weapon system UI
- `frontyard-sports-character-creator.html` - Sports character creator UI

#### Web Interface Integration
- `web-interface-advanced-character-layer.js` - Advanced character layer from web-interface

### Action Layer (`/ai-os-clean/action-layer/`)

The action layer contains 3 symlinked files:

- `template-action-system.js` - Template-based action system
- `tool-collapse-subagent-action-simp-tag-integration.js` - Integrated action system
- `index.js` - Action layer index file

## Index Files

Both layers include auto-generated `index.js` files that provide easy module access:

- `/ai-os-clean/character-layer/index.js` - Exports all character layer modules
- `/ai-os-clean/action-layer/index.js` - Exports all action layer modules

## Usage

To use these layers in your code:

```javascript
// Import entire character layer
const characterLayer = require('./ai-os-clean/character-layer');

// Import specific character module
const { characterSystem } = require('./ai-os-clean/character-layer');

// Import action layer
const actionLayer = require('./ai-os-clean/action-layer');
```

## Maintenance

The symlinks were created using the `create-character-action-symlinks.js` script. To recreate or update the symlinks:

```bash
node create-character-action-symlinks.js
```

## Architecture Benefits

1. **Clean Organization**: All character and action files are organized in dedicated directories
2. **Easy Discovery**: Index files provide centralized access to all modules
3. **Maintainability**: Symlinks allow files to remain in their original locations while providing organized access
4. **Scalability**: New character or action files can be easily added to the symlink structure

## Related Documentation

- See `CLAUDE.md` for overall project architecture
- See `SYMLINK-ARCHITECTURE.md` for the complete symlink system design
- See individual file headers for specific component documentation