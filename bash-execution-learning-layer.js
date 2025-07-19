#!/usr/bin/env node

/**
 * BASH EXECUTION LEARNING LAYER
 * The "aha moment" layer where you realize you're actually learning real coding
 * chmod, curl, grep, docker, git - all the actual power tools
 * This is your CryptoZombies moment but for REAL systems
 */

const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const { EventEmitter } = require('events');
const util = require('util');
const execPromise = util.promisify(exec);

console.log(`
🧠⚡ BASH EXECUTION LEARNING LAYER ⚡🧠
chmod → curl → grep → docker → git → HOLY SHIT I'M ACTUALLY CODING
`);

class BashExecutionLearningLayer extends EventEmitter {
  constructor() {
    super();
    this.learningPath = new Map();
    this.bashCommands = new Map();
    this.realWorldUsage = new Map();
    this.progressTracker = new Map();
    this.cryptoZombiesButReal = new Map();
    this.skillUnlocks = new Map();
    this.powerLevel = 0;
    
    this.initializeLearningLayer();
  }

  async initializeLearningLayer() {
    console.log('🧠 Initializing your coding evolution...');
    
    // Set up learning progression
    await this.setupLearningProgression();
    
    // Create practical bash command library
    await this.createPracticalBashLibrary();
    
    // Build real-world usage examples
    await this.buildRealWorldExamples();
    
    // Initialize progress tracking
    await this.initializeProgressTracking();
    
    // Create the "holy shit" moments system
    await this.createHolyShitMoments();
    
    // Set up skill unlock system
    await this.setupSkillUnlocks();
    
    console.log('✅ Learning layer ready - time to bash some code!');
  }

