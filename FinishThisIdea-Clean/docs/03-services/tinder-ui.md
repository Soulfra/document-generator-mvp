# Tinder UI Service

## Overview

The Tinder UI Service provides the revolutionary swipe interface that makes code review intuitive and fast. Instead of complex diff tools and merge conflicts, developers simply swipe to approve or reject changes, building a personal preference profile that improves suggestions over time.

## Service Details

**Price**: Included with all services (core feature)
**Processing Time**: Real-time
**User Experience**: Mobile-first, touch-optimized

## How It Works

### Swipe Gestures

```
👉 Right = Accept this change
👈 Left = Reject this change
👆 Up = Always apply this pattern
👇 Down = Never apply this pattern
```

### Visual Interface

```typescript
interface SwipeCard {
  // Change visualization
  before: string;              // Original code
  after: string;               // Proposed change
  
  // Metadata
  changeType: ChangeType;      // 'formatting' | 'refactor' | 'fix' | 'feature'
  confidence: number;          // AI confidence (0-1)
  impact: ImpactLevel;         // 'low' | 'medium' | 'high'
  
  // Context
  file: string;                // File path
  lineNumbers: Range;          // Line range affected
  explanation: string;         // Why this change was suggested
  
  // Learning signals
  similarChanges: number;      // How many similar changes exist
  userHistory?: Decision[];    // Previous decisions on similar changes
}
```

## Core Features

### 1. Intelligent Card Ordering

Changes are presented in optimal order:

```typescript
class CardOrdering {
  prioritize(changes: Change[]): Change[] {
    return changes.sort((a, b) => {
      // 1. High confidence first
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      
      // 2. Low impact before high impact
      if (a.impact !== b.impact) {
        return a.impact - b.impact;
      }
      
      // 3. Similar changes together
      return a.changeType.localeCompare(b.changeType);
    });
  }
}
```

### 2. Gesture Recognition

```typescript
class GestureHandler {
  private threshold = {
    horizontal: 100,    // Pixels for left/right
    vertical: 80,       // Pixels for up/down
    velocity: 0.3       // Minimum swipe speed
  };
  
  handleSwipe(gesture: SwipeGesture): Decision {
    if (gesture.distance.x > this.threshold.horizontal) {
      return this.handleRightSwipe(); // Accept
    }
    
    if (gesture.distance.x < -this.threshold.horizontal) {
      return this.handleLeftSwipe();  // Reject
    }
    
    if (gesture.distance.y < -this.threshold.vertical) {
      return this.handleUpSwipe();    // Always
    }
    
    if (gesture.distance.y > this.threshold.vertical) {
      return this.handleDownSwipe();  // Never
    }
    
    return null; // No decision
  }
}
```

### 3. Visual Feedback

```typescript
interface SwipeAnimation {
  // Card states
  idle: {
    scale: 1,
    rotation: 0,
    opacity: 1
  };
  
  // During swipe
  swiping: {
    right: { rotation: 15, borderColor: '#10B981' },  // Green
    left: { rotation: -15, borderColor: '#EF4444' },  // Red
    up: { scale: 1.1, borderColor: '#3B82F6' },       // Blue
    down: { scale: 0.9, borderColor: '#F59E0B' }      // Amber
  };
  
  // After decision
  exit: {
    accept: { x: '150%', rotation: 20, opacity: 0 },
    reject: { x: '-150%', rotation: -20, opacity: 0 },
    always: { y: '-150%', scale: 1.2, opacity: 0 },
    never: { y: '150%', scale: 0.8, opacity: 0 }
  };
}
```

### 4. Code Diff Visualization

```typescript
class DiffVisualizer {
  renderDiff(before: string, after: string): JSX.Element {
    const diff = computeDiff(before, after);
    
    return (
      <div className="code-diff">
        {diff.chunks.map((chunk, i) => (
          <div key={i} className="diff-chunk">
            {chunk.changes.map((change, j) => (
              <div 
                key={j}
                className={`diff-line ${change.type}`}
                data-line={change.lineNumber}
              >
                <span className="line-number">{change.lineNumber}</span>
                <span className="diff-marker">{change.marker}</span>
                <code className="diff-content">
                  {highlightSyntax(change.content, language)}
                </code>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
}
```

### 5. Learning System

