#!/usr/bin/env node

/**
 * 📊 API CALL GRADING SYSTEM
 * 
 * Tracks and grades external API usage during orchestration training
 * Provides detailed analytics on API call patterns
 * Helps identify opportunities to use internal systems instead
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class APICallGradingSystem extends EventEmitter {
    constructor() {
        super();
        
        console.log('📊 API CALL GRADING SYSTEM');
        console.log('==========================');
        console.log('Tracking external API usage');
        console.log('Promoting self-sufficiency');
        console.log('');
        
        // API call categories
        this.categories = {
            auth: { name: 'Authentication', weight: 0.8 },
            data: { name: 'Data Fetching', weight: 0.6 },
            validation: { name: 'Validation', weight: 0.3 },
            monitoring: { name: 'Monitoring', weight: 0.4 },
            external_service: { name: 'External Service', weight: 1.0 },
            unnecessary: { name: 'Unnecessary', weight: 2.0 } // Heavy penalty
        };
        
        // Tracked calls
        this.trackedCalls = [];
        
        // Grading scale
        this.gradingScale = {
            'A+': { max: 0, min: 0, color: '🟢', emoji: '🌟' },
            'A': { max: 2, min: 1, color: '🟢', emoji: '⭐' },
            'B': { max: 5, min: 3, color: '🟡', emoji: '👍' },
            'C': { max: 10, min: 6, color: '🟡', emoji: '📚' },
            'D': { max: 20, min: 11, color: '🟠', emoji: '⚠️' },
            'F': { max: Infinity, min: 21, color: '🔴', emoji: '❌' }
        };
        
        // Alternative suggestions for common external calls
        this.alternatives = this.loadAlternatives();
        
        // Performance metrics
        this.metrics = {
            startTime: null,
            endTime: null,
            totalCalls: 0,
            categorizedCalls: {},
            gradingHistory: []
        };
    }
    
    /**
     * Load alternative suggestions for external calls
     */
    loadAlternatives() {
        return {
            // Authentication
            'api.auth0.com': {
                category: 'auth',
                alternative: 'Use Soulfra identity system locally',
                localSystem: 'soulfra-identity',
                effort: 'low'
            },
            'accounts.google.com': {
                category: 'auth',
                alternative: 'Use native auth foundation system',
                localSystem: 'AUTH-FOUNDATION-SYSTEM.js',
                effort: 'low'
            },
            
            // AI/LLM APIs
            'api.openai.com': {
                category: 'external_service',
                alternative: 'Use local Ollama or agent orchestration',
                localSystem: 'FinishThisIdea orchestration',
                effort: 'medium'
            },
            'api.anthropic.com': {
                category: 'external_service',
                alternative: 'Use Teacher-Guided Agent System',
                localSystem: 'TEACHER-GUIDED-AGENT-SYSTEM.js',
                effort: 'medium'
            },
            
            // Database/Storage
            'api.mongodb.com': {
                category: 'data',
                alternative: 'Use local SQLite or unified substrate',
                localSystem: 'unified-substrate-query-engine',
                effort: 'low'
            },
            's3.amazonaws.com': {
                category: 'data',
                alternative: 'Use MinIO locally or IPFS-Arweave',
                localSystem: 'ipfs-arweave-wormhole',
                effort: 'medium'
            },
            
            // Validation
            'api.validator.com': {
                category: 'validation',
                alternative: 'Use local validation with Edit tools',
                localSystem: 'Edit/MultiEdit tools',
                effort: 'low'
            },
            
            // Monitoring
            'api.datadog.com': {
                category: 'monitoring',
                alternative: 'Use constellation monitoring system',
                localSystem: 'constellation-monitoring',
                effort: 'low'
            },
            
            // Generic patterns
            'api.*': {
                category: 'external_service',
                alternative: 'Check if functionality exists in internal systems first',
                localSystem: 'Various internal systems',
                effort: 'varies'
            }
        };
    }
    
    /**
     * Start grading session
     */
    startSession() {
        this.metrics.startTime = Date.now();
        this.trackedCalls = [];
        this.metrics.totalCalls = 0;
        
        // Reset categorized calls
        Object.keys(this.categories).forEach(cat => {
            this.metrics.categorizedCalls[cat] = 0;
        });
        
        console.log('🏁 Grading session started\n');
        this.emit('session-started', { timestamp: this.metrics.startTime });
    }
    
    /**
     * Track an API call
     */
    trackAPICall(callInfo) {
        const trackedCall = {
            id: this.trackedCalls.length + 1,
            timestamp: Date.now(),
            type: callInfo.type,
            target: callInfo.target,
            category: this.categorizeCall(callInfo.target),
            alternative: this.findAlternative(callInfo.target),
            stack: callInfo.stack || new Error().stack
        };
        
        this.trackedCalls.push(trackedCall);
        this.metrics.totalCalls++;
        this.metrics.categorizedCalls[trackedCall.category]++;
        
        // Real-time feedback
        this.provideRealTimeFeedback(trackedCall);
        
        this.emit('api-call-tracked', trackedCall);
        
        return trackedCall;
    }
    
    /**
     * Categorize API call
     */
    categorizeCall(target) {
        if (!target) return 'unnecessary';
        
        // Check against known alternatives
        for (const [pattern, info] of Object.entries(this.alternatives)) {
            if (pattern === 'api.*' && target.includes('api.')) {
                return info.category;
            }
            if (target.includes(pattern)) {
                return info.category;
            }
        }
        
        // Pattern matching for unknown APIs
        if (target.includes('auth') || target.includes('oauth')) return 'auth';
        if (target.includes('data') || target.includes('database')) return 'data';
        if (target.includes('valid')) return 'validation';
        if (target.includes('monitor') || target.includes('metric')) return 'monitoring';
        
        return 'external_service';
    }
    
    /**
     * Find alternative for API call
     */
    findAlternative(target) {
        if (!target) return null;
        
        // Direct match
        for (const [pattern, info] of Object.entries(this.alternatives)) {
            if (target.includes(pattern) && pattern !== 'api.*') {
                return info;
            }
        }
        
        // Generic match
        if (target.includes('api.')) {
            return this.alternatives['api.*'];
        }
        
        return null;
    }
    
    /**
     * Provide real-time feedback
     */
    provideRealTimeFeedback(call) {
        console.log(`\n🔔 API CALL #${call.id} DETECTED`);
        console.log(`   Target: ${call.target}`);
        console.log(`   Category: ${this.categories[call.category].name}`);
        console.log(`   Weight: ${this.categories[call.category].weight}x penalty`);
        
        if (call.alternative) {
            console.log(`\n   💡 ALTERNATIVE AVAILABLE:`);
            console.log(`      ${call.alternative.alternative}`);
            console.log(`      Local System: ${call.alternative.localSystem}`);
            console.log(`      Effort: ${call.alternative.effort}`);
        }
        
        // Show current grade projection
        const projection = this.calculateCurrentGrade();
        console.log(`\n   📊 Current Grade: ${projection.grade} ${projection.emoji}`);
    }
    
    /**
     * Calculate current grade
     */
    calculateCurrentGrade() {
        const weightedScore = this.calculateWeightedScore();
        
        for (const [grade, criteria] of Object.entries(this.gradingScale)) {
            if (weightedScore >= criteria.min && weightedScore <= criteria.max) {
                return {
                    grade,
                    score: weightedScore,
                    emoji: criteria.emoji,
                    color: criteria.color
                };
            }
        }
        
        return { grade: 'F', score: weightedScore, emoji: '❌', color: '🔴' };
    }
    
    /**
     * Calculate weighted score
     */
    calculateWeightedScore() {
        let score = 0;
        
        for (const [category, count] of Object.entries(this.metrics.categorizedCalls)) {
            const weight = this.categories[category]?.weight || 1.0;
            score += count * weight;
        }
        
        return score;
    }
    
    /**
     * End grading session and generate report
     */
    async endSession() {
        this.metrics.endTime = Date.now();
        const duration = this.metrics.endTime - this.metrics.startTime;
        
        console.log('\n🏁 Grading session ended\n');
        
        const report = this.generateReport();
        const grade = this.calculateFinalGrade();
        
        // Add to history
        this.metrics.gradingHistory.push({
            timestamp: this.metrics.startTime,
            duration,
            grade: grade.grade,
            totalCalls: this.metrics.totalCalls,
            breakdown: { ...this.metrics.categorizedCalls }
        });
        
        // Save detailed report
        await this.saveReport(report);
        
        this.emit('session-ended', { grade, report });
        
        return { grade, report };
    }
    
    /**
     * Calculate final grade
     */
    calculateFinalGrade() {
        const grade = this.calculateCurrentGrade();
        
        // Additional factors
        const factors = {
            allAvoidable: this.trackedCalls.every(call => call.alternative),
            usedInternalFirst: false, // Would need to track this
            learnedFromMistakes: this.checkLearningProgress()
        };
        
        // Apply bonuses/penalties
        if (factors.allAvoidable && grade.grade !== 'A+') {
            console.log('⚠️  Penalty: All calls had local alternatives available!');
            // Downgrade for not using available alternatives
        }
        
        if (factors.learnedFromMistakes) {
            console.log('✅ Bonus: Showed improvement during session!');
            // Small bonus for learning
        }
        
        return grade;
    }
    
    /**
     * Check if system learned during session
     */
    checkLearningProgress() {
        if (this.trackedCalls.length < 5) return false;
        
        // Check if API calls decreased over time
        const firstHalf = this.trackedCalls.slice(0, Math.floor(this.trackedCalls.length / 2));
        const secondHalf = this.trackedCalls.slice(Math.floor(this.trackedCalls.length / 2));
        
        const firstHalfAvg = firstHalf.length / (firstHalf[firstHalf.length-1]?.timestamp - firstHalf[0]?.timestamp || 1);
        const secondHalfAvg = secondHalf.length / (secondHalf[secondHalf.length-1]?.timestamp - secondHalf[0]?.timestamp || 1);
        
        return secondHalfAvg < firstHalfAvg;
    }
    
    /**
     * Generate detailed report
     */
    generateReport() {
        const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;
        const grade = this.calculateFinalGrade();
        
        const report = {
            summary: {
                grade: grade.grade,
                score: grade.score,
                totalCalls: this.metrics.totalCalls,
                duration: `${duration.toFixed(1)} seconds`,
                callsPerMinute: (this.metrics.totalCalls / (duration / 60)).toFixed(1)
            },
            
            breakdown: {
                byCategory: this.generateCategoryBreakdown(),
                byTarget: this.generateTargetBreakdown(),
                timeline: this.generateTimeline()
            },
            
            alternatives: {
                available: this.trackedCalls.filter(c => c.alternative).length,
                percentage: `${((this.trackedCalls.filter(c => c.alternative).length / this.metrics.totalCalls) * 100).toFixed(1)}%`,
                details: this.generateAlternativesSummary()
            },
            
            recommendations: this.generateRecommendations(),
            
            detailedCalls: this.trackedCalls.map(call => ({
                id: call.id,
                timestamp: new Date(call.timestamp).toISOString(),
                target: call.target,
                category: this.categories[call.category].name,
                hasAlternative: !!call.alternative,
                alternative: call.alternative?.alternative || 'None identified'
            }))
        };
        
        return report;
    }
    
    /**
     * Generate category breakdown
     */
    generateCategoryBreakdown() {
        const breakdown = {};
        
        for (const [category, count] of Object.entries(this.metrics.categorizedCalls)) {
            if (count > 0) {
                breakdown[this.categories[category].name] = {
                    count,
                    percentage: `${((count / this.metrics.totalCalls) * 100).toFixed(1)}%`,
                    weight: this.categories[category].weight,
                    contribution: count * this.categories[category].weight
                };
            }
        }
        
        return breakdown;
    }
    
    /**
     * Generate target breakdown
     */
    generateTargetBreakdown() {
        const targets = {};
        
        this.trackedCalls.forEach(call => {
            if (!targets[call.target]) {
                targets[call.target] = {
                    count: 0,
                    category: call.category,
                    hasAlternative: !!call.alternative
                };
            }
            targets[call.target].count++;
        });
        
        // Sort by count
        return Object.fromEntries(
            Object.entries(targets)
                .sort(([,a], [,b]) => b.count - a.count)
                .slice(0, 10) // Top 10
        );
    }
    
    /**
     * Generate timeline
     */
    generateTimeline() {
        const buckets = 10; // 10 time buckets
        const duration = this.metrics.endTime - this.metrics.startTime;
        const bucketSize = duration / buckets;
        
        const timeline = Array(buckets).fill(0);
        
        this.trackedCalls.forEach(call => {
            const timeSinceStart = call.timestamp - this.metrics.startTime;
            const bucket = Math.min(Math.floor(timeSinceStart / bucketSize), buckets - 1);
            timeline[bucket]++;
        });
        
        return timeline.map((count, i) => ({
            bucket: i + 1,
            calls: count,
            timeRange: `${(i * bucketSize / 1000).toFixed(1)}s - ${((i + 1) * bucketSize / 1000).toFixed(1)}s`
        }));
    }
    
    /**
     * Generate alternatives summary
     */
    generateAlternativesSummary() {
        const summary = {};
        
        this.trackedCalls.forEach(call => {
            if (call.alternative) {
                const system = call.alternative.localSystem;
                if (!summary[system]) {
                    summary[system] = {
                        couldReplace: 0,
                        effort: call.alternative.effort,
                        targets: []
                    };
                }
                summary[system].couldReplace++;
                if (!summary[system].targets.includes(call.target)) {
                    summary[system].targets.push(call.target);
                }
            }
        });
        
        return summary;
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const grade = this.calculateFinalGrade();
        
        // Grade-specific recommendations
        if (grade.grade === 'F') {
            recommendations.push('CRITICAL: Excessive external API usage detected');
            recommendations.push('Review all available internal systems before making external calls');
        } else if (grade.grade === 'D' || grade.grade === 'C') {
            recommendations.push('Many external calls could be avoided');
            recommendations.push('Focus on using local alternatives first');
        } else if (grade.grade === 'B') {
            recommendations.push('Good progress, but room for improvement');
            recommendations.push('Review the alternatives for your most common API calls');
        } else if (grade.grade === 'A') {
            recommendations.push('Excellent minimal API usage');
            recommendations.push('Consider if the remaining calls are truly necessary');
        } else if (grade.grade === 'A+') {
            recommendations.push('Perfect! No external API calls made');
            recommendations.push('Share this approach with other systems');
        }
        
        // Category-specific recommendations
        const topCategory = Object.entries(this.metrics.categorizedCalls)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (topCategory && topCategory[1] > 0) {
            const catName = this.categories[topCategory[0]].name;
            recommendations.push(`Most calls were for ${catName} - prioritize local alternatives for this`);
        }
        
        // Alternative-specific recommendations
        const alternativesAvailable = this.trackedCalls.filter(c => c.alternative).length;
        if (alternativesAvailable > 0) {
            recommendations.push(`${alternativesAvailable} calls had local alternatives available`);
            
            // Most common alternative
            const altSummary = this.generateAlternativesSummary();
            const topAlt = Object.entries(altSummary)
                .sort(([,a], [,b]) => b.couldReplace - a.couldReplace)[0];
            
            if (topAlt) {
                recommendations.push(`Consider using ${topAlt[0]} - could replace ${topAlt[1].couldReplace} calls`);
            }
        }
        
        return recommendations;
    }
    
    /**
     * Save report to file
     */
    async saveReport(report) {
        const filename = `api-grading-report-${Date.now()}.json`;
        const filepath = path.join('.', filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        
        console.log(`\n📄 Detailed report saved to: ${filename}`);
        
        // Also create a human-readable summary
        const summaryFilename = `api-grading-summary-${Date.now()}.txt`;
        const summary = this.generateHumanReadableSummary(report);
        
        await fs.writeFile(summaryFilename, summary);
        console.log(`📋 Summary saved to: ${summaryFilename}`);
    }
    
    /**
     * Generate human-readable summary
     */
    generateHumanReadableSummary(report) {
        const grade = report.summary.grade;
        const gradeInfo = this.gradingScale[grade];
        
        let summary = `API CALL GRADING REPORT\n`;
        summary += `======================\n\n`;
        
        summary += `FINAL GRADE: ${grade} ${gradeInfo.emoji}\n`;
        summary += `Score: ${report.summary.score} (${report.summary.totalCalls} total calls)\n`;
        summary += `Duration: ${report.summary.duration}\n`;
        summary += `Rate: ${report.summary.callsPerMinute} calls/minute\n\n`;
        
        summary += `BREAKDOWN BY CATEGORY:\n`;
        for (const [category, data] of Object.entries(report.breakdown.byCategory)) {
            summary += `  ${category}: ${data.count} calls (${data.percentage})\n`;
        }
        
        summary += `\nALTERNATIVES:\n`;
        summary += `  ${report.alternatives.available} of ${report.summary.totalCalls} calls had local alternatives (${report.alternatives.percentage})\n`;
        
        if (Object.keys(report.alternatives.details).length > 0) {
            summary += `\n  Recommended Local Systems:\n`;
            for (const [system, data] of Object.entries(report.alternatives.details)) {
                summary += `    - ${system}: Could replace ${data.couldReplace} calls (${data.effort} effort)\n`;
            }
        }
        
        summary += `\nRECOMMENDATIONS:\n`;
        report.recommendations.forEach((rec, i) => {
            summary += `  ${i + 1}. ${rec}\n`;
        });
        
        summary += `\n${'='.repeat(50)}\n`;
        summary += `Remember: Every external API call is an opportunity to use internal systems!\n`;
        
        return summary;
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return {
            currentGrade: this.calculateCurrentGrade(),
            totalCalls: this.metrics.totalCalls,
            breakdown: this.metrics.categorizedCalls,
            sessionActive: !!this.metrics.startTime && !this.metrics.endTime,
            history: this.metrics.gradingHistory
        };
    }
}

// Export for use in training system
module.exports = APICallGradingSystem;

// Run standalone for testing
if (require.main === module) {
    const grader = new APICallGradingSystem();
    
    console.log('🧪 API Call Grading System Test\n');
    
    grader.startSession();
    
    // Simulate some API calls
    const testCalls = [
        { type: 'https', target: 'api.openai.com/v1/completions' },
        { type: 'https', target: 'api.auth0.com/oauth/token' },
        { type: 'https', target: 'api.mongodb.com/data/v1' },
        { type: 'http', target: 'localhost:3000/api/test' }, // Internal
        { type: 'https', target: 'api.stripe.com/v1/charges' },
        { type: 'https', target: 'api.validator.com/validate' }
    ];
    
    console.log('Simulating API calls...\n');
    
    testCalls.forEach((call, i) => {
        setTimeout(() => {
            grader.trackAPICall(call);
            
            if (i === testCalls.length - 1) {
                setTimeout(async () => {
                    const result = await grader.endSession();
                    console.log('\n✅ Test complete!');
                }, 1000);
            }
        }, i * 500);
    });
}