  async setupLearningProgression() {
    console.log('📚 Setting up your coding journey...');
    
    const learningLevels = {
      'level_1_file_system': {
        description: 'Master the file system - you are here',
        commands: {
          'ls': {
            purpose: 'List files and directories',
            examples: [
              'ls -la  # Show all files with permissions',
              'ls *.js  # Show only JavaScript files',
              'ls -lh  # Human readable file sizes'
            ],
            real_use: 'Finding what files exist in your project'
          },
          
          'chmod': {
            purpose: 'Change file permissions - POWER MOVE',
            examples: [
              'chmod +x script.js  # Make file executable',
              'chmod 755 file.txt  # Read/write/execute for owner, read/execute for others',
              'chmod -R 644 docs/  # Recursively set permissions'
            ],
            real_use: 'Making your scripts actually run, securing files',
            holy_shit_moment: 'When you realize you can control WHO can run/read/write ANY file'
          },
          
          'find': {
            purpose: 'Search for files everywhere',
            examples: [
              'find . -name "*.js"  # Find all JavaScript files',
              'find /var -size +100M  # Find files bigger than 100MB',
              'find . -type f -exec grep -l "TODO" {} \\;  # Find files containing TODO'
            ],
            real_use: 'Finding that one file you need across thousands',
            holy_shit_moment: 'When you search your entire computer in seconds'
          }
        }
      },
      
      'level_2_text_processing': {
        description: 'Manipulate text like a wizard',
        commands: {
          'grep': {
            purpose: 'Search text patterns - THE POWER TOOL',
            examples: [
              'grep "error" logs.txt  # Find lines containing "error"',
              'grep -r "function" src/  # Search recursively in src folder',
              'grep -i "api" *.js | head -10  # Case insensitive, first 10 results'
            ],
            real_use: 'Finding bugs, searching code, analyzing logs',
            holy_shit_moment: 'When you realize you can search ANYTHING in seconds'
          },
          
          'sed': {
            purpose: 'Edit text in streams - NINJA LEVEL',
            examples: [
              'sed "s/old/new/g" file.txt  # Replace all "old" with "new"',
              'sed -i "s/localhost/production/g" config.js  # Edit file in place',
              'sed -n "10,20p" file.txt  # Print lines 10-20'
            ],
            real_use: 'Mass editing config files, data transformation',
            holy_shit_moment: 'When you edit 1000 files in one command'
          },
          
          'awk': {
            purpose: 'Process structured data - MATRIX LEVEL',
            examples: [
              'awk "{print $1}" file.txt  # Print first column',
              'awk -F"," "{print $2}" data.csv  # CSV processing',
              'ps aux | awk "{print $1, $11}"  # Process list formatting'
            ],
            real_use: 'Data analysis, log processing, CSV manipulation',
            holy_shit_moment: 'When you realize this is basically Excel but FASTER'
          }
        }
      },
      
      'level_3_network_web': {
        description: 'Control the internet',
        commands: {
          'curl': {
            purpose: 'Talk to any API or website - INTERNET POWER',
            examples: [
              'curl https://api.github.com/users/octocat  # GET request',
              'curl -X POST -H "Content-Type: application/json" -d \'{"name":"test"}\' api.com  # POST data',
              'curl -I https://google.com  # Just headers',
              'curl -o file.pdf https://example.com/doc.pdf  # Download file'
            ],
            real_use: 'API testing, downloading files, web scraping',
            holy_shit_moment: 'When you realize you can control ANY website from terminal'
          },
          
          'wget': {
            purpose: 'Download anything from the internet',
            examples: [
              'wget https://example.com/file.zip  # Download file',
              'wget -r https://site.com  # Download entire website',
              'wget --mirror --no-parent https://docs.site.com  # Mirror documentation'
            ],
            real_use: 'Downloading files, mirroring websites, backups'
          },
          
          'ssh': {
            purpose: 'Control remote computers - HACKER LEVEL',
            examples: [
              'ssh user@server.com  # Connect to remote server',
              'ssh -L 8080:localhost:80 server.com  # Port forwarding',
              'scp file.txt user@server:/path/  # Copy files to remote'
            ],
            real_use: 'Managing servers, deploying code, remote work',
            holy_shit_moment: 'When you control a computer on the other side of the world'
          }
        }
      },
      
      'level_4_containers_orchestration': {
        description: 'Build and deploy like the pros',
        commands: {
          'docker': {
            purpose: 'Package apps in containers - DEPLOYMENT POWER',
            examples: [
              'docker build -t my-app .  # Build container image',
              'docker run -p 8080:80 my-app  # Run container with port mapping',
              'docker ps  # List running containers',
              'docker exec -it container_id bash  # Enter running container'
            ],
            real_use: 'Consistent deployments, isolation, microservices',
            holy_shit_moment: 'When your app runs EXACTLY the same everywhere'
          },
          
          'docker-compose': {
            purpose: 'Orchestrate multiple containers - ARCHITECTURE LEVEL',
            examples: [
              'docker-compose up -d  # Start all services',
              'docker-compose logs -f app  # Follow logs for app service',
              'docker-compose scale web=3  # Scale web service to 3 instances'
            ],
            real_use: 'Full application stacks, development environments'
          },
          
          'git': {
            purpose: 'Version control - COLLABORATION SUPERPOWER',
            examples: [
              'git add .  # Stage all changes',
              'git commit -m "Add feature"  # Save changes with message',
              'git push origin main  # Upload to remote repository',
              'git pull  # Download latest changes',
              'git branch feature  # Create new branch',
              'git merge feature  # Merge branch into current'
            ],
            real_use: 'Code history, collaboration, deployment',
            holy_shit_moment: 'When you realize you can work with anyone on any code'
          }
        }
      },
      
      'level_5_monitoring_automation': {
        description: 'Make computers work FOR you',
        commands: {
          'systemctl': {
            purpose: 'Control system services - SYSTEM ADMIN POWER',
            examples: [
              'systemctl start nginx  # Start nginx service',
              'systemctl enable mysql  # Auto-start mysql on boot',
              'systemctl status docker  # Check service status'
            ],
            real_use: 'Managing servers, ensuring uptime'
          },
          
          'crontab': {
            purpose: 'Schedule tasks - AUTOMATION NINJA',
            examples: [
              'crontab -e  # Edit scheduled tasks',
              '0 2 * * * /script.sh  # Run script daily at 2 AM',
              '*/5 * * * * /check.sh  # Run script every 5 minutes'
            ],
            real_use: 'Backups, monitoring, data processing',
            holy_shit_moment: 'When your computer does work while you sleep'
          },
          
          'tmux': {
            purpose: 'Multiple terminal sessions - PRODUCTIVITY HACK',
            examples: [
              'tmux new -s work  # Create named session',
              'tmux attach -t work  # Reconnect to session',
              'Ctrl+b c  # Create new window in session'
            ],
            real_use: 'Managing multiple processes, remote work'
          }
        }
      }
    };
    
    this.learningPath.set('levels', learningLevels);
  }