```typescript
class SwipeLearning {
  private patterns = new Map<string, Pattern>();
  
  async learn(decision: SwipeDecision) {
    // Record basic decision
    await this.recordDecision(decision);
    
    // Extract patterns
    if (decision.direction === 'up' || decision.direction === 'down') {
      const pattern = this.extractPattern(decision.change);
      
      if (decision.direction === 'up') {
        await this.addAlwaysPattern(pattern);
      } else {
        await this.addNeverPattern(pattern);
      }
    }
    
    // Update confidence model
    await this.updateConfidenceModel(decision);
    
    // Retrain personalization
    if (this.shouldRetrain()) {
      await this.retrainUserModel();
    }
  }
  
  private extractPattern(change: Change): Pattern {
    return {
      type: change.changeType,
      before: this.generalizeCode(change.before),
      after: this.generalizeCode(change.after),
      context: this.extractContext(change)
    };
  }
}
```

## UI Components

### 1. Swipe Card Component

```tsx
export function SwipeCard({ 
  change, 
  onSwipe, 
  isActive 
}: SwipeCardProps) {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));
  
  const bind = useDrag(({ down, movement: [mx, my], velocity }) => {
    const trigger = velocity > 0.2;
    const dir = mx > 0 ? 1 : -1;
    
    if (!down && trigger) {
      // Card was released with velocity
      const direction = getSwipeDirection(mx, my);
      onSwipe(direction);
    }
    
    api.start({
      x: down ? mx : 0,
      y: down ? my : 0,
      config: { tension: 300, friction: 30 }
    });
  });
  
  return (
    <animated.div
      {...bind()}
      className="swipe-card"
      style={{
        transform: to([x, y], (x, y) => 
          `translate3d(${x}px, ${y}px, 0) rotate(${x / 10}deg)`
        )
      }}
    >
      <CardHeader change={change} />
      <DiffView before={change.before} after={change.after} />
      <CardFooter confidence={change.confidence} />
    </animated.div>
  );
}
```

### 2. Stack View

```tsx
export function SwipeStack({ changes, onComplete }: StackProps) {
  const [stack, setStack] = useState(changes);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  
  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const [current, ...rest] = stack;
    
    const decision = {
      changeId: current.id,
      direction,
      timestamp: Date.now()
    };
    
    setDecisions([...decisions, decision]);
    setStack(rest);
    
    if (rest.length === 0) {
      onComplete(decisions);
    }
  }, [stack, decisions]);
  
  return (
    <div className="swipe-stack">
      {stack.slice(0, 3).reverse().map((change, index) => (
        <SwipeCard
          key={change.id}
          change={change}
          onSwipe={handleSwipe}
          isActive={index === stack.length - 1}
          style={{
            zIndex: stack.length - index,
            transform: `scale(${1 - index * 0.05})`,
            opacity: index < 2 ? 1 : 0
          }}
        />
      ))}
      
      <ProgressBar 
        current={changes.length - stack.length}
        total={changes.length}
      />
    </div>
  );
}
```

### 3. Tutorial Overlay

```tsx
export function SwipeTutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);
  
  const tutorials = [
    {
      gesture: 'right',
      title: 'Swipe Right to Accept',
      description: 'Accept this change and apply it to your code'
    },
    {
      gesture: 'left',
      title: 'Swipe Left to Reject',
      description: 'Reject this change and keep original code'
    },
    {
      gesture: 'up',
      title: 'Swipe Up for Always',
      description: 'Always apply this type of change automatically'
    },
    {
      gesture: 'down',
      title: 'Swipe Down for Never',
      description: 'Never suggest this type of change again'
    }
  ];
  
  return (
    <div className="tutorial-overlay">
      <AnimatedGesture type={tutorials[step].gesture} />
      <h2>{tutorials[step].title}</h2>
      <p>{tutorials[step].description}</p>
      
      <div className="tutorial-controls">
        <button 
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          Previous
        </button>
        
        {step < tutorials.length - 1 ? (
          <button onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button onClick={onComplete}>
            Start Swiping!
          </button>
        )}
      </div>
    </div>
  );
}
```

## Mobile Optimization

### Touch Handling

```typescript
class TouchOptimizer {
  // Prevent scroll while swiping
  preventScroll(element: HTMLElement) {
    element.addEventListener('touchmove', (e) => {
      if (this.isSwiping) {
        e.preventDefault();
      }
    }, { passive: false });
  }
  
  // Haptic feedback
  triggerHaptic(type: 'light' | 'medium' | 'heavy') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      
      navigator.vibrate(patterns[type]);
    }
  }
  
  // Touch-friendly hit targets
  expandHitArea(element: HTMLElement) {
    element.style.padding = '12px';
    element.style.margin = '-12px';
    element.style.position = 'relative';
  }
}
```

