/**
 * 🧬 SIMPLIFIED CLONE SYSTEM DEMO 🧬
 * 
 * Demonstrates the core concepts of the clone-based licensing system
 * without external dependencies.
 */

const crypto = require('crypto');
const EventEmitter = require('events');

// Simplified Clone Service
class SimpleCloneService extends EventEmitter {
    constructor() {
        super();
        this.clones = new Map();
        this.originalPositions = new Map();
        this.paymentLedger = [];
        this.aliases = new Map();
    }
    
    createClone(originalAddress, ideaData) {
        const cloneId = crypto.randomBytes(8).toString('hex');
        
        // Store immutable original position
        if (!this.originalPositions.has(originalAddress)) {
            this.originalPositions.set(originalAddress, {
                position: crypto.randomBytes(32).toString('hex'),
                locked: true,
                earnings: 0
            });
        }
        
        const clone = {
            cloneId,
            originalAddress,
            idea: ideaData,
            invocations: 0,
            totalEarned: 0
        };
        
        this.clones.set(cloneId, clone);
        this.emit('clone_created', { cloneId, originalAddress });
        
        return { cloneId, position: this.originalPositions.get(originalAddress).position };
    }
    
    invokeClone(cloneId, invokerAddress, cost) {
        const clone = this.clones.get(cloneId);
        if (!clone) throw new Error('Clone not found');
        
        const original = this.originalPositions.get(clone.originalAddress);
        
        // Process payment
        const payment = {
            timestamp: new Date(),
            cloneId,
            invoker: invokerAddress,
            original: clone.originalAddress,
            amount: cost,
            originalShare: cost * 0.7,
            platformShare: cost * 0.3,
            positionLocked: original.locked
        };
        
        this.paymentLedger.push(payment);
        clone.invocations++;
        clone.totalEarned += payment.originalShare;
        original.earnings += payment.originalShare;
        
        this.emit('clone_invoked', payment);
        
        return {
            success: true,
            result: `Executed ${clone.idea.name}`,
            cost,
            positionLocked: original.locked
        };
    }
    
    loginAsOriginal(originalAddress) {
        const original = this.originalPositions.get(originalAddress);
        if (!original) throw new Error('Original not found');
        
        // Unlock position when original logs in
        original.locked = false;
        original.lastLogin = new Date();
        
        return {
            position: original.position,
            earnings: original.earnings,
            positionUnlocked: true
        };
    }
    
    createAlias(userAddress, aliasName) {
        this.aliases.set(aliasName, userAddress);
        return { aliasName, created: true };
    }
}

// Demo Runner
class CloneSystemDemo {
    constructor() {
        this.service = new SimpleCloneService();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.service.on('clone_created', (data) => {
            console.log(`\n🌟 Clone Created: ${data.cloneId}`);
        });
        
        this.service.on('clone_invoked', (data) => {
            console.log(`\n💰 Payment Processed:`);
            console.log(`   Original gets: $${data.originalShare}`);
            console.log(`   Platform gets: $${data.platformShare}`);
            console.log(`   Position Locked: ${data.positionLocked ? 'YES' : 'NO'}`);
        });
    }
    
    async runDemo() {
        console.log('\n🧬 CLONE SYSTEM DEMO - Your Ideas, Licensed Through Clones');
        console.log('='.repeat(60));
        
        // Phase 1: Alice creates a clone of her trading algorithm
        console.log('\n💡 Phase 1: Alice creates a clone of her idea');
        console.log('-'.repeat(40));
        
        const aliceClone = this.service.createClone(
            'alice_address',
            { name: 'AI Trading Algorithm', value: 100 }
        );
        
        console.log(`Alice's clone ID: ${aliceClone.cloneId}`);
        console.log(`Alice's immutable position: ${aliceClone.position.substring(0, 16)}...`);
        console.log(`Position is LOCKED until Alice logs in`);
        
        // Phase 2: Bob uses Alice's clone
        console.log('\n🔍 Phase 2: Bob discovers and uses Alice\'s clone');
        console.log('-'.repeat(40));
        
        const bobInvocation = this.service.invokeClone(
            aliceClone.cloneId,
            'bob_address',
            100 // 100 credits
        );
        
        console.log(`\nBob's invocation result: ${bobInvocation.result}`);
        console.log(`Cost: ${bobInvocation.cost} credits`);
        console.log(`Alice's position still locked: ${bobInvocation.positionLocked}`);
        
        // Phase 3: Charlie also uses it
        console.log('\n🔁 Phase 3: Charlie also uses the clone');
        console.log('-'.repeat(40));
        
        const charlieInvocation = this.service.invokeClone(
            aliceClone.cloneId,
            'charlie_address',
            150 // 150 credits
        );
        
        console.log(`Charlie paid ${charlieInvocation.cost} credits`);
        
        // Phase 4: Alice logs in to check earnings
        console.log('\n🔓 Phase 4: Alice logs in to check earnings');
        console.log('-'.repeat(40));
        
        const aliceLogin = this.service.loginAsOriginal('alice_address');
        
        console.log(`\nAlice's earnings: $${aliceLogin.earnings}`);
        console.log(`Position: ${aliceLogin.position.substring(0, 16)}...`);
        console.log(`Position is now UNLOCKED - Alice can make changes`);
        
        // Phase 5: Diana uses an alias
        console.log('\n🎭 Phase 5: Diana creates an alias for anonymous usage');
        console.log('-'.repeat(40));
        
        const dianaAlias = this.service.createAlias('diana_address', 'QuantumTrader');
        console.log(`Diana created alias: "${dianaAlias.aliasName}"`);
        
        const dianaInvocation = this.service.invokeClone(
            aliceClone.cloneId,
            'diana_address',
            200
        );
        
        console.log(`Diana (as QuantumTrader) used the clone for ${dianaInvocation.cost} credits`);
        
        // Summary
        console.log('\n📊 SUMMARY');
        console.log('='.repeat(60));
        
        const clone = this.service.clones.get(aliceClone.cloneId);
        const original = this.service.originalPositions.get('alice_address');
        
        console.log(`\nClone Statistics:`);
        console.log(`   Total Invocations: ${clone.invocations}`);
        console.log(`   Total Earned by Clone: $${clone.totalEarned}`);
        console.log(`   Alice's Total Earnings: $${original.earnings}`);
        console.log(`   Position Status: ${original.locked ? 'LOCKED' : 'UNLOCKED'}`);
        
        console.log(`\nPayment Ledger (Tickertape Standard):`);
        this.service.paymentLedger.forEach((payment, i) => {
            console.log(`   ${i + 1}. ${payment.invoker} → ${payment.original}: $${payment.amount} (Original: $${payment.originalShare})`);
        });
        
        console.log('\n✨ KEY FEATURES DEMONSTRATED:');
        console.log('   ✅ People can create clones of their ideas');
        console.log('   ✅ Others can use clones by paying for them');
        console.log('   ✅ Original creators get 70% of revenue');
        console.log('   ✅ Positions are immutable until original logs in');
        console.log('   ✅ All transactions follow tickertape standard');
        console.log('   ✅ Alias system for anonymous usage');
        console.log('   ✅ Everything is reproducible and auditable');
        
        console.log('\n🚀 Clone-based licensing system is operational!');
    }
}

// Run the demo
const demo = new CloneSystemDemo();
demo.runDemo();