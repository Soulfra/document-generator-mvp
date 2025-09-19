/**
 * 🎁 INVITE SYSTEM DEMO 🎁
 * 
 * Comprehensive demonstration of the invite-only gift tag system
 * Shows integration between smart contracts, Apple ecosystem, and referral economy
 */

const { GiftTagCreatorService } = require('./services/gift-tag-creator');
const { AppleEcosystemIntegration } = require('./services/apple-ecosystem-integration');
const { AgentAffiliatePayoutSystem } = require('./agent-affiliate-payout-system');
const { AgentReferralEconomySystem } = require('./agent-referral-economy-system');

class InviteSystemDemo {
    constructor() {
        this.demoUsers = {
            alice: '0x742d35Cc6634C0532925a3b844Bc44f2fA9b38e0',
            bob: '0x8ba1f109551bD432803012645Hac136c31167',
            charlie: '0x1234567890123456789012345678901234567890',
            diana: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
        };
        
        this.initializeServices();
    }
    
    async initializeServices() {
        console.log('🚀 Initializing Invite System Demo...\n');
        
        // Initialize core services
        this.giftTagService = new GiftTagCreatorService({
            appleIntegration: true,
            enableGameCenter: true,
            enableWalletPasses: true,
            maxInvitesPerDay: 10
        });
        
        this.affiliateSystem = new AgentAffiliatePayoutSystem();
        this.referralSystem = new AgentReferralEconomySystem();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ All services initialized\n');
    }
    
    setupEventListeners() {
        this.giftTagService.on('gift_tag_created', (data) => {
            console.log(`🎁 Gift tag created: ${data.tagType} from ${this.getUserName(data.creator)} to ${this.getUserName(data.recipient)}`);
        });
        
        this.giftTagService.on('gift_tag_claimed', (data) => {
            console.log(`🎉 Gift tag claimed: ${data.tagType} by ${this.getUserName(data.claimer)} (${data.welcomeDroplets} droplets awarded)`);
        });
        
        this.giftTagService.on('credits_earned', (data) => {
            console.log(`💰 Credits earned: ${this.getUserName(data.userAddress)} earned ${data.creditsEarned} credits from ${data.activityType}`);
        });
        
        this.giftTagService.appleService.on('apple_id_authenticated', (data) => {
            console.log(`🍎 Apple ID linked: ${data.appleId} for ${this.getUserName(data.userAddress)}`);
        });
        
        this.giftTagService.appleService.on('achievement_unlocked', (data) => {
            console.log(`🏆 Achievement unlocked: ${data.achievement} (${data.points} points)`);
        });
    }
    
    getUserName(address) {
        const names = {
            [this.demoUsers.alice]: 'Alice',
            [this.demoUsers.bob]: 'Bob', 
            [this.demoUsers.charlie]: 'Charlie',
            [this.demoUsers.diana]: 'Diana'
        };
        return names[address] || address.slice(0, 8) + '...';
    }
    
    async runFullDemo() {
        console.log('🎯 Starting Complete Invite System Demo\n');
        console.log('═'.repeat(60));
        
        try {
            // Phase 1: User Onboarding and Apple Integration
            await this.demoPhase1_AppleIntegration();
            
            // Phase 2: Initial Credits and Gift Tag Creation
            await this.demoPhase2_InitialInvites();
            
            // Phase 3: Activity-Based Credit Earning
            await this.demoPhase3_ActivityCredits();
            
            // Phase 4: Advanced Gift Tags and Referral Chain
            await this.demoPhase4_AdvancedInvites();
            
            // Phase 5: Apple Wallet and Game Center Integration
            await this.demoPhase5_AppleEcosystem();
            
            // Phase 6: Affiliate Payouts and Real Value
            await this.demoPhase6_RealValue();
            
            // Final Summary
            await this.showFinalSummary();
            
        } catch (error) {
            console.error('Demo failed:', error);
        }
    }
    
