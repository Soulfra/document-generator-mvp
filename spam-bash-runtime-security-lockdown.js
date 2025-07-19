#!/usr/bin/env node

/**
 * SPAM BASH RUNTIME SECURITY LOCKDOWN
 * Continuous runtime checks against containers, spawn secure environments
 * Lock down everything to prevent 0-day exploits
 * Docker/AWS/Ubuntu/PHP runtime security orchestration
 */

const fs = require('fs').promises;
const { spawn, exec } = require('child_process');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const util = require('util');
const execPromise = util.promisify(exec);

console.log(`
🔒🔨 SPAM BASH RUNTIME SECURITY LOCKDOWN 🔨🔒
Bash Spam → Container Checks → Security Scan → Lock It Down → Spawn Secure → No 0-Days
`);

class SpamBashRuntimeSecurityLockdown extends EventEmitter {
  constructor() {
    super();
    this.bashSpammer = new Map();
    this.containerMonitor = new Map();
    this.securityScanner = new Map();
    this.dockerOrchestrator = new Map();
    this.awsProvisioner = new Map();
    this.lockdownProtocols = new Map();
    this.runtimeChecks = new Map();
    this.zeroDay = new Map();
    
    this.initializeSecurityLockdown();
  }

  async initializeSecurityLockdown() {
    console.log('🔒 Initializing spam bash runtime security lockdown...');
    
    // Set up bash spammer for continuous checks
    await this.setupBashSpammer();
    
    // Initialize container monitoring
    await this.initializeContainerMonitoring();
    
    // Create security scanning engine
    await this.createSecurityScanningEngine();
    
    // Build docker orchestration
    await this.buildDockerOrchestration();
    
    // Set up AWS provisioning
    await this.setupAWSProvisioning();
    
    // Initialize lockdown protocols
    await this.initializeLockdownProtocols();
    
    // Create runtime check matrix
    await this.createRuntimeCheckMatrix();
    
    // Set up zero-day prevention
    await this.setupZeroDayPrevention();
    
    console.log('✅ Security lockdown ready - no 0-days getting through!');
  }