  async createPracticalBashLibrary() {
    console.log('🔧 Creating your practical bash toolkit...');
    
    const bashLibrary = {
      'real_world_scenarios': {
        'deploy_app': {
          description: 'Deploy a web application',
          commands: [
            'git pull origin main  # Get latest code',
            'npm install  # Install dependencies',
            'npm run build  # Build for production',
            'docker build -t my-app:latest .  # Create container',
            'docker stop my-app || true  # Stop old container',
            'docker run -d --name my-app -p 80:3000 my-app:latest  # Start new container',
            'docker ps  # Verify it\'s running'
          ],
          holy_shit_factor: 'You just deployed a web app like a senior developer'
        },
        
        'debug_performance': {
          description: 'Find what\'s slowing down your app',
          commands: [
            'top  # See CPU and memory usage',
            'ps aux | grep node  # Find Node.js processes',
            'netstat -an | grep :3000  # Check if port is open',
            'docker logs my-app | tail -100  # Check recent logs',
            'curl -w "%{time_total}" http://localhost:3000  # Measure response time'
          ],
          holy_shit_factor: 'You\'re debugging like a DevOps engineer'
        },
        
        'backup_and_restore': {
          description: 'Backup your database and files',
          commands: [
            'mysqldump -u user -p database > backup.sql  # Backup MySQL',
            'tar -czf backup.tar.gz /important/files  # Backup files',
            'rsync -av source/ destination/  # Sync directories',
            'aws s3 cp backup.tar.gz s3://my-bucket/  # Upload to cloud'
          ],
          holy_shit_factor: 'You\'re protecting data like a system administrator'
        },
        
        'monitor_security': {
          description: 'Check if your system is secure',
          commands: [
            'last  # See who logged in recently',
            'netstat -an | grep LISTEN  # See what ports are open',
            'ps aux | grep -v grep | grep -E "(nc|netcat|nmap)"  # Check for suspicious processes',
            'find /tmp -name "*.sh" -mtime -1  # Find recent scripts in temp',
            'fail2ban-client status  # Check firewall status'
          ],
          holy_shit_factor: 'You\'re doing security analysis like a cybersecurity expert'
        }
      },
      
      'power_combinations': {
        'find_and_replace_everywhere': {
          command: 'find . -name "*.js" -exec sed -i "s/oldFunction/newFunction/g" {} \\;',
          explanation: 'Find all JS files and replace function name everywhere',
          power_level: 'WIZARD'
        },
        
        'monitor_logs_live': {
          command: 'tail -f /var/log/app.log | grep -i error | while read line; do echo "$(date): $line"; done',
          explanation: 'Watch logs in real-time and timestamp errors',
          power_level: 'NINJA'
        },
        
        'backup_with_rotation': {
          command: 'tar -czf backup-$(date +%Y%m%d).tar.gz /data && find /backups -name "backup-*.tar.gz" -mtime +7 -delete',
          explanation: 'Create dated backup and delete old ones',
          power_level: 'PROFESSIONAL'
        }
      }
    };
    
    this.bashCommands.set('library', bashLibrary);
  }

