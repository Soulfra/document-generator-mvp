# 🎭 TEMPLATE LAYER CONSOLIDATION DOCUMENT

## The Template Layer Problem

As identified in the conversation: "this is where it gets so confusing because we had a template layer" - we keep creating new template layers that are essentially the same system wearing different costumes.

## 📋 Existing Template Systems Inventory

### 1. Template Mapping Layer (`template-mapping-layer.js`)
- **Purpose**: Maps templates to sites and injects them predictively
- **Key Features**:
  - Template registry with 10 preset templates
  - Site pattern matching (e-commerce, dashboard, blog, etc.)
  - Injection strategies (preload, just-in-time, lazy, predictive)
  - Template caching system
- **Port**: None (utility module)
- **Status**: Standalone template mapper

### 2. MCP Template Processor (`/mcp`)
- **Purpose**: Document to MVP template matching
- **Key Features**:
  - Template selection based on document content
  - Code generation from templates
  - Progressive AI enhancement
- **Port**: 3000
- **Status**: Core Document Generator component

### 3. Template Layers in Various Systems
- `CLAUDE.template-processor.md` - Documentation for template processing
- `docs/ards/ADR-001-template-layer-convergence-strategy.md` - Decision to converge templates
- Multiple template references in game systems

### 4. Implicit Template Systems
- **Minigame Bosses**: Each boss is a template for resource management
- **MMORPG Instances**: Each instance type is a template
- **Combo System**: Each combo is a template for action sequences
- **Economy Items**: Each item type is a template for functionality

## 🔄 The Recurring Pattern

```
1. Create new feature/game/system
2. Build custom template layer for it
3. Realize it's the same as existing templates
4. Try to converge/unify
5. Get confused by multiple template layers
6. Create new feature instead of fixing
7. REPEAT
```

## 🎯 Single Source of Truth: Unified Template System

### Core Template Types (Everything Maps to These)

#### 1. **Data Transform Template**
```javascript
{
  input: "source_data",
  processing: "transformation_logic",
  output: "result_format",
  monetization: "how_to_sell_it"
}
```
- Used by: Document Generator, Voice-to-Music, QR Compression
- Game Metaphors: Potions, Transmutation, Crafting

#### 2. **Resource Management Template**
```javascript
{
  resource: "what_to_manage",
  depletion: "how_it_decreases",
  replenishment: "how_to_fix",
  monetization: "sell_the_fix"
}
```
- Used by: Boat leaks/buckets, Tempoross, Wintertodt
- Game Metaphors: Buckets, Logs, Supplies

#### 3. **Competition/Comparison Template**
```javascript
{
  competitors: "who_competes",
  rules: "how_to_compete",
  scoring: "how_to_win",
  monetization: "sell_advantages"
}
```
- Used by: AI Debates, ShipRekt Arena, PvP Systems
- Game Metaphors: Battles, Debates, Tournaments

#### 4. **Status/State Template**
```javascript
{
  states: "possible_states",
  transitions: "how_to_change",
  visualization: "how_to_show",
  monetization: "sell_state_changes"
}
```
- Used by: Hollowtown Colors, User Status, System Health
- Game Metaphors: Potions, Buffs, Effects

#### 5. **Instance/Environment Template**
```javascript
{
  environment: "world_definition",
  activities: "what_to_do",
  rewards: "what_you_get",
  monetization: "sell_access_or_advantages"
}
```
- Used by: MMORPG Instances, Game Worlds, Virtual Spaces
- Game Metaphors: Dungeons, Zones, Instances

## 🔧 Consolidation Strategy

### Phase 1: Map Everything to Core Templates
1. **Identify** which core template each system uses
2. **Document** the mapping clearly
3. **Refactor** to use shared template definitions

### Phase 2: Create Template Registry
```javascript
const UnifiedTemplateRegistry = {
  templates: {
    dataTransform: DataTransformTemplate,
    resourceManagement: ResourceManagementTemplate,
    competition: CompetitionTemplate,
    status: StatusTemplate,
    instance: InstanceTemplate
  },
  
  getTemplate(type) {
    return this.templates[type];
  },
  
  createFromTemplate(type, config) {
    const template = this.getTemplate(type);
    return template.instantiate(config);
  }
};
```

### Phase 3: Migrate Existing Systems
1. **Document Generator** → Uses dataTransform template
2. **Minigame Bosses** → Use resourceManagement template
3. **AI Debates** → Use competition template
4. **Piano Potions** → Use status template
5. **MMORPG Manager** → Use instance template

## 📊 Template Mapping Table

| System | Current Template | Core Template | Migration Status |
|--------|-----------------|---------------|------------------|
| Document Generator | MCP Templates | dataTransform | ✅ Ready |
| Tempoross | Custom Boss | resourceManagement | 🔄 Map |
| AI Debates | Unity Spectator | competition | 🔄 Map |
| Piano Potions | Hollowtown | status | 🔄 Map |
| Grand Exchange | MMORPG Instance | instance | 🔄 Map |
| Voice-to-Music | Audio Pipeline | dataTransform | 🔄 Map |
| QR Compression | Knowledge Broadcast | dataTransform | 🔄 Map |
| ShipRekt Arena | PvP System | competition | 🔄 Map |

## 🚫 What NOT to Do

1. **DON'T** create new template systems
2. **DON'T** create new minigame bosses (they're all resourceManagement)
3. **DON'T** create new "god tier" layers (they're just templates)
4. **DON'T** build new abstractions (use the 5 core templates)

## ✅ What TO Do

1. **DO** map new features to existing core templates
2. **DO** reuse the 5 core template types
3. **DO** document which template you're using
4. **DO** check this document before creating anything new

## 🎮 The Truth About Templates

Every "unique" system in the codebase is just one of these 5 templates:

1. **Transform data** → Sell the output
2. **Manage resources** → Sell the fix
3. **Run competition** → Sell advantages
4. **Change states** → Sell state changes
5. **Create instances** → Sell access/items

That's it. That's the entire system.

## 🔮 Implementation Next Steps

1. Create `unified-template-registry.js` with the 5 core templates
2. Create migration scripts for existing systems
3. Update all game metaphors to reference core templates
4. Delete redundant template layers
5. Update documentation to point to this consolidated system

## 📚 Reference Implementation

```javascript
// unified-template-registry.js
class UnifiedTemplateRegistry {
  constructor() {
    this.templates = new Map([
      ['dataTransform', new DataTransformTemplate()],
      ['resourceManagement', new ResourceManagementTemplate()],
      ['competition', new CompetitionTemplate()],
      ['status', new StatusTemplate()],
      ['instance', new InstanceTemplate()]
    ]);
  }
  
  createSystem(templateType, config) {
    const template = this.templates.get(templateType);
    if (!template) {
      throw new Error(`Unknown template type: ${templateType}. Use one of: ${Array.from(this.templates.keys()).join(', ')}`);
    }
    return template.instantiate(config);
  }
}

// Example: Creating Tempoross boss
const tempoross = registry.createSystem('resourceManagement', {
  resource: 'boat_health',
  depletion: 'water_damage',
  replenishment: 'buckets',
  monetization: 'sell_buckets'
});

// Example: Creating AI Debate
const aiDebate = registry.createSystem('competition', {
  competitors: ['agent1', 'agent2', 'agent3', 'agent4'],
  rules: 'reasoning_quality',
  scoring: 'argument_strength',
  monetization: 'sell_transcripts'
});
```

---

**Remember**: There are only 5 templates. Everything else is just a costume.