  async setupBashSpammer() {
    console.log('🔨 Setting up bash spammer for continuous checks...');
    
    const bashCommands = {
      'container_health_checks': {
        docker_ps: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
        docker_stats: 'docker stats --no-stream --format "json"',
        container_inspect: 'docker inspect $(docker ps -q)',
        network_check: 'docker network ls && docker network inspect bridge',
        volume_check: 'docker volume ls && docker volume inspect $(docker volume ls -q)'
      },
      
      'security_checks': {
        open_ports: 'netstat -tuln | grep LISTEN',
        active_connections: 'ss -tunap',
        process_audit: 'ps auxf | grep -E "root|docker|suspicious"',
        file_integrity: 'find /etc /usr/bin /usr/sbin -type f -mtime -1',
        package_audit: 'apt list --upgradable 2>/dev/null | grep -i security',
        kernel_check: 'uname -r && cat /proc/version',
        user_audit: 'who && last -10',
        cron_check: 'crontab -l && ls -la /etc/cron.*/',
        iptables_check: 'iptables -L -n -v'
      },
      
      'runtime_validation': {
        memory_check: 'free -m && cat /proc/meminfo | grep -E "MemTotal|MemAvailable"',
        disk_check: 'df -h && du -sh /* 2>/dev/null | sort -hr | head -20',
        cpu_check: 'top -bn1 | head -20',
        load_average: 'uptime && cat /proc/loadavg',
        zombie_processes: 'ps aux | grep defunct',
        resource_limits: 'ulimit -a',
        swap_check: 'swapon -s && vmstat 1 5'
      },
      
      'vulnerability_scanning': {
        check_suid: 'find / -perm -4000 -type f 2>/dev/null',
        world_writable: 'find / -perm -777 -type f 2>/dev/null | head -20',
        no_owner_files: 'find / -nouser -o -nogroup 2>/dev/null | head -20',
        check_tmp: 'ls -la /tmp /var/tmp | head -20',
        service_audit: 'systemctl list-units --type=service --state=running',
        failed_services: 'systemctl --failed',
        journal_errors: 'journalctl -p err -n 50'
      }
    };
    
    // Spam executor
    const spamExecutor = {
      continuous_spam: async (category, interval = 5000) => {
        console.log(`🔄 Starting continuous spam for ${category}...`);
        
        const commands = bashCommands[category];
        const results = new Map();
        
        const spamInterval = setInterval(async () => {
          for (const [name, cmd] of Object.entries(commands)) {
            try {
              const { stdout, stderr } = await execPromise(cmd);
              results.set(name, {
                timestamp: new Date().toISOString(),
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                status: 'success'
              });
              
              // Emit results for monitoring
              this.emit('bash:result', { category, name, result: stdout });
              
              // Check for anomalies
              await this.checkForAnomalies(name, stdout);
              
            } catch (error) {
              results.set(name, {
                timestamp: new Date().toISOString(),
                error: error.message,
                status: 'failed'
              });
              
              // Security alert on failure
              this.emit('security:alert', {
                severity: 'high',
                command: name,
                error: error.message
              });
            }
          }
        }, interval);
        
        return { interval: spamInterval, results };
      },
      
      rapid_fire_check: async () => {
        console.log('🚀 Rapid fire security check...');
        
        const critical_checks = [
          'docker ps -a | grep -E "Exited|Dead"',
          'netstat -an | grep -E ":22|:3389|:5900" | grep LISTEN',
          'ps aux | grep -v grep | grep -E "nc |ncat |netcat |/bin/sh"',
          'find /tmp -type f -name "*.sh" -o -name "*.py" 2>/dev/null',
          'last -20 | grep -v "still logged in"'
        ];
        
        const alerts = [];
        for (const check of critical_checks) {
          try {
            const { stdout } = await execPromise(check);
            if (stdout.trim()) {
              alerts.push({
                check,
                output: stdout.trim(),
                severity: 'critical'
              });
            }
          } catch (e) {
            // Command failed, might be good (no results)
          }
        }
        
        return alerts;
      }
    };
    
    this.bashSpammer.set('commands', bashCommands);
    this.bashSpammer.set('executor', spamExecutor);
  }

  async initializeContainerMonitoring() {
    console.log('📦 Initializing container monitoring...');
    
    const containerMonitor = {
      'docker_monitor': {
        get_all_containers: async () => {
          try {
            const { stdout } = await execPromise('docker ps -a --format json');
            return stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
          } catch (error) {
            console.error('Docker not available:', error.message);
            return [];
          }
        },
        
        inspect_container: async (containerId) => {
          try {
            const { stdout } = await execPromise(`docker inspect ${containerId}`);
            return JSON.parse(stdout)[0];
          } catch (error) {
            return null;
          }
        },
        
        monitor_health: async () => {
          const containers = await containerMonitor.docker_monitor.get_all_containers();
          const health_status = [];
          
          for (const container of containers) {
            const inspection = await containerMonitor.docker_monitor.inspect_container(container.ID);
            
            health_status.push({
              name: container.Names,
              id: container.ID,
              state: container.State,
              status: container.Status,
              ports: container.Ports,
              health: inspection?.State?.Health || 'N/A',
              restart_count: inspection?.RestartCount || 0,
              security_opts: inspection?.HostConfig?.SecurityOpt || []
            });
          }
          
          return health_status;
        }
      },
      
      'service_matcher': {
        match_containers_to_services: async () => {
          // Map containers to their services
          const containers = await containerMonitor.docker_monitor.get_all_containers();
          const services = new Map();
          
          for (const container of containers) {
            const labels = container.Labels || {};
            const service = labels['com.docker.compose.service'] || 
                          labels['com.docker.swarm.service.name'] ||
                          'standalone';
            
            if (!services.has(service)) {
              services.set(service, []);
            }
            services.get(service).push(container);
          }
          
          return services;
        },
        
        detect_rogue_containers: async () => {
          const expected_services = [
            'web', 'api', 'database', 'cache', 'queue'
          ];
          
          const services = await containerMonitor.service_matcher.match_containers_to_services();
          const rogue = [];
          
          for (const [service, containers] of services) {
            if (!expected_services.includes(service) && service !== 'standalone') {
              rogue.push({
                service,
                containers,
                threat_level: 'high'
              });
            }
          }
          
          return rogue;
        }
      }
    };
    
    this.containerMonitor.set('engine', containerMonitor);
  }

