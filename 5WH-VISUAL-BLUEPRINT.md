# 5W+H Visual Blueprint

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           5W+H FRAMEWORK VISUAL BLUEPRINT                         │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    INPUT LAYER
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                   │
│  Text Input ──┐                                                                   │
│               ├─→ [Parser] ─→ Evidence Extraction Pipeline                        │
│  API Events ──┘                                                                   │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                              EXTRACTION LAYER
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                   │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   │   WHO    │  │   WHAT   │  │   WHEN   │  │  WHERE   │  │   WHY    │  │   HOW    │
│   │ @mention │  │ #hashtag │  │ temporal │  │ spatial  │  │reasoning │  │  logic   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
│        │              │              │              │              │              │
│   ╔════▼════╗   ╔════▼════╗   ╔════▼════╗   ╔════▼════╗   ╔════▼════╗   ╔════▼════╗
│   ║Character║   ║ Content ║   ║Timeline ║   ║Position ║   ║   RNG   ║   ║Workflow ║
│   ║ Router  ║   ║Taxonomy ║   ║ Tracker ║   ║ Locator ║   ║ Engine  ║   ║ Engine  ║
│   ╚════╤════╝   ╚════╤════╝   ╚════╤════╝   ╚════╤════╝   ╚════╤════╝   ╚════╤════╝
│        │              │              │              │              │              │
└────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴───┘
                                        │
                                        ▼
                              AGGREGATION LAYER
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ┌─────────────────────────┐                             │
│                          │   Evidence Aggregator    │                             │
│                          │  ┌─────────────────┐    │                             │
│                          │  │ Conflict Resolver│    │                             │
│                          │  └─────────────────┘    │                             │
│                          │  ┌─────────────────┐    │                             │
│                          │  │ Context Builder │    │                             │
│                          │  └─────────────────┘    │                             │
│                          └───────────┬─────────────┘                             │
│                                      │                                           │
└──────────────────────────────────────┴───────────────────────────────────────────┘
                                        │
                                        ▼
                               DECISION LAYER
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ┌─────────────────────────┐                             │
│                          │    Decision Engine      │                             │
│                          │  ╔═══════════════╗     │                             │
│                          │  ║ Rule Matching ║     │                             │
│                          │  ╚═══════╤═══════╝     │                             │
│                          │          │              │                             │
│                          │  ╔═══════▼═══════╗     │                             │
│                          │  ║ Action Router ║     │                             │
│                          │  ╚═══════╤═══════╝     │                             │
│                          └──────────┴──────────────┘                             │
│                                     │                                            │
└─────────────────────────────────────┴────────────────────────────────────────────┘
                                        │
                                        ▼
                                OUTPUT LAYER
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                   │
│   ┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐      │
│   │ AI Response│     │   System   │     │    User    │     │  Workflow  │      │
│   │ Generation │     │   Action   │     │Notification│     │ Execution  │      │
│   └────────────┘     └────────────┘     └────────────┘     └────────────┘      │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Detail Diagrams

### WHO - Identity Router
```
                        @mention Detection
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Mention Parser     │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                              ▼
        ┌──────────────┐              ┌──────────────┐
        │ Fuzzy Search │              │ Entity Store │
        └──────┬───────┘              └──────┬───────┘
                │                              │
                └──────────┬───────────────────┘
                           ▼
                   ┌──────────────┐
                   │   Resolver   │
                   └──────┬───────┘
                          │
           ┌──────────────┼──────────────┐
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │Character │   │   User   │   │  System  │
    │  Route   │   │  Route   │   │  Route   │
    └──────────┘   └──────────┘   └──────────┘
```

### WHERE - Dynamic Positioning System
```
                     Spatial Expression
                            │
                            ▼
                ┌────────────────────────┐
                │   Position Parser      │
                └───────────┬────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Coordinates  │   │    Regions    │   │   Movement    │
│   (x,y,z)     │   │  (boundaries) │   │  (velocity)   │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Spatial Index │
                    │   (R-Tree)    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Relationship │
                    │   Calculator  │
                    └───────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │Distance │    │Proximity│    │Collision│
      └─────────┘    └─────────┘    └─────────┘
```

### WHY - RNG & Reasoning Engine
```
                    Reasoning Expression
                            │
                            ▼
                ┌────────────────────────┐
                │  Expression Parser     │
                └───────────┬────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│      RNG      │   │   Formula     │   │   Decision    │
│   Generator   │   │  Evaluator    │   │     Tree      │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Distribution  │   │  Variables    │   │    Nodes      │
│   Selector    │   │  Resolver     │   │  Evaluator    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Result     │
                    │  Calculator   │
                    └───────────────┘
```

### HOW - Logic Orchestrator
```
                    Method Expression
                            │
                            ▼
                ┌────────────────────────┐
                │   Method Parser       │
                └───────────┬────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ State Machine │   │   Workflow    │   │Event Handler  │
│    Engine     │   │   Executor    │   │   Registry    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    States     │   │     Steps     │   │   Triggers    │
│  Transitions  │   │  Conditions   │   │   Actions     │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Orchestrator │
                    │   Conductor   │
                    └───────────────┘
```

## Data Flow Sequences