  async buildRealWorldExamples() {
    console.log('🌍 Building real-world examples...');
    
    const realExamples = {
      'startup_scenarios': {
        'launch_mvp': {
          situation: 'You built an app, now you need to deploy it',
          steps: [
            { cmd: 'git status', why: 'See what files changed' },
            { cmd: 'git add .', why: 'Stage all changes' },
            { cmd: 'git commit -m "Ready for production"', why: 'Save this version' },
            { cmd: 'git push origin main', why: 'Upload to GitHub' },
            { cmd: 'ssh user@yourserver.com', why: 'Connect to your server' },
            { cmd: 'git pull origin main', why: 'Download code to server' },
            { cmd: 'npm install --production', why: 'Install only production dependencies' },
            { cmd: 'pm2 start app.js', why: 'Start app with process manager' },
            { cmd: 'pm2 status', why: 'Verify it\'s running' }
          ],
          outcome: 'Your app is now live on the internet!'
        },
        
        'fix_production_bug': {
          situation: 'Users reporting errors, you need to debug FAST',
          steps: [
            { cmd: 'ssh user@yourserver.com', why: 'Get on the server' },
            { cmd: 'pm2 logs --err', why: 'See error logs' },
            { cmd: 'grep -n "Error" /var/log/app.log | tail -20', why: 'Find recent errors' },
            { cmd: 'top', why: 'Check if server is overloaded' },
            { cmd: 'df -h', why: 'Check if disk is full' },
            { cmd: 'git log --oneline -10', why: 'See recent code changes' },
            { cmd: 'git checkout HEAD~1', why: 'Rollback to previous version if needed' },
            { cmd: 'pm2 restart app', why: 'Restart the application' }
          ],
          outcome: 'Bug fixed, users happy, you look like a hero!'
        }
      },
      
      'freelancer_scenarios': {
        'client_wants_backup': {
          situation: 'Client asks: "Can you backup our website?"',
          steps: [
            { cmd: 'wget --mirror --no-parent https://client-site.com', why: 'Download entire website' },
            { cmd: 'mysqldump -u user -p client_db > database_backup.sql', why: 'Backup their database' },
            { cmd: 'tar -czf client_backup_$(date +%Y%m%d).tar.gz website/ database_backup.sql', why: 'Package everything' },
            { cmd: 'aws s3 cp client_backup_*.tar.gz s3://backups/', why: 'Store safely in cloud' }
          ],
          outcome: 'Client data is safe, you get paid!'
        }
      },
      
      'job_interview_scenarios': {
        'show_docker_skills': {
          question: 'Interviewer: "How would you containerize this Node.js app?"',
          your_answer: [
            { cmd: 'cat > Dockerfile << EOF', why: 'Create Dockerfile' },
            { cmd: 'FROM node:alpine', why: 'Use lightweight base image' },
            { cmd: 'WORKDIR /app', why: 'Set working directory' },
            { cmd: 'COPY package*.json ./', why: 'Copy package files first for caching' },
            { cmd: 'RUN npm install', why: 'Install dependencies' },
            { cmd: 'COPY . .', why: 'Copy application code' },
            { cmd: 'EXPOSE 3000', why: 'Document port usage' },
            { cmd: 'CMD ["npm", "start"]', why: 'Define startup command' },
            { cmd: 'EOF', why: 'End Dockerfile' },
            { cmd: 'docker build -t myapp .', why: 'Build the image' },
            { cmd: 'docker run -p 3000:3000 myapp', why: 'Run the container' }
          ],
          outcome: 'Interviewer is impressed, you get the job!'
        }
      }
    };
    
    this.realWorldUsage.set('examples', realExamples);
  }

  async initializeProgressTracking() {
    console.log('📊 Setting up your progress tracking...');
    
    const progressSystem = {
      'skill_levels': {
        'chmod_mastery': {
          beginner: 'Can make files executable',
          intermediate: 'Understands permission numbers (755, 644)',
          advanced: 'Uses chmod recursively and with find',
          expert: 'Writes secure deployment scripts'
        },
        
        'curl_mastery': {
          beginner: 'Can download files',
          intermediate: 'Can make POST requests with data',
          advanced: 'Handles authentication and headers',
          expert: 'Builds API testing suites'
        },
        
        'docker_mastery': {
          beginner: 'Can run existing containers',
          intermediate: 'Writes Dockerfiles',
          advanced: 'Uses docker-compose for multi-service apps',
          expert: 'Orchestrates production deployments'
        }
      },
      
      'achievement_unlocks': {
        'first_chmod': 'Made your first file executable',
        'first_curl': 'Made your first API request',
        'first_grep': 'Found a needle in a haystack',
        'first_docker': 'Containerized an application',
        'first_deploy': 'Deployed to production',
        'first_debug': 'Fixed a production bug',
        'automation_ninja': 'Wrote your first automation script',
        'security_aware': 'Implemented security best practices',
        'full_stack_ops': 'Can deploy and maintain full applications'
      }
    };
    
    this.progressTracker.set('system', progressSystem);
  }