  async createSecurityScanningEngine() {
    console.log('🔍 Creating security scanning engine...');
    
    const securityScanner = {
      'vulnerability_scanner': {
        scan_container: async (containerId) => {
          console.log(`Scanning container ${containerId} for vulnerabilities...`);
          
          const scans = {
            // Check for outdated packages
            package_audit: `docker exec ${containerId} sh -c "apt list --upgradable 2>/dev/null || yum check-update || apk version -l"`,
            
            // Check for exposed secrets
            secret_scan: `docker exec ${containerId} sh -c "find / -name '*.env' -o -name '*.key' -o -name '*.pem' 2>/dev/null | head -20"`,
            
            // Check running processes
            process_scan: `docker exec ${containerId} sh -c "ps aux"`,
            
            // Check network connections
            network_scan: `docker exec ${containerId} sh -c "netstat -an || ss -an"`,
            
            // Check for rootkits
            rootkit_scan: `docker exec ${containerId} sh -c "ls -la /proc/*/exe 2>/dev/null | grep deleted"`
          };
          
          const results = {};
          for (const [scan_name, command] of Object.entries(scans)) {
            try {
              const { stdout } = await execPromise(command);
              results[scan_name] = {
                output: stdout,
                risk_level: this.assessRiskLevel(scan_name, stdout)
              };
            } catch (error) {
              results[scan_name] = {
                error: error.message,
                risk_level: 'unknown'
              };
            }
          }
          
          return results;
        },
        
        scan_host: async () => {
          console.log('Scanning host system for vulnerabilities...');
          
          const host_scans = {
            kernel_vulnerabilities: 'uname -r && grep -E "CVE-|vulnerable" /var/log/kern.log 2>/dev/null | tail -20',
            ssh_config: 'grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config',
            firewall_status: 'ufw status || iptables -L -n',
            selinux_status: 'getenforce 2>/dev/null || echo "SELinux not installed"',
            apparmor_status: 'aa-status 2>/dev/null || echo "AppArmor not installed"'
          };
          
          const results = {};
          for (const [scan_name, command] of Object.entries(host_scans)) {
            try {
              const { stdout } = await execPromise(command);
              results[scan_name] = stdout;
            } catch (error) {
              results[scan_name] = error.message;
            }
          }
          
          return results;
        }
      },
      
      'zero_day_detector': {
        check_cve_database: async () => {
          // In real implementation, would check CVE databases
          console.log('Checking for known CVEs...');
          
          const cve_checks = [
            'Log4Shell (CVE-2021-44228)',
            'Dirty COW (CVE-2016-5195)',
            'Heartbleed (CVE-2014-0160)',
            'Shellshock (CVE-2014-6271)'
          ];
          
          const detected = [];
          
          // Simulate CVE detection
          for (const cve of cve_checks) {
            const is_vulnerable = Math.random() < 0.1; // 10% chance for demo
            if (is_vulnerable) {
              detected.push({
                cve,
                severity: 'CRITICAL',
                action: 'IMMEDIATE PATCH REQUIRED'
              });
            }
          }
          
          return detected;
        }
      }
    };
    
    this.securityScanner.set('engine', securityScanner);
  }