### Complete 5W+H Processing Flow
```
User Input: "@bob #raid-boss when:now where:dungeon why:epic-loot how:strategy"
    │
    ▼
[1] Parallel Extraction
    ├─→ WHO:   @bob → User(bob)
    ├─→ WHAT:  #raid-boss → Content(boss-fight)
    ├─→ WHEN:  when:now → Time(immediate)
    ├─→ WHERE: where:dungeon → Position(x:500,y:300)
    ├─→ WHY:   why:epic-loot → Probability(drop:0.15)
    └─→ HOW:   how:strategy → Workflow(tank-strategy)
    │
    ▼
[2] Evidence Aggregation
    {
      who: {id: "bob", type: "user"},
      what: {id: "raid-boss", state: "active"},
      when: {time: "2025-01-13T15:30:00Z", urgency: 0.9},
      where: {position: {x:500,y:300}, region: "dungeon"},
      why: {calculation: "epic_drop_rate", result: 0.15},
      how: {workflow: "tank-strategy", state: "prepare"}
    }
    │
    ▼
[3] Decision Making
    IF (who.type == "user" && what.id == "raid-boss")
    THEN Execute(raid-encounter-workflow)
    │
    ▼
[4] Action Execution
    ├─→ Start combat state machine
    ├─→ Track player position
    ├─→ Calculate drop probabilities
    └─→ Send notifications
```

### Real-time Position Update Flow
```
Game Loop (60fps)
    │
    ▼
Player Movement
    │
    ▼
WHERE Component
    ├─→ Update Position(x,y,z)
    ├─→ Check Collisions
    ├─→ Update Regions
    └─→ Emit 'position-changed'
         │
         ▼
    Event Bus
         ├─→ Minimap Update
         ├─→ Proximity Triggers
         ├─→ Network Sync
         └─→ Analytics
```

### RNG Calculation Flow
```
Loot Drop Request
    │
    ▼
WHY Component
    ├─→ Load Drop Table
    ├─→ Get Player Stats
    ├─→ Apply Modifiers
    │    ├─→ Base Rate: 0.001
    │    ├─→ Luck Bonus: x1.5
    │    └─→ Event Multiplier: x2.0
    ├─→ Calculate Final Rate: 0.003
    ├─→ Generate Random: 0.0025
    └─→ Result: SUCCESS (Legendary Drop!)
         │
         ▼
    Emit 'loot-awarded'
```

## Integration Patterns

### Event-Driven Integration
```
┌─────────────┐     Events      ┌─────────────┐
│ Component A │ ──────────────→ │  Event Bus  │
└─────────────┘                  └──────┬──────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
            │ Component B │     │ Component C │     │  Analytics  │
            └─────────────┘     └─────────────┘     └─────────────┘
```

### API Gateway Pattern
```
            External Requests
                    │
                    ▼
            ┌───────────────┐
            │  API Gateway  │
            └───────┬───────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│   WHO   │   │  WHAT   │   │  WHEN   │
│ Service │   │ Service │   │ Service │
└─────────┘   └─────────┘   └─────────┘
```

## Deployment Architecture

### Container Orchestration
```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ WHO Pod (3) │  │WHAT Pod (3) │  │WHEN Pod (3) │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │WHERE Pod(3) │  │ WHY Pod (3) │  │ HOW Pod (3) │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Load Balancer (Ingress)               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Database Schema
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Evidence  │     │  Entities   │     │  Workflows  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ evidence_id │────→│ entity_id   │     │workflow_id  │
│ who_data    │     │ entity_type │     │ state       │
│ what_data   │     │ metadata    │     │ steps       │
│ when_data   │     └─────────────┘     │ transitions │
│ where_data  │                          └─────────────┘
│ why_data    │     ┌─────────────┐
│ how_data    │     │  Positions  │
│ created_at  │     ├─────────────┤
└─────────────┘     │ entity_id   │
                    │ x, y, z     │
                    │ timestamp   │
                    └─────────────┘
```

## UI/UX Flow Diagrams

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│                    5W+H Evidence Dashboard                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ WHO Panel     │  │ WHAT Panel    │  │ WHEN Panel    │      │
│  │ ┌─────────┐   │  │ ┌─────────┐   │  │ ┌─────────┐   │      │
│  │ │@mentions│   │  │ │#hashtags│   │  │ │Timeline │   │      │
│  │ └─────────┘   │  │ └─────────┘   │  │ └─────────┘   │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ WHERE Panel   │  │ WHY Panel     │  │ HOW Panel     │      │
│  │ ┌─────────┐   │  │ ┌─────────┐   │  │ ┌─────────┐   │      │
│  │ │   Map   │   │  │ │RNG Stats│   │  │ │Workflows│   │      │
│  │ └─────────┘   │  │ └─────────┘   │  │ └─────────┘   │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Aggregated Evidence View                │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Performance Optimization Patterns

### Caching Strategy
```
Request → Cache Check → Found? ─Yes→ Return Cached
             │            │
             No          Store
             ↓            ↑
         Process ─────────┘
```

### Load Distribution
```
Incoming Load: 10,000 req/s
       │
       ▼
Load Balancer
       │
   ┌───┴───┬───────┬───────┐
   ▼       ▼       ▼       ▼
Node 1   Node 2   Node 3   Node 4
(2500)   (2500)   (2500)   (2500)
```

## Security Flow

### Authentication & Authorization
```
Request → API Gateway → Auth Check → Authorized? ─No→ 401 Unauthorized
                            │           │
                           Yes         Log
                            ↓           ↑
                        Process ────────┘
                            │
                            ▼
                     Rate Limiting
                            │
                            ▼
                    Input Validation
                            │
                            ▼
                    Execute Request
```

This visual blueprint provides comprehensive diagrams for understanding the 5W+H Framework architecture, data flows, and integration patterns. Each diagram uses ASCII art for universal compatibility while maintaining clarity and detail.