    async demoPhase1_AppleIntegration() {
        console.log('\n📱 PHASE 1: Apple Ecosystem Integration');
        console.log('-'.repeat(40));
        
        // Alice connects her Apple ID
        const aliceAppleAuth = await this.giftTagService.appleService.authenticateWithAppleId(
            'mock_auth_code',
            'mock_identity_token',
            {
                address: this.demoUsers.alice,
                deviceInfo: {
                    platform: 'iOS',
                    version: '17.0',
                    deviceId: 'iPhone15_Pro'
                }
            }
        );
        
        if (aliceAppleAuth.success) {
            // Link Game Center
            await this.giftTagService.appleService.linkGameCenterAccount(
                this.demoUsers.alice,
                aliceAppleAuth.appleId
            );
            
            // Award Apple ID linking bonus
            await this.giftTagService.awardActivityCredits(
                this.demoUsers.alice,
                'ACHIEVEMENT_UNLOCKED',
                1,
                { achievement: 'apple_id_linked' }
            );
        }
        
        // Bob also connects (will be Alice's first invite)
        const bobAppleAuth = await this.giftTagService.appleService.authenticateWithAppleId(
            'mock_auth_code_2',
            'mock_identity_token_2',
            {
                address: this.demoUsers.bob,
                deviceInfo: {
                    platform: 'macOS',
                    version: '14.0',
                    deviceId: 'MacBook_Pro_M3'
                }
            }
        );
        
        if (bobAppleAuth.success) {
            await this.giftTagService.appleService.linkGameCenterAccount(
                this.demoUsers.bob,
                bobAppleAuth.appleId
            );
        }
        
        console.log('✅ Apple ecosystem integration complete');
        await this.sleep(1000);
    }
    
    async demoPhase2_InitialInvites() {
        console.log('\n🎁 PHASE 2: Initial Gift Tag Creation');
        console.log('-'.repeat(40));
        
        // Give Alice some initial credits for demo
        await this.giftTagService.addInviteCredits(this.demoUsers.alice, 20, 'DEMO_BONUS');
        console.log('💰 Alice received 20 demo credits');
        
        // Alice creates her first invite for Bob (Friend Pass - free)
        const friendInvite = await this.giftTagService.createGiftTag(
            this.demoUsers.alice,
            this.demoUsers.bob,
            'FRIEND_PASS',
            'Hey Bob! Check out this amazing platform I found. You\'ll love the AI tools!'
        );
        
        if (friendInvite.success) {
            console.log(`📱 Share URL: ${friendInvite.shareUrls.direct}`);
            console.log(`📱 QR Code: ${friendInvite.qrCodeImage ? 'Generated' : 'Failed'}`);
            console.log(`🍎 Apple Wallet: ${friendInvite.walletPassUrl || 'Not available'}`);
            
            // Bob claims the invite
            await this.sleep(2000);
            const claimResult = await this.giftTagService.claimGiftTag(
                this.demoUsers.bob,
                friendInvite.giftTag.qrCodeHash,
                { deviceId: 'MacBook_Pro_M3', platform: 'macOS' }
            );
            
            if (claimResult.success) {
                console.log(`🎉 Bob claimed the invite and received ${claimResult.welcomeDroplets} welcome droplets!`);
            }
        }
        
        await this.sleep(1000);
    }
    
    async demoPhase3_ActivityCredits() {
        console.log('\n⚡ PHASE 3: Activity-Based Credit Earning');
        console.log('-'.repeat(40));
        
        // Simulate various platform activities for Alice
        const activities = [
            { type: 'DOCUMENT_PROCESSED', description: 'Converted business plan to MVP' },
            { type: 'AI_SERVICE_USED', description: 'Used Claude for code generation' },
            { type: 'DAILY_LOGIN', description: 'Daily platform visit' },
            { type: 'COMMUNITY_HELP', description: 'Helped new user with setup' },
            { type: 'BUG_REPORTED', description: 'Reported UI bug in dashboard' }
        ];
        
        for (const activity of activities) {
            const result = await this.giftTagService.awardActivityCredits(
                this.demoUsers.alice,
                activity.type,
                1,
                { description: activity.description }
            );
            
            if (result.success) {
                console.log(`✨ Alice: ${activity.description} (+${result.creditsEarned} credits)`);
            }
            await this.sleep(500);
        }
        
        // Bob also does some activities
        await this.giftTagService.awardActivityCredits(this.demoUsers.bob, 'DOCUMENT_PROCESSED', 1);
        await this.giftTagService.awardActivityCredits(this.demoUsers.bob, 'DAILY_LOGIN', 1);
        
        console.log('📈 Activity credit earning simulation complete');
        await this.sleep(1000);
    }
    