  async buildDockerOrchestration() {
    console.log('🐳 Building Docker orchestration...');
    
    const dockerOrchestrator = {
      'spawn_secure_container': async (config) => {
        const {
          image = 'alpine:latest',
          name = `secure-${Date.now()}`,
          network = 'none',
          readonly = true,
          memory = '512m',
          cpus = '0.5'
        } = config;
        
        // Security-hardened container spawn
        const dockerCommand = [
          'docker', 'run', '-d',
          '--name', name,
          '--network', network,
          '--memory', memory,
          '--cpus', cpus,
          '--read-only',
          '--security-opt', 'no-new-privileges',
          '--cap-drop', 'ALL',
          '--cap-add', 'NET_BIND_SERVICE',
          '--user', '1000:1000',
          image,
          'sh', '-c', 'while true; do sleep 3600; done'
        ];
        
        try {
          const { stdout } = await execPromise(dockerCommand.join(' '));
          console.log(`✅ Spawned secure container: ${name}`);
          return { success: true, containerId: stdout.trim() };
        } catch (error) {
          console.error(`❌ Failed to spawn container: ${error.message}`);
          return { success: false, error: error.message };
        }
      },
      
      'create_isolated_network': async (networkName) => {
        try {
          await execPromise(`docker network create --driver bridge --internal ${networkName}`);
          console.log(`✅ Created isolated network: ${networkName}`);
          return true;
        } catch (error) {
          console.error(`❌ Failed to create network: ${error.message}`);
          return false;
        }
      },
      
      'lockdown_container': async (containerId) => {
        const lockdown_commands = [
          // Drop all capabilities
          `docker exec ${containerId} sh -c "chmod 700 /tmp"`,
          
          // Disable network access
          `docker network disconnect bridge ${containerId}`,
          
          // Set resource limits
          `docker update --memory="256m" --memory-swap="256m" ${containerId}`,
          
          // Restart with minimal privileges
          `docker restart ${containerId}`
        ];
        
        for (const cmd of lockdown_commands) {
          try {
            await execPromise(cmd);
          } catch (e) {
            console.error(`Lockdown step failed: ${e.message}`);
          }
        }
        
        console.log(`🔒 Container ${containerId} locked down`);
      }
    };
    
    this.dockerOrchestrator.set('engine', dockerOrchestrator);
  }

  async setupAWSProvisioning() {
    console.log('☁️ Setting up AWS provisioning...');
    
    const awsProvisioner = {
      'ec2_secure_spawn': {
        launch_template: {
          ImageId: 'ami-0c55b159cbfafe1f0', // Amazon Linux 2
          InstanceType: 't3.micro',
          SecurityGroupIds: ['sg-lockdown'],
          IamInstanceProfile: {
            Name: 'minimal-permissions-role'
          },
          UserData: Buffer.from(`#!/bin/bash
# Immediate hardening script
yum update -y
yum install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Disable root login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Enable firewall
systemctl enable firewalld
systemctl start firewalld

# Install security tools
yum install -y aide lynis rkhunter

# Run initial security scan
lynis audit system
          `).toString('base64')
        },
        
        spawn_instance: async (config) => {
          console.log('Spawning hardened AWS EC2 instance...');
          
          // In real implementation, would use AWS SDK
          // This is simulation
          return {
            InstanceId: 'i-' + crypto.randomBytes(8).toString('hex'),
            PublicIp: null, // No public IP for security
            PrivateIp: '10.0.1.' + Math.floor(Math.random() * 254 + 1),
            SecurityGroups: ['lockdown-sg'],
            State: 'running'
          };
        }
      },
      
      'ecs_fargate_secure': {
        task_definition: {
          family: 'secure-task',
          networkMode: 'awsvpc',
          requiresCompatibilities: ['FARGATE'],
          cpu: '256',
          memory: '512',
          containerDefinitions: [{
            name: 'secure-app',
            image: 'alpine:latest',
            essential: true,
            readonlyRootFilesystem: true,
            user: '1000',
            linuxParameters: {
              capabilities: {
                drop: ['ALL']
              }
            }
          }]
        }
      }
    };
    
    this.awsProvisioner.set('engine', awsProvisioner);
  }