  async createHolyShitMoments() {
    console.log('💡 Creating your "holy shit" moment system...');
    
    const holyShitMoments = {
      'realization_levels': {
        'level_1_files': {
          moment: 'When you realize you can control every file on the computer',
          trigger_commands: ['chmod', 'find', 'ls -la'],
          thought: 'Holy shit, I can see and control EVERYTHING'
        },
        
        'level_2_text': {
          moment: 'When you grep through thousands of files in seconds',
          trigger_commands: ['grep -r', 'find | xargs grep'],
          thought: 'Holy shit, I can search ANYTHING instantly'
        },
        
        'level_3_network': {
          moment: 'When you curl an API and get data back',
          trigger_commands: ['curl', 'wget'],
          thought: 'Holy shit, I can talk to any computer on the internet'
        },
        
        'level_4_containers': {
          moment: 'When your dockerized app runs exactly the same everywhere',
          trigger_commands: ['docker build', 'docker run'],
          thought: 'Holy shit, "works on my machine" is now "works everywhere"'
        },
        
        'level_5_automation': {
          moment: 'When your cron job runs while you sleep and fixes problems',
          trigger_commands: ['crontab', 'systemctl'],
          thought: 'Holy shit, computers are working FOR me now'
        },
        
        'level_6_orchestration': {
          moment: 'When you deploy with one command and it just works',
          trigger_commands: ['docker-compose up', 'kubernetes apply'],
          thought: 'Holy shit, I\'m running a tech company\'s infrastructure'
        }
      },
      
      'crypto_zombies_comparison': {
        'crypto_zombies': 'Taught you Solidity syntax in a game',
        'this_system': 'Teaching you REAL system administration through practical examples',
        
        'progression_comparison': {
          'crypto_zombies_path': [
            'Learn Solidity syntax',
            'Create zombie contracts', 
            'Battle system',
            'Marketplace',
            'Advanced features'
          ],
          
          'our_path': [
            'Learn bash commands',
            'Deploy real applications',
            'Debug production systems',
            'Automate operations',
            'Build and run companies'
          ]
        },
        
        'outcome_difference': {
          'crypto_zombies': 'You can write smart contracts',
          'our_system': 'You can BUILD, DEPLOY, and RUN entire technology companies'
        }
      }
    };
    
    this.cryptoZombiesButReal.set('moments', holyShitMoments);
  }

  async setupSkillUnlocks() {
    console.log('🔓 Setting up skill unlock system...');
    
    const skillTree = {
      'command_mastery_tree': {
        'file_system_branch': {
          'ls': { unlocks: ['find', 'chmod'], power: 10 },
          'chmod': { unlocks: ['chown', 'umask'], power: 25 },
          'find': { unlocks: ['grep'], power: 50 }
        },
        
        'text_processing_branch': {
          'grep': { unlocks: ['sed', 'awk'], power: 75 },
          'sed': { unlocks: ['regex mastery'], power: 100 },
          'awk': { unlocks: ['data wizard'], power: 150 }
        },
        
        'network_branch': {
          'curl': { unlocks: ['wget', 'ssh'], power: 200 },
          'ssh': { unlocks: ['scp', 'rsync'], power: 300 },
          'advanced_networking': { unlocks: ['devops roles'], power: 500 }
        },
        
        'container_branch': {
          'docker': { unlocks: ['docker-compose', 'kubernetes'], power: 750 },
          'docker-compose': { unlocks: ['microservices'], power: 1000 },
          'kubernetes': { unlocks: ['cloud architect'], power: 2000 }
        }
      },
      
      'career_progression': {
        100: 'Can fix basic server issues',
        500: 'Can deploy applications',
        1000: 'Can manage production systems',
        2000: 'Can architect cloud infrastructure',
        5000: 'Can run a tech company\'s entire infrastructure'
      }
    };
    
    this.skillUnlocks.set('tree', skillTree);
  }

