#!/usr/bin/env node

/**
 * ASYNC PROCESS MANAGER
 * Ensures all processes run asynchronously without blocking
 * Manages queues, workers, and parallel processing
 */

const cluster = require('cluster');
const os = require('os');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class AsyncProcessManager extends EventEmitter {
    constructor() {
        super();
        
        this.workers = new Map();
        this.queues = new Map();
        this.tasks = new Map();
        
        // Process pools for different task types
        this.pools = {
            document: { size: 4, queue: [] },
            ai: { size: 2, queue: [] },
            database: { size: 3, queue: [] },
            general: { size: os.cpus().length, queue: [] }
        };
        
        console.log('⚡ ASYNC PROCESS MANAGER INITIALIZING...');
        console.log(`🖥️  CPU Cores: ${os.cpus().length}`);
        console.log('🔄 Setting up worker pools...');
    }
    
    async initialize() {
        if (cluster.isMaster) {
            await this.setupMaster();
        } else {
            await this.setupWorker();
        }
    }
    
    async setupMaster() {
        console.log('\n🎯 Master Process Setup');
        console.log('======================\n');
        
        // 1. Setup worker pools
        await this.createWorkerPools();
        
        // 2. Setup task queues
        await this.setupQueues();
        
        // 3. Setup load balancer
        await this.setupLoadBalancer();
        
        // 4. Setup monitoring
        await this.setupMonitoring();
        
        // 5. Handle worker lifecycle
        this.handleWorkerLifecycle();
        
        console.log('\n✅ Async Process Manager Ready');
        console.log('All operations will run in parallel without blocking\n');
    }
    
    async createWorkerPools() {
        console.log('🏊 Creating worker pools...');
        
        for (const [poolName, config] of Object.entries(this.pools)) {
            console.log(`   Creating ${poolName} pool (${config.size} workers)...`);
            
            for (let i = 0; i < config.size; i++) {
                const worker = cluster.fork({
                    WORKER_TYPE: poolName,
                    WORKER_ID: `${poolName}-${i}`
                });
                
                this.workers.set(worker.id, {
                    id: worker.id,
                    type: poolName,
                    status: 'idle',
                    tasksCompleted: 0,
                    currentTask: null
                });
                
                this.setupWorkerHandlers(worker);
            }
        }
        
        console.log(`✅ Created ${this.workers.size} workers`);
    }
    
    setupWorkerHandlers(worker) {
        worker.on('message', async (msg) => {
            switch (msg.type) {
                case 'task-complete':
                    await this.handleTaskComplete(worker.id, msg);
                    break;
                    
                case 'task-error':
                    await this.handleTaskError(worker.id, msg);
                    break;
                    
                case 'status-update':
                    this.updateWorkerStatus(worker.id, msg.status);
                    break;
                    
                case 'metrics':
                    await this.updateMetrics(worker.id, msg.metrics);
                    break;
            }
        });
        
        worker.on('error', (error) => {
            console.error(`Worker ${worker.id} error:`, error);
            this.restartWorker(worker.id);
        });
        
        worker.on('exit', (code, signal) => {
            if (signal !== 'SIGTERM') {
                console.log(`Worker ${worker.id} died (${signal}), restarting...`);
                this.restartWorker(worker.id);
            }
        });
    }
    
    async setupQueues() {
        console.log('📋 Setting up task queues...');
        
        // Priority queues for different task types
        this.queues.set('high', []);      // Critical tasks
        this.queues.set('normal', []);    // Regular tasks
        this.queues.set('low', []);       // Background tasks
        this.queues.set('scheduled', []); // Scheduled tasks
        
        // Setup queue processors
        setInterval(() => this.processQueues(), 100);
        
        console.log('✅ Task queues initialized');
    }
    
    async setupLoadBalancer() {
        console.log('⚖️  Setting up load balancer...');
        
        // Round-robin with least-loaded preference
        this.loadBalancer = {
            getWorker: (type) => {
                const availableWorkers = Array.from(this.workers.values())
                    .filter(w => w.type === type && w.status === 'idle')
                    .sort((a, b) => a.tasksCompleted - b.tasksCompleted);
                
                return availableWorkers[0];
            },
            
            distribute: async (task) => {
                const worker = this.loadBalancer.getWorker(task.pool);
                
                if (worker) {
                    await this.assignTask(worker.id, task);
                } else {
                    // Queue if no workers available
                    this.queueTask(task);
                }
            }
        };
        
        console.log('✅ Load balancer configured');
    }
    
    async setupMonitoring() {
        console.log('📊 Setting up monitoring...');
        
        // Monitor system resources
        setInterval(async () => {
            const stats = {
                timestamp: Date.now(),
                workers: {
                    total: this.workers.size,
                    idle: Array.from(this.workers.values()).filter(w => w.status === 'idle').length,
                    busy: Array.from(this.workers.values()).filter(w => w.status === 'busy').length
                },
                queues: {
                    high: this.queues.get('high').length,
                    normal: this.queues.get('normal').length,
                    low: this.queues.get('low').length
                },
                memory: process.memoryUsage(),
                cpu: os.loadavg()
            };
            
            await this.saveStats(stats);
            this.emit('stats', stats);
            
        }, 5000);
        
        console.log('✅ Monitoring active');
    }
    
    handleWorkerLifecycle() {
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down gracefully...');
            
            // Stop accepting new tasks
            this.shuttingDown = true;
            
            // Wait for current tasks to complete
            await this.waitForTasksToComplete();
            
            // Shutdown workers
            for (const worker of Object.values(cluster.workers)) {
                worker.kill('SIGTERM');
            }
            
            process.exit(0);
        });
    }
    
    // Task management
    async submitTask(taskData) {
        const task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...taskData,
            submitted: Date.now(),
            priority: taskData.priority || 'normal',
            pool: taskData.pool || 'general'
        };
        
        this.tasks.set(task.id, task);
        
        // Try to assign immediately
        await this.loadBalancer.distribute(task);
        
        return task.id;
    }
    
    async submitBatch(tasks) {
        const taskIds = [];
        
        for (const taskData of tasks) {
            const id = await this.submitTask(taskData);
            taskIds.push(id);
        }
        
        return taskIds;
    }
    
    queueTask(task) {
        const queue = this.queues.get(task.priority);
        queue.push(task);
    }
    
    async processQueues() {
        if (this.shuttingDown) return;
        
        // Process in priority order
        for (const priority of ['high', 'normal', 'low']) {
            const queue = this.queues.get(priority);
            
            while (queue.length > 0) {
                const task = queue[0];
                const worker = this.loadBalancer.getWorker(task.pool);
                
                if (worker) {
                    queue.shift();
                    await this.assignTask(worker.id, task);
                } else {
                    break; // No available workers
                }
            }
        }
    }
    
    async assignTask(workerId, task) {
        const worker = cluster.workers[workerId];
        const workerInfo = this.workers.get(workerId);
        
        if (!worker || !workerInfo) return;
        
        workerInfo.status = 'busy';
        workerInfo.currentTask = task.id;
        
        worker.send({
            type: 'execute-task',
            task: task
        });
    }
    
    async handleTaskComplete(workerId, msg) {
        const workerInfo = this.workers.get(workerId);
        const task = this.tasks.get(msg.taskId);
        
        if (task) {
            task.completed = Date.now();
            task.duration = task.completed - task.submitted;
            task.result = msg.result;
            
            // Emit completion event
            this.emit('task-complete', task);
        }
        
        // Update worker
        workerInfo.status = 'idle';
        workerInfo.currentTask = null;
        workerInfo.tasksCompleted++;
        
        // Process next task in queue
        this.processQueues();
    }
    
    async handleTaskError(workerId, msg) {
        const workerInfo = this.workers.get(workerId);
        const task = this.tasks.get(msg.taskId);
        
        if (task) {
            task.error = msg.error;
            task.retries = (task.retries || 0) + 1;
            
            // Retry if under limit
            if (task.retries < 3) {
                console.log(`Retrying task ${task.id} (attempt ${task.retries})...`);
                this.queueTask(task);
            } else {
                task.failed = true;
                this.emit('task-failed', task);
            }
        }
        
        // Update worker
        workerInfo.status = 'idle';
        workerInfo.currentTask = null;
    }
    
    async restartWorker(workerId) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) return;
        
        // Fork new worker
        const newWorker = cluster.fork({
            WORKER_TYPE: workerInfo.type,
            WORKER_ID: `${workerInfo.type}-${workerId}`
        });
        
        // Update tracking
        this.workers.delete(workerId);
        this.workers.set(newWorker.id, {
            ...workerInfo,
            id: newWorker.id,
            status: 'idle',
            currentTask: null
        });
        
        this.setupWorkerHandlers(newWorker);
    }
    
    // Worker process setup
    async setupWorker() {
        const workerId = process.env.WORKER_ID;
        const workerType = process.env.WORKER_TYPE;
        
        console.log(`Worker ${workerId} (${workerType}) started`);
        
        // Handle tasks
        process.on('message', async (msg) => {
            if (msg.type === 'execute-task') {
                await this.executeTask(msg.task);
            }
        });
        
        // Send heartbeat
        setInterval(() => {
            process.send({
                type: 'status-update',
                status: 'alive',
                memory: process.memoryUsage(),
                uptime: process.uptime()
            });
        }, 30000);
    }
    
    async executeTask(task) {
        try {
            let result;
            
            switch (task.type) {
                case 'document-process':
                    result = await this.processDocument(task.data);
                    break;
                    
                case 'ai-inference':
                    result = await this.runAIInference(task.data);
                    break;
                    
                case 'database-query':
                    result = await this.executeDatabaseQuery(task.data);
                    break;
                    
                default:
                    result = await this.executeGenericTask(task.data);
            }
            
            process.send({
                type: 'task-complete',
                taskId: task.id,
                result: result
            });
            
        } catch (error) {
            process.send({
                type: 'task-error',
                taskId: task.id,
                error: error.message
            });
        }
    }
    
    // Task implementations (these would be your actual processing logic)
    async processDocument(data) {
        // Simulate document processing
        await this.delay(Math.random() * 2000 + 1000);
        return {
            processed: true,
            pages: Math.floor(Math.random() * 100),
            extracted: 'Document content processed'
        };
    }
    
    async runAIInference(data) {
        // Simulate AI processing
        await this.delay(Math.random() * 3000 + 2000);
        return {
            model: 'gpt-4',
            response: 'AI inference completed',
            tokens: Math.floor(Math.random() * 1000)
        };
    }
    
    async executeDatabaseQuery(data) {
        // Simulate database query
        await this.delay(Math.random() * 500 + 100);
        return {
            rows: Math.floor(Math.random() * 1000),
            executionTime: Math.random() * 100
        };
    }
    
    async executeGenericTask(data) {
        // Generic task execution
        await this.delay(Math.random() * 1000 + 500);
        return { completed: true, data: 'Task completed' };
    }
    
    // Utility methods
    async waitForTasksToComplete() {
        const maxWait = 30000; // 30 seconds
        const start = Date.now();
        
        while (Date.now() - start < maxWait) {
            const busyWorkers = Array.from(this.workers.values())
                .filter(w => w.status === 'busy').length;
            
            if (busyWorkers === 0) break;
            
            await this.delay(100);
        }
    }
    
    async saveStats(stats) {
        try {
            await fs.writeFile(
                'async-process-stats.json',
                JSON.stringify(stats, null, 2)
            );
        } catch (error) {
            // Ignore save errors
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public API
    getStatus() {
        return {
            workers: Array.from(this.workers.values()),
            queues: {
                high: this.queues.get('high').length,
                normal: this.queues.get('normal').length,
                low: this.queues.get('low').length
            },
            tasks: {
                total: this.tasks.size,
                completed: Array.from(this.tasks.values()).filter(t => t.completed).length,
                failed: Array.from(this.tasks.values()).filter(t => t.failed).length
            }
        };
    }
}

// Start the async process manager
if (require.main === module) {
    const manager = new AsyncProcessManager();
    
    manager.initialize().then(() => {
        if (cluster.isMaster) {
            console.log('\n📋 Example usage:');
            console.log('================\n');
            
            // Example: Submit tasks
            setTimeout(async () => {
                // Submit single task
                const taskId = await manager.submitTask({
                    type: 'document-process',
                    data: { file: 'example.pdf' },
                    priority: 'high',
                    pool: 'document'
                });
                console.log(`Submitted task: ${taskId}`);
                
                // Submit batch
                const batchIds = await manager.submitBatch([
                    { type: 'ai-inference', data: { prompt: 'Test 1' }, pool: 'ai' },
                    { type: 'ai-inference', data: { prompt: 'Test 2' }, pool: 'ai' },
                    { type: 'database-query', data: { query: 'SELECT *' }, pool: 'database' }
                ]);
                console.log(`Submitted batch: ${batchIds.length} tasks`);
                
                // Monitor completion
                manager.on('task-complete', (task) => {
                    console.log(`✅ Task ${task.id} completed in ${task.duration}ms`);
                });
                
                manager.on('task-failed', (task) => {
                    console.log(`❌ Task ${task.id} failed: ${task.error}`);
                });
                
            }, 2000);
            
            // Show status periodically
            setInterval(() => {
                const status = manager.getStatus();
                console.log('\n📊 Status:', JSON.stringify(status, null, 2));
            }, 10000);
        }
    }).catch(console.error);
}

module.exports = AsyncProcessManager;