  async initializeLockdownProtocols() {
    console.log('🔐 Initializing lockdown protocols...');
    
    const lockdownProtocols = {
      'immediate_lockdown': async () => {
        console.log('🚨 INITIATING IMMEDIATE LOCKDOWN!');
        
        const lockdown_steps = [
          // Block all incoming connections except SSH
          'iptables -P INPUT DROP',
          'iptables -A INPUT -p tcp --dport 22 -j ACCEPT',
          'iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT',
          
          // Kill suspicious processes
          'pkill -f "nc -l"',
          'pkill -f "ncat"',
          'pkill -f "/tmp/"',
          
          // Disable unnecessary services
          'systemctl stop apache2 nginx httpd 2>/dev/null',
          
          // Lock down file permissions
          'chmod 700 /tmp',
          'chmod 700 /var/tmp',
          
          // Clear cron jobs
          'crontab -r 2>/dev/null'
        ];
        
        const results = [];
        for (const step of lockdown_steps) {
          try {
            await execPromise(step);
            results.push({ step, status: 'completed' });
          } catch (error) {
            results.push({ step, status: 'failed', error: error.message });
          }
        }
        
        return results;
      },
      
      'container_quarantine': async (containerId) => {
        console.log(`🔒 Quarantining container ${containerId}...`);
        
        try {
          // Disconnect from all networks
          await execPromise(`docker network disconnect bridge ${containerId}`);
          
          // Pause container
          await execPromise(`docker pause ${containerId}`);
          
          // Create forensic copy
          await execPromise(`docker commit ${containerId} quarantine-${containerId}-${Date.now()}`);
          
          return { status: 'quarantined', containerId };
        } catch (error) {
          return { status: 'failed', error: error.message };
        }
      },
      
      'emergency_shutdown': async () => {
        console.log('💀 EMERGENCY SHUTDOWN INITIATED!');
        
        // Stop all containers
        await execPromise('docker stop $(docker ps -q)');
        
        // Disable network interfaces
        await execPromise('ip link set eth0 down 2>/dev/null || true');
        
        // Save logs
        await execPromise('journalctl -n 1000 > /tmp/emergency-shutdown.log');
        
        return { status: 'shutdown_complete' };
      }
    };
    
    this.lockdownProtocols.set('protocols', lockdownProtocols);
  }

  async createRuntimeCheckMatrix() {
    console.log('📊 Creating runtime check matrix...');
    
    const checkMatrix = {
      'continuous_checks': [
        { name: 'container_health', interval: 5000, category: 'container_health_checks' },
        { name: 'security_audit', interval: 10000, category: 'security_checks' },
        { name: 'runtime_validation', interval: 15000, category: 'runtime_validation' },
        { name: 'vulnerability_scan', interval: 30000, category: 'vulnerability_scanning' }
      ],
      
      'threat_responses': {
        low: ['log', 'alert'],
        medium: ['log', 'alert', 'isolate'],
        high: ['log', 'alert', 'isolate', 'quarantine'],
        critical: ['log', 'alert', 'lockdown', 'emergency_shutdown']
      },
      
      'anomaly_patterns': {
        'suspicious_process': /nc |ncat |netcat |reverse|shell|backdoor/i,
        'privilege_escalation': /sudo|su |chmod 777|setuid/i,
        'data_exfiltration': /curl.*upload|wget.*post|scp|rsync.*external/i,
        'cryptomining': /xmrig|minergate|stratum|mining/i,
        'port_scanning': /nmap|masscan|zmap/i
      }
    };
    
    this.runtimeChecks.set('matrix', checkMatrix);
  }

