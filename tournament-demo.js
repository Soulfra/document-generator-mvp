#!/usr/bin/env node

/**
 * TOURNAMENT AI DEMONSTRATION
 * Visual demonstration of how prompts flow through tournament-style competition
 * Shows the poker-style knowledge accumulation
 */

const chalk = require('chalk');
const boxen = require('boxen');
const Table = require('cli-table3');
const TournamentAIRouter = require('./tournament-ai-router');
const TournamentQuestBridge = require('./tournament-quest-bridge');

class TournamentDemo {
    constructor() {
        this.router = new TournamentAIRouter({
            bracketSize: 8,
            roundTimeLimit: 5000 // Faster for demo
        });
        
        this.setupEventHandlers();
    }
    
    async runDemo() {
        console.clear();
        this.printHeader();
        
        const query = "How should AI agents compete to find the best solution, where the winner takes all knowledge?";
        
        console.log(chalk.cyan('\n📝 Query:'), chalk.white(query));
        console.log(chalk.gray('\nPress Enter to start tournament...'));
        await this.waitForEnter();
        
        // Run tournament with visual updates
        const result = await this.router.processQuery(query, {
            demo: true
        });
        
        this.printFinalResults(result);
    }
    
    printHeader() {
        const header = boxen(
            chalk.bold.yellow('🏆 TOURNAMENT-STYLE AI PROCESSING SYSTEM 🏆\n') +
            chalk.cyan('Tower → Citadel → 3v3 Units → Finals → Boss\n') +
            chalk.gray('Winner takes all knowledge (like poker chips)'),
            {
                padding: 1,
                margin: 1,
                borderStyle: 'double',
                borderColor: 'yellow'
            }
        );
        console.log(header);
    }
    
    setupEventHandlers() {
        // Tournament start
        this.router.on('tournament:start', (data) => {
            console.log(chalk.green('\n🎯 TOURNAMENT STARTED!'));
            this.printBrackets(data.brackets);
        });
        
        // Round updates
        this.router.on('tournament:round', (data) => {
            console.log(chalk.blue(`\n🥊 ROUND ${data.round} COMPLETE`));
            this.printRoundResults(data);
        });
        
        // Match results
        this.currentMatches = new Map();
        
        // Override match execution to show live updates
        const originalRunMatch = this.router.runMatch.bind(this.router);
        this.router.runMatch = async (match, tournament) => {
            this.printMatchStart(match);
            const result = await originalRunMatch(match, tournament);
            this.printMatchResult(result);
            return result;
        };
        
        // Tournament complete
        this.router.on('tournament:complete', (data) => {
            console.log(chalk.green.bold('\n🏅 TOURNAMENT COMPLETE!'));
        });
    }
    
    printBrackets(brackets) {
        console.log(chalk.yellow('\n📊 Initial Brackets:'));
        
        const table = new Table({
            head: ['Match', 'Unit 1', 'VS', 'Unit 2'],
            style: { head: ['cyan'] }
        });
        
        brackets.forEach((bracket, i) => {
            table.push([
                `Match ${i + 1}`,
                this.getUnitDisplay(bracket.unit1),
                '⚔️',
                this.getUnitDisplay(bracket.unit2)
            ]);
        });
        
        console.log(table.toString());
    }
    
    printMatchStart(match) {
        console.log(chalk.gray(`\n  Starting: ${match.unit1.name} vs ${match.unit2.name}...`));
    }
    
    printMatchResult(result) {
        const winnerDisplay = chalk.green(`✅ ${result.winner.name}`);
        const loserDisplay = chalk.red(`❌ ${result.loser.name}`);
        
        console.log(`  Result: ${winnerDisplay} defeats ${loserDisplay}`);
        console.log(chalk.gray(`  Score: ${result.scores.winner.toFixed(2)} vs ${result.scores.loser.toFixed(2)}`));
        
        // Show inventory transfer
        const inventoryGained = result.loser.inventory.size;
        console.log(chalk.yellow(`  💰 ${result.winner.name} gains ${inventoryGained} knowledge items!`));
        console.log(chalk.cyan(`  📦 Total inventory: ${result.winner.inventory.size} items`));
    }
    