### Responsive Design

```scss
// Mobile-first approach
.swipe-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .swipe-card {
    width: calc(100vw - 32px);
    max-width: 400px;
    height: 70vh;
    max-height: 600px;
  }
}

// Tablet adjustments
@media (min-width: 768px) {
  .swipe-card {
    width: 500px;
    height: 650px;
  }
}

// Desktop enhancements
@media (min-width: 1024px) {
  .swipe-container {
    // Add keyboard shortcuts hint
    &::after {
      content: 'Use arrow keys to swipe';
      position: absolute;
      bottom: 20px;
      opacity: 0.6;
    }
  }
}
```

## Analytics & Insights

### User Behavior Tracking

```typescript
interface SwipeAnalytics {
  // Session metrics
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  
  // Decision metrics
  totalSwipes: number;
  accepts: number;
  rejects: number;
  always: number;
  never: number;
  
  // Performance metrics
  avgSwipeTime: number;      // Seconds per decision
  undoCount: number;         // How often undo was used
  sessionComplete: boolean;  // Did they finish all cards?
  
  // Pattern insights
  mostAcceptedType: ChangeType;
  mostRejectedType: ChangeType;
  confidenceCorrelation: number; // How well AI predictions matched
}

// Track swipe velocity and patterns
class SwipeTracker {
  trackSwipe(gesture: SwipeGesture, decision: Decision) {
    this.analytics.record({
      event: 'swipe',
      properties: {
        direction: decision.direction,
        velocity: gesture.velocity,
        distance: gesture.distance,
        duration: gesture.duration,
        changeType: decision.change.type,
        confidence: decision.change.confidence
      }
    });
  }
}
```

## Integration Points

### With Other Services

```typescript
// Integration with code processing services
class TinderUIIntegration {
  // Receive changes from any service
  async presentChanges(jobId: string, changes: Change[]) {
    // Prepare changes for swiping
    const cards = await this.prepareCards(changes);
    
    // Create swipe session
    const session = await this.createSession({
      jobId,
      cards,
      userId: getCurrentUser().id
    });
    
    // Return session URL for user
    return {
      url: `/swipe/${session.id}`,
      expiresAt: session.expiresAt
    };
  }
  
  // Apply decisions back to code
  async applyDecisions(sessionId: string) {
    const session = await this.getSession(sessionId);
    const decisions = session.decisions;
    
    // Filter accepted changes
    const accepted = decisions
      .filter(d => d.direction === 'right' || d.direction === 'up')
      .map(d => d.changeId);
    
    // Apply changes to files
    await this.codeProcessor.applyChanges(session.jobId, accepted);
    
    // Update learning system
    await this.learningSystem.updateFromSession(session);
  }
}
```

## Best Practices

### 1. Change Granularity
- Keep changes small and focused
- One logical change per card
- Group related changes in sequence

### 2. Context Preservation
- Show enough surrounding code
- Highlight the specific changes
- Provide clear explanations

### 3. Performance
- Preload next 3 cards
- Lazy load syntax highlighting
- Cache rendered diffs

### 4. Accessibility
- Keyboard navigation support
- Screen reader announcements
- High contrast mode

## Error Handling

```typescript
class SwipeErrorHandler {
  handleError(error: Error, context: SwipeContext) {
    if (error instanceof NetworkError) {
      // Save decisions locally
      this.saveOffline(context.decisions);
      
      // Show offline mode
      this.ui.showOfflineMode({
        message: 'No worries! Your swipes are saved.',
        action: 'Continue swiping offline'
      });
    }
    
    if (error instanceof SessionExpiredError) {
      // Offer to resume
      this.ui.showResume({
        message: 'Your session expired. Want to continue?',
        actions: ['Resume', 'Start Over']
      });
    }
  }
}
```

## Future Enhancements

### 1. AI-Powered Grouping
- Group similar changes
- Bulk accept/reject
- Smart batching

### 2. Collaborative Swiping
- Team review mode
- Consensus decisions
- Comments on cards

### 3. Advanced Gestures
- Pinch to zoom code
- Double-tap for details
- Long press for options

### 4. Gamification
- Swipe streaks
- Decision accuracy scores
- Leaderboards

## Related Documentation

- [System Architecture](../02-architecture/system-design.md)
- [LLM Router](llm-router.md) - How changes are generated
- [Pattern Learning](pattern-learning.md) - How the system learns
- [Mobile Apps](../07-guides/mobile-apps.md) - Native app details

---

*Last Updated: 2024-01-20*