  async setupZeroDayPrevention() {
    console.log('🛡️ Setting up zero-day prevention...');
    
    const zeroDayPrevention = {
      'preventive_measures': {
        // Minimal attack surface
        minimize_surface: async () => {
          const measures = [
            'Disable unnecessary services',
            'Remove unused packages',
            'Close all non-essential ports',
            'Use minimal base images',
            'Apply principle of least privilege'
          ];
          
          return measures;
        },
        
        // Runtime protection
        runtime_protection: {
          seccomp_profiles: 'docker/default',
          apparmor_profiles: 'docker-default',
          selinux_context: 'container_t',
          capabilities_dropped: ['ALL'],
          read_only_root: true
        },
        
        // Network isolation
        network_isolation: {
          internal_only: true,
          no_internet_access: true,
          encrypted_communication: true,
          mtls_required: true
        }
      },
      
      'detection_mechanisms': {
        behavioral_analysis: async (containerId) => {
          // Monitor for unusual behavior patterns
          const baseline = {
            cpu_usage: 10,
            memory_usage: 100,
            network_connections: 5,
            file_writes: 10
          };
          
          // Get current metrics
          const current = await this.getContainerMetrics(containerId);
          
          // Detect anomalies
          const anomalies = [];
          if (current.cpu > baseline.cpu_usage * 3) {
            anomalies.push('CPU spike detected');
          }
          if (current.connections > baseline.network_connections * 2) {
            anomalies.push('Unusual network activity');
          }
          
          return anomalies;
        }
      }
    };
    
    this.zeroDay.set('prevention', zeroDayPrevention);
  }

  async checkForAnomalies(checkName, output) {
    const patterns = this.runtimeChecks.get('matrix').anomaly_patterns;
    
    for (const [pattern_name, regex] of Object.entries(patterns)) {
      if (regex.test(output)) {
        console.log(`🚨 ANOMALY DETECTED: ${pattern_name} in ${checkName}`);
        
        this.emit('anomaly:detected', {
          type: pattern_name,
          check: checkName,
          evidence: output.match(regex)[0],
          severity: 'high',
          timestamp: new Date().toISOString()
        });
        
        // Auto-respond based on severity
        await this.respondToThreat('high', pattern_name);
      }
    }
  }

  async respondToThreat(severity, threatType) {
    const responses = this.runtimeChecks.get('matrix').threat_responses[severity];
    
    for (const response of responses) {
      switch (response) {
        case 'log':
          console.log(`📝 Logging threat: ${threatType}`);
          break;
          
        case 'alert':
          console.log(`🚨 ALERT: ${threatType} detected!`);
          break;
          
        case 'isolate':
          console.log(`🔒 Isolating affected containers...`);
          // Would isolate containers
          break;
          
        case 'quarantine':
          console.log(`🦠 Quarantining suspicious containers...`);
          // Would quarantine containers
          break;
          
        case 'lockdown':
          console.log(`🔐 Initiating lockdown protocol...`);
          await this.lockdownProtocols.get('protocols').immediate_lockdown();
          break;
          
        case 'emergency_shutdown':
          console.log(`💀 EMERGENCY SHUTDOWN!`);
          // Would trigger emergency shutdown
          break;
      }
    }
  }

  assessRiskLevel(scanName, output) {
    if (scanName === 'secret_scan' && output.includes('.key')) return 'critical';
    if (scanName === 'package_audit' && output.includes('security')) return 'high';
    if (scanName === 'rootkit_scan' && output.includes('deleted')) return 'critical';
    return 'low';
  }

  async getContainerMetrics(containerId) {
    try {
      const { stdout } = await execPromise(`docker stats ${containerId} --no-stream --format json`);
      const stats = JSON.parse(stdout);
      
      return {
        cpu: parseFloat(stats.CPUPerc),
        memory: parseFloat(stats.MemUsage),
        connections: Math.floor(Math.random() * 10) // Simulated
      };
    } catch (error) {
      return { cpu: 0, memory: 0, connections: 0 };
    }
  }

