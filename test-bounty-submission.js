#!/usr/bin/env node

/**
 * TEST BOUNTY SUBMISSION
 * Demonstrates a team submitting a solution to Cal's whitehat bounty
 */

const CalWhitehatBountyFederation = require('./CAL-WHITEHAT-BOUNTY-FEDERATION');
const WhitehatAuthSignatureLayer = require('./WHITEHAT-AUTH-SIGNATURE-LAYER');

async function testBountySubmission() {
    console.log('\n🧪 WHITEHAT BOUNTY SUBMISSION TEST\n');
    
    // Initialize systems
    const bountySystem = new CalWhitehatBountyFederation();
    const authLayer = new WhitehatAuthSignatureLayer({
        requireMultiSig: true,
        minSignatures: 2
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Register a security team
    console.log('\n1️⃣ Registering Security Team...\n');
    const teamReg = await authLayer.registerTeam('security-team-bravo', {
        githubUsername: 'bravo-security',
        pgpKeyId: '0xDEADBEEF',
        federationNodes: ['node-1.federation', 'node-2.federation']
    });
    
    console.log(`Team registered: ${teamReg.teamId}`);
    console.log(`Public key fingerprint: ${teamReg.fingerprint}`);
    
    // Get active bounties
    console.log('\n2️⃣ Checking Active Bounties...\n');
    const activeBounties = bountySystem.getActiveBounties();
    console.log(`Found ${activeBounties.length} active bounties`);
    
    if (activeBounties.length === 0) {
        console.log('No active bounties found. Creating one...');
        
        // Create a bug fix bounty
        await bountySystem.postWhitehatBounty({
            type: 'bug_fix',
            title: 'Fix Memory Leak in Tournament Router',
            description: 'Memory consumption grows unbounded with tournament size',
            requirements: {
                files: ['tournament-ai-router.js'],
                issue: 'Memory leak in tournament processing',
                mustInclude: ['fix', 'tests', 'documentation']
            },
            severity: 'high'
        });
        
        // Refresh bounties
        activeBounties.push(...bountySystem.getActiveBounties());
    }
    
    // Select the bug fix bounty
    const bugFixBounty = activeBounties.find(b => b.type === 'bug_fix');
    if (!bugFixBounty) {
        console.error('No bug fix bounty found');
        return;
    }
    
    console.log(`\nSelected bounty: ${bugFixBounty.title}`);
    console.log(`Bounty ID: ${bugFixBounty.id}`);
    console.log(`Reward: ${bugFixBounty.reward}`);
    
    // Prepare submission
    console.log('\n3️⃣ Preparing Solution...\n');
    
    const solution = {
        bountyId: bugFixBounty.id,
        solution: {
            fixedFiles: ['tournament-ai-router.js'],
            tests: ['tournament-ai-router.test.js'],
            description: 'Fixed memory leak by: 1. Properly clearing completed tournaments from memory, 2. Implementing WeakMap for unit registry to allow garbage collection, 3. Adding cleanup after each round',
            changes: [
                {
                    file: 'tournament-ai-router.js',
                    line: 27,
                    before: 'this.completedTournaments = new Map();',
                    after: 'this.completedTournaments = new Map();\nthis.maxCompletedTournaments = 100; // Limit history'
                },
                {
                    file: 'tournament-ai-router.js',
                    line: 28,
                    before: 'this.aiUnitRegistry = new Map();',
                    after: 'this.aiUnitRegistry = new WeakMap(); // Allow GC'
                }
            ],
            regressionTests: true,
            documentation: 'Updated README with memory management best practices'
        }
    };
    
    // Sign the submission
    console.log('\n4️⃣ Signing Submission...\n');
    const signature = await authLayer.signSubmission('security-team-bravo', solution);
    console.log(`Signature created: ${signature.signatureId}`);
    console.log(`Data hash: ${signature.dataHash}`);
    
    // Get bounty details to reconstruct contract
    const bountyDetails = bountySystem.getBountyDetails(bugFixBounty.id);
    
    // Prepare submission with contract reconstruction
    const submission = {
        teamId: 'security-team-bravo',
        solution: solution.solution,
        signatures: signature.signatures,
        reconstructedContract: {
            fragments: {
                coreLogic: { address: 0x0500, data: 'reconstructed' },
                globalVars: { address: 0x0240, data: 'reconstructed' },
                dictionary: { address: 0x1000, data: 'reconstructed' },
                objectTable: { address: 0x0400, data: 'reconstructed' }
            },
            headerInterpretation: {
                version: 4,
                highMemoryBase: 0x8000,
                dictionaryAddress: 0x1000,
                initialPC: 0x0500
            }
        }
    };
    
    // Submit solution
    console.log('\n5️⃣ Submitting Solution...\n');
    const result = await bountySystem.submitBountySolution(bugFixBounty.id, submission);
    
    if (result.success) {
        console.log('✅ Submission accepted!');
        console.log(`Submission ID: ${result.submissionId}`);
        console.log(`Validation score: ${result.validationScore}/100`);
        console.log(`Tournament pending: ${result.tournamentPending}`);
    } else {
        console.error('❌ Submission failed:', result.error);
    }
    
    // Show updated bounty status
    console.log('\n6️⃣ Updated Bounty Status...\n');
    const updatedBounties = bountySystem.getActiveBounties();
    const updatedBounty = updatedBounties.find(b => b.id === bugFixBounty.id);
    if (updatedBounty) {
        console.log(`Bounty: ${updatedBounty.title}`);
        console.log(`Submissions: ${updatedBounty.submissions}`);
        console.log(`Status: ${updatedBounty.status}`);
    }
}

// Run the test
testBountySubmission().catch(console.error);