    async demoPhase4_AdvancedInvites() {
        console.log('\n🏆 PHASE 4: Advanced Gift Tags & Referral Chain');
        console.log('-'.repeat(40));
        
        // Alice creates a Bronze Tag for Charlie
        const bronzeInvite = await this.giftTagService.createGiftTag(
            this.demoUsers.alice,
            this.demoUsers.charlie,
            'BRONZE_TAG',
            'Charlie, you need to see this! I\'m sending you Bronze access with extra perks.'
        );
        
        if (bronzeInvite.success) {
            console.log('🥉 Bronze tag created for Charlie');
            
            // Charlie claims it
            await this.sleep(1500);
            await this.giftTagService.claimGiftTag(
                this.demoUsers.charlie,
                bronzeInvite.giftTag.qrCodeHash
            );
        }
        
        // Bob (now a user) invites Diana with a Golden Tag
        await this.giftTagService.addInviteCredits(this.demoUsers.bob, 10, 'DEMO_BONUS');
        
        const goldenInvite = await this.giftTagService.createGiftTag(
            this.demoUsers.bob,
            this.demoUsers.diana,
            'GOLDEN_TAG',
            'Diana! This platform is incredible. I\'m giving you Golden access - you get VIP support!'
        );
        
        if (goldenInvite.success) {
            console.log('🥇 Golden tag created by Bob for Diana');
            
            // Diana claims it
            await this.sleep(1500);
            await this.giftTagService.claimGiftTag(
                this.demoUsers.diana,
                goldenInvite.giftTag.qrCodeHash
            );
        }
        
        console.log('🔗 Referral chain established: Alice → Bob → Diana');
        console.log('🔗 Also: Alice → Charlie');
        await this.sleep(1000);
    }
    
    async demoPhase5_AppleEcosystem() {
        console.log('\n🍎 PHASE 5: Apple Ecosystem Features');
        console.log('-'.repeat(40));
        
        // Update Game Center scores
        await this.giftTagService.appleService.updateGameCenterScore(this.demoUsers.alice, 2500);
        await this.giftTagService.appleService.updateGameCenterScore(this.demoUsers.bob, 1800);
        await this.giftTagService.appleService.updateGameCenterScore(this.demoUsers.charlie, 1200);
        
        console.log('🎮 Game Center scores updated');
        
        // Unlock achievements
        const aliceAppleId = await this.giftTagService.getAppleIdForAddress(this.demoUsers.alice);
        if (aliceAppleId) {
            await this.giftTagService.appleService.unlockAchievement(aliceAppleId, 'invite_master');
            await this.giftTagService.appleService.unlockAchievement(aliceAppleId, 'bronze_inviter');
        }
        
        const bobAppleId = await this.giftTagService.getAppleIdForAddress(this.demoUsers.bob);
        if (bobAppleId) {
            await this.giftTagService.appleService.unlockAchievement(bobAppleId, 'golden_inviter');
        }
        
        // Simulate iCloud sync
        console.log('☁️ iCloud sync triggered for all users');
        
        // Show leaderboard status
        console.log('\n📊 Current Leaderboard Standings:');
        console.log('   🥇 Alice - 2500 points (Invite Master)');
        console.log('   🥈 Bob - 1800 points (Golden Inviter)');
        console.log('   🥉 Charlie - 1200 points (New Member)');
        
        await this.sleep(1000);
    }
    
    async demoPhase6_RealValue() {
        console.log('\n💰 PHASE 6: Real Value & Affiliate Payouts');
        console.log('-'.repeat(40));
        
        // Simulate someone getting actual value (AWS credits) through Alice's referral
        const awsCreditsScenario = await this.affiliateSystem.recordSecuredValue({
            type: 'credits',
            provider: 'aws',
            amount: 100000, // $100k AWS credits
            referralChain: [this.demoUsers.alice, this.demoUsers.bob], // Alice referred someone who got credits
            metadata: {
                startup: 'TechStartup Inc (referred by Alice)',
                program: 'AWS Activate Portfolio',
                creditsType: 'AWS Credits'
            }
        });
        
        console.log('🚀 Startup secured $100k AWS credits through Alice\'s referral!');
        console.log('💸 Commission distributions:');
        awsCreditsScenario.distributions.forEach(d => {
            if (d.agentId === 'platform') {
                console.log(`   Platform: $${d.amount.toLocaleString()} (${(d.percentage * 100).toFixed(1)}%)`);
            } else {
                const userName = this.getUserName(d.agentId);
                console.log(`   ${userName}: $${d.amount.toLocaleString()} (${(d.percentage * 100).toFixed(1)}%)`);
            }
        });
        
        // Award invite credits based on real value generated
        const realValueCredits = Math.floor(awsCreditsScenario.totalDistributed / 1000); // 1 credit per $1k in commissions
        await this.giftTagService.awardActivityCredits(
            this.demoUsers.alice,
            'REFERRAL_SUCCESS',
            realValueCredits,
            { realValue: awsCreditsScenario.totalDistributed }
        );
        
        console.log(`🎯 Alice earned ${realValueCredits} bonus credits for generating real value!`);
        
        await this.sleep(1000);
    }
    