  async executeCommand(command, explanation = '') {
    console.log(`\n🔨 EXECUTING: ${command}`);
    if (explanation) console.log(`💡 WHY: ${explanation}`);
    
    try {
      const { stdout, stderr } = await execPromise(command);
      console.log(`✅ OUTPUT:\n${stdout}`);
      
      if (stderr) {
        console.log(`⚠️ WARNINGS:\n${stderr}`);
      }
      
      // Track command execution for progress
      await this.trackCommandExecution(command);
      
      return { success: true, output: stdout, warnings: stderr };
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async trackCommandExecution(command) {
    const baseCommand = command.split(' ')[0];
    this.powerLevel += this.getCommandPowerValue(baseCommand);
    
    // Check for unlocks
    const unlocks = this.checkForUnlocks(baseCommand);
    if (unlocks.length > 0) {
      console.log(`\n🎉 SKILL UNLOCKED: ${unlocks.join(', ')}`);
    }
    
    // Check for holy shit moments
    const holyShit = this.checkForHolyShitMoment(baseCommand);
    if (holyShit) {
      console.log(`\n💡 HOLY SHIT MOMENT: ${holyShit}`);
    }
  }

  getCommandPowerValue(command) {
    const powerValues = {
      'ls': 5, 'chmod': 15, 'find': 25, 'grep': 35,
      'curl': 50, 'docker': 100, 'git': 75,
      'ssh': 150, 'awk': 200, 'sed': 175
    };
    return powerValues[command] || 10;
  }

  checkForUnlocks(command) {
    // Simplified unlock system
    const unlocks = [];
    if (command === 'chmod' && this.powerLevel > 50) {
      unlocks.push('File Permission Master');
    }
    if (command === 'docker' && this.powerLevel > 200) {
      unlocks.push('Container Wizard');
    }
    return unlocks;
  }

  checkForHolyShitMoment(command) {
    const moments = {
      'grep': 'You can now search through ANY amount of text instantly!',
      'curl': 'You can now talk to ANY API or website from the command line!',
      'docker': 'Your apps will now run EXACTLY the same everywhere!',
      'ssh': 'You can now control computers anywhere in the world!'
    };
    return moments[command];
  }

  async runLearningDemo() {
    console.log('\n🧠 RUNNING YOUR CODING EVOLUTION DEMO\n');
    
    console.log('📚 YOUR LEARNING PATH:');
    const levels = this.learningPath.get('levels');
    Object.entries(levels).forEach(([level, info]) => {
      console.log(`\n${level.toUpperCase()}: ${info.description}`);
      console.log(`Commands: ${Object.keys(info.commands).join(', ')}`);
    });
    
    console.log('\n\n💡 THIS IS YOUR CRYPTOZOMBIES MOMENT:');
    const comparison = this.cryptoZombiesButReal.get('moments').crypto_zombies_comparison;
    console.log(`CryptoZombies: ${comparison.crypto_zombies}`);
    console.log(`This System: ${comparison.this_system}`);
    
    console.log('\n🎯 WHAT YOU\'RE LEARNING:');
    comparison.progression_comparison.our_path.forEach((step, i) => {
      console.log(`  ${i + 1}. ${step}`);
    });
    
    console.log('\n🚀 THE OUTCOME:');
    console.log(`Instead of just smart contracts, you\'re learning to:`);
    console.log(`  - Deploy real applications`);
    console.log(`  - Manage production servers`);
    console.log(`  - Automate business processes`);
    console.log(`  - Run entire tech companies`);
    
    console.log(`\n⚡ YOUR CURRENT POWER LEVEL: ${this.powerLevel}`);
    
    // Show some practical examples
    console.log('\n📋 PRACTICAL EXAMPLES TO TRY:');
    console.log('1. chmod +x script.js  # Make any file executable');
    console.log('2. curl https://api.github.com/users/octocat  # Talk to GitHub API');
    console.log('3. grep -r "function" .  # Find all functions in your code');
    console.log('4. docker run hello-world  # Run your first container');
    
    console.log('\n🎉 YES, YOU ARE ACTUALLY LEARNING TO CODE!');
    console.log('Not just syntax, but REAL system administration and DevOps!');
  }

  async bashTheChmod() {
    console.log('\n🔨 BASHING THE CHMOD - LET\'S MAKE SOME FILES EXECUTABLE!\n');
    
    // Create a test script
    const testScript = `#!/bin/bash
echo "🎉 Holy shit, this script is now executable!"
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"
echo "Files in directory: $(ls -la | wc -l)"
`;
    
    await fs.writeFile('/tmp/test-script.sh', testScript);
    console.log('📝 Created test script at /tmp/test-script.sh');
    
    // Show current permissions
    await this.executeCommand('ls -la /tmp/test-script.sh', 'Check current permissions');
    
    // Make it executable
    await this.executeCommand('chmod +x /tmp/test-script.sh', 'Make the script executable');
    
    // Show new permissions
    await this.executeCommand('ls -la /tmp/test-script.sh', 'Check new permissions - see the x?');
    
    // Execute it
    await this.executeCommand('/tmp/test-script.sh', 'Run our newly executable script');
    
    console.log('\n✅ CHMOD BASHED! You just controlled file permissions like a boss!');
  }

  async bashTheCurls() {
    console.log('\n🌐 BASHING THE CURLS - LET\'S TALK TO THE INTERNET!\n');
    
    // Basic GET request
    await this.executeCommand('curl -s https://httpbin.org/json', 'Make a simple GET request');
    
    // GET with headers
    await this.executeCommand('curl -H "User-Agent: BashLearner" https://httpbin.org/headers', 'Send custom headers');
    
    // POST request with data
    await this.executeCommand('curl -X POST -H "Content-Type: application/json" -d \'{"name":"test"}\' https://httpbin.org/post', 'Send POST data');
    
    // Download a file
    await this.executeCommand('curl -o /tmp/downloaded.json https://httpbin.org/json', 'Download and save a file');
    
    console.log('\n✅ CURLS BASHED! You can now talk to any API on the internet!');
  }

  async bashTheGreps() {
    console.log('\n🔍 BASHING THE GREPS - LET\'S SEARCH LIKE A DETECTIVE!\n');
    
    // Create some test files
    const files = {
      '/tmp/code.js': 'function hello() {\n  console.log("Hello World");\n}\n\nfunction goodbye() {\n  console.log("Goodbye");\n}',
      '/tmp/log.txt': 'INFO: Application started\nERROR: Database connection failed\nINFO: Retrying connection\nSUCCESS: Connected to database',
      '/tmp/config.txt': 'port=3000\nhost=localhost\ndbname=myapp\npassword=secret123'
    };
    
    for (const [path, content] of Object.entries(files)) {
      await fs.writeFile(path, content);
    }
    
    console.log('📝 Created test files with various content');
    
    // Search for functions
    await this.executeCommand('grep "function" /tmp/code.js', 'Find all functions in code');
    
    // Search for errors in logs
    await this.executeCommand('grep "ERROR" /tmp/log.txt', 'Find errors in log file');
    
    // Case insensitive search
    await this.executeCommand('grep -i "success" /tmp/log.txt', 'Case insensitive search for success');
    
    // Search recursively
    await this.executeCommand('grep -r "password" /tmp/', 'Search for passwords in all files');
    
    // Search with line numbers
    await this.executeCommand('grep -n "function" /tmp/code.js', 'Show line numbers with results');
    
    console.log('\n✅ GREPS BASHED! You can now find anything in any amount of text!');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'demo';

async function main() {
  const learningLayer = new BashExecutionLearningLayer();
  
  switch (command) {
    case 'demo':
      await learningLayer.runLearningDemo();
      break;
      
    case 'chmod':
      await learningLayer.bashTheChmod();
      break;
      
    case 'curl':
      await learningLayer.bashTheCurls();
      break;
      
    case 'grep':
      await learningLayer.bashTheGreps();
      break;
      
    case 'all':
      console.log('🚀 BASHING ALL THE COMMANDS!\n');
      await learningLayer.bashTheChmod();
      await learningLayer.bashTheCurls();
      await learningLayer.bashTheGreps();
      break;
      
    default:
      console.log('Usage: node bash-execution-learning-layer.js [demo|chmod|curl|grep|all]');
  }
}

// Run the learning system
main().catch(error => {
  console.error('❌ Learning error:', error);
  process.exit(1);
});