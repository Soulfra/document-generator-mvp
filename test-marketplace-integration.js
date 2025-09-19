#!/usr/bin/env node

/**
 * TEST MARKETPLACE INTEGRATION
 * 
 * Demonstrates the complete flow:
 * 1. Create a simple singleton component
 * 2. Submit it through the pipeline
 * 3. Watch it progress through validation → testing → review → marketplace
 * 4. Purchase it with tokens
 * 
 * This shows how all the systems work together to ensure quality components.
 */

const fs = require('fs').promises;
const path = require('path');

// Example singleton component that follows all standards
const exampleComponent = {
    name: 'string-utils',
    description: 'A collection of pure string manipulation utilities',
    category: 'utility',
    code: `
/**
 * String Utilities - Pure functions for string manipulation
 * No external dependencies, no global state, fully deterministic
 */

/**
 * Reverse a string
 * @param {string} str - The string to reverse
 * @returns {string} The reversed string
 */
function reverseString(str) {
    if (typeof str !== 'string') {
        throw new TypeError('Input must be a string');
    }
    return str.split('').reverse().join('');
}

/**
 * Convert string to title case
 * @param {string} str - The string to convert
 * @returns {string} The title-cased string
 */
function toTitleCase(str) {
    if (typeof str !== 'string') {
        throw new TypeError('Input must be a string');
    }
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Count occurrences of a substring
 * @param {string} str - The string to search in
 * @param {string} substr - The substring to count
 * @returns {number} The number of occurrences
 */
function countOccurrences(str, substr) {
    if (typeof str !== 'string' || typeof substr !== 'string') {
        throw new TypeError('Both arguments must be strings');
    }
    if (substr.length === 0) return 0;
    
    let count = 0;
    let position = 0;
    
    while ((position = str.indexOf(substr, position)) !== -1) {
        count++;
        position += substr.length;
    }
    
    return count;
}

// Export functions
module.exports = {
    reverseString,
    toTitleCase,
    countOccurrences
};
`,
    tests: {
        'test.js': `
const assert = require('assert');
const { reverseString, toTitleCase, countOccurrences } = require('./string-utils');

// Test reverseString
assert.strictEqual(reverseString('hello'), 'olleh');
assert.strictEqual(reverseString(''), '');
assert.strictEqual(reverseString('a'), 'a');
assert.throws(() => reverseString(123), TypeError);

// Test toTitleCase
assert.strictEqual(toTitleCase('hello world'), 'Hello World');
assert.strictEqual(toTitleCase('HELLO WORLD'), 'Hello World');
assert.strictEqual(toTitleCase(''), '');
assert.throws(() => toTitleCase(null), TypeError);

// Test countOccurrences
assert.strictEqual(countOccurrences('hello world', 'o'), 2);
assert.strictEqual(countOccurrences('aaaa', 'aa'), 2);
assert.strictEqual(countOccurrences('hello', 'x'), 0);
assert.strictEqual(countOccurrences('', 'a'), 0);

console.log('All tests passed!');
`
    },
    documentation: {
        'README.md': `# String Utilities

A collection of pure, deterministic string manipulation functions with no external dependencies.

## Installation

\`\`\`bash
npm install string-utils
\`\`\`

## Usage

\`\`\`javascript
const { reverseString, toTitleCase, countOccurrences } = require('string-utils');

// Reverse a string
console.log(reverseString('hello')); // 'olleh'

// Convert to title case
console.log(toTitleCase('hello world')); // 'Hello World'

// Count occurrences
console.log(countOccurrences('hello world', 'o')); // 2
\`\`\`

## API

### reverseString(str)
Reverses the input string.

- **Parameters**: str (string) - The string to reverse
- **Returns**: string - The reversed string
- **Throws**: TypeError if input is not a string

### toTitleCase(str)
Converts a string to title case.

- **Parameters**: str (string) - The string to convert
- **Returns**: string - The title-cased string
- **Throws**: TypeError if input is not a string

### countOccurrences(str, substr)
Counts non-overlapping occurrences of a substring.

- **Parameters**: 
  - str (string) - The string to search in
  - substr (string) - The substring to count
- **Returns**: number - The count of occurrences
- **Throws**: TypeError if inputs are not strings

## Features

- ✅ Pure functions - no side effects
- ✅ No external dependencies
- ✅ Fully deterministic
- ✅ Type checking with helpful errors
- ✅ 100% test coverage
- ✅ Ready for production use

## License

MIT
`,
        'API.md': `# String Utils API Documentation

## Module: string-utils

### Functions

#### reverseString(str: string): string
Reverses the characters in a string.

**Example:**
\`\`\`javascript
reverseString('abc') // returns 'cba'
\`\`\`

#### toTitleCase(str: string): string
Converts string to title case (first letter of each word capitalized).

**Example:**
\`\`\`javascript
toTitleCase('hello world') // returns 'Hello World'
\`\`\`

#### countOccurrences(str: string, substr: string): number
Counts non-overlapping occurrences of substring in string.

**Example:**
\`\`\`javascript
countOccurrences('abcabc', 'abc') // returns 2
\`\`\`
`,
        'INSTALL.md': `# Installation Guide

## Requirements
- Node.js >= 12.0.0
- npm or yarn

## Installation Steps

1. Install the package:
   \`\`\`bash
   npm install string-utils
   \`\`\`

2. Import in your project:
   \`\`\`javascript
   const stringUtils = require('string-utils');
   \`\`\`

3. Verify installation:
   \`\`\`javascript
   console.log(stringUtils.reverseString('test')); // Should output: 'tset'
   \`\`\`

## Troubleshooting

If you encounter any issues, please check:
1. Node.js version is compatible
2. No conflicting packages named 'string-utils'
3. Proper import syntax is used

## Support

For issues, please open a ticket in the marketplace.
`
    },
    metadata: {
        version: '1.0.0',
        author: 'test-user',
        license: 'MIT',
        keywords: ['string', 'utilities', 'pure-functions']
    }
};