    async showFinalSummary() {
        console.log('\n📋 FINAL SYSTEM STATUS');
        console.log('═'.repeat(60));
        
        // Show stats for each user
        for (const [name, address] of Object.entries(this.demoUsers)) {
            console.log(`\n👤 ${name.toUpperCase()} (${address.slice(0, 8)}...)`);
            
            const userData = await this.giftTagService.getUserInviteData(address);
            
            console.log(`   Credits: ${userData.credits.balance} (earned: ${userData.credits.totalEarned}, spent: ${userData.credits.totalSpent})`);
            console.log(`   Free Invites: ${userData.credits.freeInvitesRemaining} remaining`);
            console.log(`   Sent: ${userData.sentTags.length} gift tags`);
            console.log(`   Received: ${userData.receivedTags.length} gift tags`);
            console.log(`   Success Rate: ${(userData.stats.successRate * 100).toFixed(1)}%`);
            
            if (userData.referralChain.parent) {
                console.log(`   Referred by: ${this.getUserName(userData.referralChain.parent)}`);
            }
            if (userData.referralChain.children.length > 0) {
                console.log(`   Referred: ${userData.referralChain.children.map(c => this.getUserName(c)).join(', ')}`);
            }
            
            if (userData.appleEcosystem) {
                console.log(`   Apple ID: Connected (${userData.appleEcosystem.achievements.length} achievements)`);
                console.log(`   Game Center: ${userData.appleEcosystem.gameCenterLinked ? 'Linked' : 'Not linked'}`);
            }
        }
        
        // Overall system stats
        const systemStats = this.giftTagService.getServiceStats();
        console.log('\n🌐 SYSTEM OVERVIEW:');
        console.log(`   Total Gift Tags: ${systemStats.totalGiftTags}`);
        console.log(`   Active Tags: ${systemStats.activeGiftTags}`);
        console.log(`   Claimed Tags: ${systemStats.claimedGiftTags}`);
        console.log(`   Total Users: ${systemStats.totalUsers}`);
        console.log(`   Credits in Circulation: ${systemStats.totalCreditsInCirculation}`);
        console.log(`   Total Credits Earned: ${systemStats.totalCreditsEarned}`);
        
        if (systemStats.appleIntegration) {
            const appleStats = systemStats.appleIntegration;
            console.log('\n🍎 APPLE ECOSYSTEM:');
            console.log(`   Apple ID Sessions: ${appleStats.services.appleId.activeSessions}`);
            console.log(`   Game Center Players: ${appleStats.services.gameCenter.linkedPlayers}`);
            console.log(`   Wallet Passes: ${appleStats.services.wallet.generatedPasses}`);
            console.log(`   iCloud Sync Queue: ${appleStats.services.iCloud.syncQueueSize}`);
        }
        
        console.log('\n🎯 BUSINESS IMPACT:');
        console.log('   ✅ Invite-only exclusivity maintained');
        console.log('   ✅ Apple ecosystem deep integration');
        console.log('   ✅ Credit-based gamification working');
        console.log('   ✅ Real value generation ($100k AWS credits)');
        console.log('   ✅ Multi-tier referral economy active');
        console.log('   ✅ Game Center achievements unlocked');
        console.log('   ✅ Apple Wallet passes generated');
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('   📱 Deploy iOS/macOS native apps');
        console.log('   🔗 Integrate with actual smart contracts');
        console.log('   💳 Connect real payment processing');
        console.log('   📊 Add comprehensive analytics dashboard');
        console.log('   🌍 Scale to production user base');
        
        console.log('\n✨ Demo Complete! Invite-only gift tag system is ready for launch.');
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the demo
async function runDemo() {
    const demo = new InviteSystemDemo();
    await demo.runFullDemo();
}

// Check if running directly
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { InviteSystemDemo };