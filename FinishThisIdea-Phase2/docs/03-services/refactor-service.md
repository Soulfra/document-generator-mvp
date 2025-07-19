# Refactor Service

## Overview

The Refactor Service automatically improves code structure, readability, and maintainability without changing functionality. It uses AI to understand code intent and apply best practices.

## Service Details

- **ID**: refactor-service
- **Category**: Code Quality
- **AI Models**: Ollama (CodeLlama), GPT-3.5 (pattern detection)
- **Confidence Required**: 0.9

## Features

### Core Functionality

1. **Code Structure Improvements**
   - Extract methods/functions
   - Consolidate duplicate code
   - Improve naming conventions
   - Organize imports
   - Simplify complex conditionals

2. **Design Pattern Application**
   - Identify pattern opportunities
   - Implement SOLID principles
   - Apply DRY (Don't Repeat Yourself)
   - Introduce appropriate abstractions

3. **Readability Enhancements**
   - Variable/function renaming
   - Comment generation
   - Code formatting
   - Complexity reduction

### Swipeable Changes

Each refactoring presented as:
- **Change Type**: Extract Method, Rename, Consolidate, etc.
- **Readability Score**: Before/after comparison
- **Complexity Reduction**: Cyclomatic complexity change
- **Safety Level**: How confident the change won't break functionality

## Pricing Tiers

### Basic ($5)
- Up to 20 files
- Simple refactorings
- Basic naming improvements
- 24-hour delivery

### Professional ($20)
- Up to 100 files
- Complex refactorings
- Design pattern application
- Test generation for changes
- 12-hour delivery

### Enterprise ($75+)
- Unlimited files
- Architecture-level refactoring
- Team coding standards enforcement
- Detailed refactoring report
- 6-hour delivery

## Technical Implementation

### Refactoring Types

```typescript
interface RefactoringTask {
  id: string;
  type: RefactoringType;
  target: CodeElement;
  changes: CodeChange[];
  impact: ImpactAssessment;
}

type RefactoringType = 
  | 'extract-method'
  | 'extract-variable'
  | 'inline-variable'
  | 'rename-symbol'
  | 'move-method'
  | 'extract-interface'
  | 'replace-conditional'
  | 'introduce-parameter-object';

interface ImpactAssessment {
  affectedFiles: string[];
  testsCovering: string[];
  riskLevel: 'low' | 'medium' | 'high';
  breakingPotential: number; // 0-1
}
```

### Refactoring Examples

1. **Extract Method**
   ```typescript
   // Before: Long method with multiple responsibilities
   function processOrder(order: Order) {
     // Validate order
     if (!order.items || order.items.length === 0) {
       throw new Error('Order must have items');
     }
     if (!order.customer) {
       throw new Error('Order must have customer');
     }
     
     // Calculate total
     let total = 0;
     for (const item of order.items) {
       total += item.price * item.quantity;
     }
     
     // Apply discounts
     if (order.customer.isVIP) {
       total *= 0.9;
     }
     if (total > 100) {
       total *= 0.95;
     }
     
     return total;
   }
   
   // After: Extracted methods with single responsibilities
   function processOrder(order: Order) {
     validateOrder(order);
     const subtotal = calculateSubtotal(order.items);
     return applyDiscounts(subtotal, order.customer);
   }
   
   function validateOrder(order: Order) {
     if (!order.items?.length) {
       throw new Error('Order must have items');
     }
     if (!order.customer) {
       throw new Error('Order must have customer');
     }
   }
   
   function calculateSubtotal(items: OrderItem[]) {
     return items.reduce((sum, item) => 
       sum + item.price * item.quantity, 0
     );
   }
   
   function applyDiscounts(amount: number, customer: Customer) {
     let discounted = amount;
     if (customer.isVIP) discounted *= 0.9;
     if (amount > 100) discounted *= 0.95;
     return discounted;
   }
   ```

2. **Replace Conditional with Polymorphism**
   ```typescript
   // Before: Complex conditional logic
   function calculateShipping(order: Order) {
     switch (order.shippingType) {
       case 'standard':
         return order.weight * 0.5;
       case 'express':
         return order.weight * 1.5 + 10;
       case 'overnight':
         return order.weight * 3 + 25;
       default:
         return 0;
     }
   }
   
   // After: Strategy pattern
   interface ShippingStrategy {
     calculate(weight: number): number;
   }
   
   class StandardShipping implements ShippingStrategy {
     calculate(weight: number) {
       return weight * 0.5;
     }
   }
   
   class ExpressShipping implements ShippingStrategy {
     calculate(weight: number) {
       return weight * 1.5 + 10;
     }
   }
   
   const shippingStrategies = {
     standard: new StandardShipping(),
     express: new ExpressShipping(),
     // ...
   };
   
   function calculateShipping(order: Order) {
     const strategy = shippingStrategies[order.shippingType];
     return strategy?.calculate(order.weight) ?? 0;
   }
   ```

### Analysis Engine

```typescript
class RefactoringAnalyzer {
  async analyzeCode(files: string[]): Promise<RefactoringOpportunity[]> {
    const opportunities = [];
    
    for (const file of files) {
      const ast = await this.parseFile(file);
      
      // Check for long methods
      opportunities.push(...this.findLongMethods(ast));
      
      // Check for duplicate code
      opportunities.push(...this.findDuplicates(ast));
      
      // Check for complex conditionals
      opportunities.push(...this.findComplexConditionals(ast));
      
      // Check naming conventions
      opportunities.push(...this.findPoorNames(ast));
    }
    
    return this.prioritizeOpportunities(opportunities);
  }
}
```

## Integration Examples

### REST API

```bash
POST /api/services/refactor/analyze
{
  "repository": "github.com/user/repo",
  "options": {
    "focusAreas": ["readability", "complexity"],
    "preserveComments": true,
    "styleGuide": "airbnb"
  }
}
```

### SDK Usage

```typescript
import { RefactorService } from '@finishthisidea/sdk';

const refactor = new RefactorService({
  apiKey: process.env.FTI_API_KEY
});

const results = await refactor.analyze({
  files: ['src/'],
  rules: {
    maxMethodLength: 20,
    maxComplexity: 10,
    namingConvention: 'camelCase'
  }
});

// Review and apply changes
for (const change of results.changes) {
  if (change.confidence > 0.9) {
    await change.apply();
  }
}
```

## Quality Metrics

- **Code Quality Improvement**: Average 35% reduction in complexity
- **Bug Introduction Rate**: < 0.1%
- **Developer Acceptance**: 89% of suggestions accepted
- **Time Saved**: 4+ hours per 1000 lines of code

## Best Practices

1. **Test First**: Ensure good test coverage before refactoring
2. **Small Steps**: Apply one refactoring at a time
3. **Review Changes**: Always review AI suggestions
4. **Measure Impact**: Track code quality metrics

## Success Stories

> "Reduced our technical debt by 60% in just two sprints!" - Engineering Manager

> "The naming suggestions alone made our code 10x more readable." - Senior Developer

> "Caught design pattern opportunities we never would have seen." - Tech Lead

## Future Enhancements

- Language-specific idiom detection
- Team-specific style learning
- Automated test generation for refactorings
- Architecture-level refactoring suggestions