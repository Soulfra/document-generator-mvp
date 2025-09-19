# User-Centric Energy Card Architecture

## Overview

We've successfully restructured the system from a singleton energy card pool to a proper user-centric architecture where users OWN energy cards rather than BEING energy cards.

## Architecture Components

### 1. UserCore (`user-core.js`)
The central user entity that:
- **Owns** an energy card collection (not just another card)
- Has persistent identity, profile, and stats
- Manages sessions and context
- Tracks achievements and progression
- Each user has their own `ContextEnergyCards` instance

Key features:
- User profiles with levels, experience, and reputation
- Achievement system tied to energy card usage
- Session management
- Context history and pattern analysis
- Per-user energy card collections

### 2. UserManager (`user-manager.js`)
Multi-user system management:
- Creates and manages multiple UserCore instances
- Handles authentication and sessions
- Tracks system-wide energy economy
- Enables inter-user card transfers
- Provides leaderboards and statistics

Key features:
- Username/email indexing
- Session-based user lookup
- Energy economy tracking
- Online user management
- System statistics

### 3. Energy Card Ownership Model
Changed from:
```
Global Energy Pool → userProfile card (just another card)
```

To:
```
User Entity → owns → Energy Card Collection → contains various cards
```

## Benefits of New Architecture

1. **Proper Identity**: Users exist independently of energy cards
2. **Scalability**: Each user has their own energy system with no global conflicts
3. **No Cooldown Conflicts**: Combinations are user-specific, not global
4. **User Progression**: Users level up and gain achievements
5. **Energy Economy**: Track card flows between users
6. **Session Management**: Proper user sessions with energy snapshots

## User Lifecycle

1. **Creation**:
   - User gets unique ID
   - Receives starter pack of energy cards
   - Special bound userProfile card created

2. **Progression**:
   - Gain experience from activities
   - Level up and unlock new capabilities
   - Earn achievements
   - Collect and level up cards

3. **Interaction**:
   - Create sessions
   - Execute combinations
   - Transfer cards to other users
   - Update context based on activity

## Energy Card Integration

Each user's energy cards:
- Regenerate independently
- Have user-specific cooldowns
- Level up through usage
- Can be transferred between users

## Context Deduction

Now works properly:
1. User has energy cards
2. Cards track usage patterns
3. Context deduced from card states
4. Stored in user's context history

## Next Steps

1. **Fix removeCard method** in ContextEnergyCards
2. **Create UI for user management**
3. **Build energy card marketplace**
4. **Implement proper persistence**
5. **Add authentication system**

This architecture properly separates concerns and creates a scalable multi-user system where energy cards are resources owned by users, not the users themselves.