async function demonstrateMarketplaceFlow() {
    console.log('🎯 MARKETPLACE INTEGRATION DEMONSTRATION');
    console.log('=======================================\n');
    
    try {
        // Step 1: Submit component to pipeline
        console.log('📤 Step 1: Submitting component to singleton integration pipeline...');
        
        const pipelineResponse = await fetch('http://localhost:9900/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exampleComponent)
        });
        
        if (!pipelineResponse.ok) {
            throw new Error(`Pipeline submission failed: ${await pipelineResponse.text()}`);
        }
        
        const pipelineResult = await pipelineResponse.json();
        console.log(`✅ Component submitted! Pipeline ID: ${pipelineResult.pipeline_id}`);
        console.log(`   Component ID: ${pipelineResult.component_id}`);
        console.log(`   Tracking URL: ${pipelineResult.tracking_url}\n`);
        
        // Step 2: Monitor pipeline progress
        console.log('📊 Step 2: Monitoring pipeline progress...');
        let pipelineComplete = false;
        let finalStatus = null;
        
        while (!pipelineComplete) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
            
            const statusResponse = await fetch(`http://localhost:9900/api/pipelines/${pipelineResult.pipeline_id}`);
            const status = await statusResponse.json();
            
            console.log(`   Current stage: ${status.current_stage} - Status: ${status.status}`);
            
            if (status.status === 'completed' || status.status === 'failed') {
                pipelineComplete = true;
                finalStatus = status;
            }
        }
        
        if (finalStatus.status === 'failed') {
            console.log(`❌ Pipeline failed at stage: ${finalStatus.current_stage}`);
            console.log(`   Error: ${finalStatus.metadata?.error || 'Unknown error'}`);
            return;
        }
        
        console.log(`✅ Pipeline completed successfully!\n`);
        
        // Step 3: Check component in marketplace
        console.log('🛍️ Step 3: Checking component in marketplace...');
        
        const marketplaceResponse = await fetch(`http://localhost:9700/api/components/${pipelineResult.component_id}`);
        const componentListing = await marketplaceResponse.json();
        
        console.log(`   Name: ${componentListing.name}`);
        console.log(`   Price: ${componentListing.price || 0} tokens`);
        console.log(`   Lifecycle Stage: ${componentListing.lifecycle_stage}`);
        console.log(`   Downloads: ${componentListing.downloads}`);
        console.log(`   Karma Score: ${componentListing.karma_score}`);
        console.log(`   Reviews: ${componentListing.reviews?.length || 0}`);
        console.log(`   Tips: ${componentListing.tips?.length || 0}\n`);
        
        // Step 4: Create wallets for demo
        console.log('💰 Step 4: Creating demo wallets...');
        
        // Create buyer wallet
        const buyerWalletResponse = await fetch('http://localhost:9800/api/wallets/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                owner_id: 'demo-buyer',
                owner_type: 'user'
            })
        });
        
        const buyerWallet = await buyerWalletResponse.json();
        console.log(`   Buyer wallet created: ${buyerWallet.wallet_address}`);
        
        // Create seller wallet (component creator)
        const sellerWalletResponse = await fetch('http://localhost:9800/api/wallets/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                owner_id: 'test-user',
                owner_type: 'user'
            })
        });
        
        const sellerWallet = await sellerWalletResponse.json();
        console.log(`   Seller wallet created: ${sellerWallet.wallet_address}\n`);
        
        // Step 5: Simulate earning tokens (mining)
        console.log('⛏️ Step 5: Earning tokens through work...');
        
        const miningResponse = await fetch('http://localhost:9800/api/mining/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: buyerWallet.wallet_address,
                work_proof: 'demo-work-proof',
                work_type: 'component_review'
            })
        });
        
        const miningResult = await miningResponse.json();
        console.log(`   Earned ${miningResult.reward_amount} tokens for component review`);
        console.log(`   New balance: ${miningResult.new_balance} tokens\n`);
        
        // Step 6: Purchase component
        console.log('🛒 Step 6: Purchasing component...');
        
        const purchaseResponse = await fetch(`http://localhost:9700/api/components/${pipelineResult.component_id}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buyer_id: 'demo-buyer',
                buyer_type: 'user',
                payment_method: 'wallet'
            })
        });
        
        const purchaseResult = await purchaseResponse.json();
        console.log(`   Transaction ID: ${purchaseResult.transaction_id}`);
        console.log(`   Escrow ID: ${purchaseResult.escrow_id}`);
        console.log(`   Status: ${purchaseResult.status}\n`);
        
        // Step 7: Complete transaction (simulate download verification)
        console.log('✅ Step 7: Completing transaction...');
        
        // In real system, this would happen after buyer confirms receipt
        const escrowResponse = await fetch(`http://localhost:9700/api/escrow/${purchaseResult.escrow_id}/release`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                release_to: 'seller',
                signature: 'demo-signature'
            })
        });
        
        const escrowResult = await escrowResponse.json();
        console.log(`   Escrow released: ${escrowResult.success}`);
        console.log(`   Transaction hash: ${escrowResult.transaction_hash}\n`);
        
        // Step 8: Leave a review
        console.log('⭐ Step 8: Leaving a review...');
        
        const reviewResponse = await fetch(`http://localhost:9700/api/components/${pipelineResult.component_id}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reviewer_id: 'demo-buyer',
                reviewer_type: 'user',
                rating: 5,
                review_text: 'Excellent utility functions! Clean code, well-documented, and works perfectly. The pure function approach makes it easy to test and integrate.',
                review_category: 'technical'
            })
        });
        
        const reviewResult = await reviewResponse.json();
        console.log(`   Review submitted!`);
        console.log(`   Karma impact: ${reviewResult.karma_impact}`);
        console.log(`   Tokens earned: ${reviewResult.tokens_earned}\n`);
        
        // Final summary
        console.log('📈 DEMONSTRATION COMPLETE!');
        console.log('========================');
        console.log(`✅ Component successfully went through entire lifecycle:`);
        console.log(`   1. Singleton validation ✓`);
        console.log(`   2. Multi-instance testing ✓`);
        console.log(`   3. Agent reviews ✓`);
        console.log(`   4. Reproducibility check ✓`);
        console.log(`   5. Marketplace listing ✓`);
        console.log(`   6. Token purchase ✓`);
        console.log(`   7. Review & karma ✓`);
        console.log(`\n🎯 This ensures only high-quality, tested components reach users!`);
        
    } catch (error) {
        console.error('❌ Demonstration failed:', error.message);
        console.error('\nMake sure all services are running:');
        console.error('- Component Marketplace (port 9700)');
        console.error('- Agent Wallet System (port 9800)');
        console.error('- Singleton Integration Pipeline (port 9900)');
        console.error('- PostgreSQL database');
    }
}

// Run the demonstration
if (require.main === module) {
    demonstrateMarketplaceFlow();
}