    printRoundResults(roundData) {
        console.log(chalk.blue(`\nRemaining Units: ${roundData.winners.length}`));
        
        if (roundData.winners.length > 1) {
            const table = new Table({
                head: ['Unit', 'Approach', 'Inventory', 'Confidence'],
                style: { head: ['cyan'] }
            });
            
            roundData.winners.forEach(unit => {
                table.push([
                    unit.name,
                    unit.approach,
                    `${unit.inventory.size} items`,
                    `${(unit.confidence * 100).toFixed(0)}%`
                ]);
            });
            
            console.log(table.toString());
        }
    }
    
    printFinalResults(result) {
        const winner = result.winner;
        
        // Final boss display
        const bossBox = boxen(
            chalk.bold.yellow('👑 FINAL BOSS EMERGED 👑\n\n') +
            chalk.white(`Name: ${chalk.bold(winner.name)}\n`) +
            chalk.white(`Approach: ${chalk.cyan(winner.response.approach)}\n`) +
            chalk.white(`Confidence: ${chalk.green((winner.confidence * 100).toFixed(0) + '%')}\n`) +
            chalk.white(`Total Knowledge: ${chalk.yellow(winner.inventory.length + ' items')}\n`),
            {
                padding: 1,
                borderStyle: 'double',
                borderColor: 'yellow'
            }
        );
        
        console.log('\n' + bossBox);
        
        // Inventory breakdown
        console.log(chalk.cyan('\n📦 Final Inventory Contents:'));
        
        const inventoryTable = new Table({
            head: ['Type', 'Item', 'Source'],
            style: { head: ['cyan'] },
            colWidths: [20, 40, 30]
        });
        
        let eliminatedCount = 0;
        let knowledgeCount = 0;
        let responseCount = 0;
        
        winner.inventory.forEach(([key, value]) => {
            if (key.startsWith('eliminated-')) {
                eliminatedCount++;
                const unit = value;
                inventoryTable.push([
                    chalk.red('Eliminated Unit'),
                    unit.name,
                    `${unit.approach} approach`
                ]);
            } else if (key.includes('response')) {
                responseCount++;
            } else {
                knowledgeCount++;
            }
        });
        
        console.log(inventoryTable.toString());
        
        // Summary stats
        console.log(chalk.yellow('\n📊 Knowledge Summary:'));
        console.log(`  ${chalk.red('Defeated Units:')} ${eliminatedCount}`);
        console.log(`  ${chalk.blue('Response Fragments:')} ${responseCount}`);
        console.log(`  ${chalk.green('Knowledge Items:')} ${knowledgeCount}`);
        console.log(`  ${chalk.yellow('Total Inventory:')} ${winner.inventory.length} items`);
        
        // Final response preview
        console.log(chalk.cyan('\n📝 Final Synthesized Response:'));
        console.log(boxen(
            winner.response.content || 'Complete synthesis of all tournament knowledge...',
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'cyan'
            }
        ));
        
        // Tournament stats
        console.log(chalk.gray('\n📈 Tournament Statistics:'));
        console.log(`  Duration: ${result.duration}ms`);
        console.log(`  Total Rounds: ${result.rounds}`);
        console.log(`  Participants: ${result.participants}`);
        console.log(`  Tournament ID: ${result.tournamentId}`);
    }
    
    getUnitDisplay(unit) {
        const approachColors = {
            'analytical': 'blue',
            'creative': 'magenta',
            'critical': 'red',
            'synthesis': 'yellow',
            'pattern-matching': 'cyan',
            'contextual': 'green',
            'code-generation': 'white',
            'logical-reasoning': 'gray'
        };
        
        const color = approachColors[unit.approach] || 'white';
        return chalk[color](unit.name);
    }
    
    async waitForEnter() {
        return new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
    }
}

// Run demo
if (require.main === module) {
    // Check if chalk is installed
    try {
        require.resolve('chalk');
        require.resolve('boxen');
        require.resolve('cli-table3');
    } catch (e) {
        console.log('Installing required packages for demo...');
        require('child_process').execSync('npm install chalk boxen cli-table3', {
            stdio: 'inherit'
        });
    }
    
    const demo = new TournamentDemo();
    demo.runDemo().catch(console.error);
}