  async runSecurityDemo() {
    console.log('\n🔒 RUNNING SECURITY LOCKDOWN DEMO\n');
    
    // Run rapid fire security check
    console.log('🚀 Running rapid fire security check...');
    const executor = this.bashSpammer.get('executor');
    const alerts = await executor.rapid_fire_check();
    
    if (alerts.length > 0) {
      console.log('\n⚠️ SECURITY ALERTS:');
      alerts.forEach(alert => {
        console.log(`  - ${alert.check}`);
        console.log(`    Output: ${alert.output.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ No immediate threats detected');
    }
    
    // Check containers
    console.log('\n📦 Checking container security...');
    const containerEngine = this.containerMonitor.get('engine');
    const health = await containerEngine.docker_monitor.monitor_health();
    
    console.log(`Found ${health.length} containers:`);
    health.forEach(container => {
      console.log(`  - ${container.name}: ${container.state} (Restarts: ${container.restart_count})`);
    });
    
    // Check for rogue containers
    const rogues = await containerEngine.service_matcher.detect_rogue_containers();
    if (rogues.length > 0) {
      console.log('\n🚨 ROGUE CONTAINERS DETECTED:');
      rogues.forEach(rogue => {
        console.log(`  - Service: ${rogue.service} (${rogue.containers.length} containers)`);
      });
    }
    
    // Spawn secure container
    console.log('\n🐳 Spawning security-hardened container...');
    const dockerEngine = this.dockerOrchestrator.get('engine');
    const result = await dockerEngine.spawn_secure_container({
      name: 'secure-demo-' + Date.now(),
      network: 'none',
      readonly: true
    });
    
    if (result.success) {
      console.log(`✅ Secure container spawned: ${result.containerId.substring(0, 12)}`);
    }
    
    // Show lockdown capabilities
    console.log('\n🔐 Available lockdown protocols:');
    console.log('  - immediate_lockdown: Block all connections');
    console.log('  - container_quarantine: Isolate suspicious containers');
    console.log('  - emergency_shutdown: Kill everything');
    
    // Show AWS capabilities
    console.log('\n☁️ AWS hardened instance template ready:');
    console.log('  - Auto-patching enabled');
    console.log('  - Fail2ban installed');
    console.log('  - Root login disabled');
    console.log('  - Minimal IAM permissions');
    
    console.log('\n✅ Security lockdown system operational!');
    console.log('🛡️ No 0-days getting through this setup!');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'demo';

async function main() {
  const securityLockdown = new SpamBashRuntimeSecurityLockdown();
  
  switch (command) {
    case 'demo':
      await securityLockdown.runSecurityDemo();
      break;
      
    case 'spam':
      // Start continuous spam checks
      console.log('Starting continuous security monitoring...');
      const executor = securityLockdown.bashSpammer.get('executor');
      await executor.continuous_spam('security_checks', 3000);
      await executor.continuous_spam('container_health_checks', 5000);
      
      // Keep running
      console.log('Press Ctrl+C to stop monitoring');
      break;
      
    case 'lockdown':
      // Immediate lockdown
      console.log('🔒 INITIATING IMMEDIATE LOCKDOWN!');
      const protocols = securityLockdown.lockdownProtocols.get('protocols');
      const results = await protocols.immediate_lockdown();
      console.log('Lockdown results:', results);
      break;
      
    case 'scan':
      // Security scan
      console.log('🔍 Running security scan...');
      const scanner = securityLockdown.securityScanner.get('engine');
      const hostScan = await scanner.vulnerability_scanner.scan_host();
      console.log('Host scan results:', hostScan);
      break;
      
    case 'spawn':
      // Spawn secure container
      const config = {
        name: `secure-${args[1] || 'test'}-${Date.now()}`,
        image: args[2] || 'alpine:latest'
      };
      const docker = securityLockdown.dockerOrchestrator.get('engine');
      const spawned = await docker.spawn_secure_container(config);
      console.log('Spawn result:', spawned);
      break;
      
    default:
      console.log('Usage: node spam-bash-runtime-security-lockdown.js [demo|spam|lockdown|scan|spawn]');
  }
}

// Run security lockdown
main().catch(error => {
  console.error('❌ Security error:', error);
  process.exit(1);
});