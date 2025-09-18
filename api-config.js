/**
 * API Configuration for Document Generator
 * 
 * This file solves the "how can you fetch these" problem by providing
 * intelligent environment detection and API endpoint configuration.
 */

class APIConfig {
    constructor() {
        this.environment = this.detectEnvironment();
        this.config = this.getConfig();
        this.testConnection();
    }

    detectEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname.includes('github.io')) {
            return 'github-pages';
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
            return 'static-hosting';
        } else {
            return 'production';
        }
    }

    getConfig() {
        const configs = {
            'github-pages': {
                mode: 'demo',
                apiBase: null,
                wsBase: null,
                features: ['mock-processing', 'demo-data', 'static-forms'],
                description: 'GitHub Pages Demo Mode'
            },
            'development': {
                mode: 'full',
                apiBase: 'http://localhost:3000',
                wsBase: 'ws://localhost:8081',
                features: ['real-scraping', 'websockets', 'database', 'ai-processing'],
                description: 'Local Development'
            },
            'static-hosting': {
                mode: 'hybrid',
                apiBase: 'https://document-generator-backend.up.railway.app',
                wsBase: 'wss://document-generator-backend.up.railway.app',
                features: ['real-scraping', 'api-calls', 'ai-processing'],
                description: 'Static + Railway Backend'
            },
            'production': {
                mode: 'full',
                apiBase: 'https://document-generator-backend.up.railway.app',
                wsBase: 'wss://document-generator-backend.up.railway.app',
                features: ['real-scraping', 'websockets', 'database', 'ai-processing'],
                description: 'Production with Full Backend'
            }
        };

        return configs[this.environment];
    }

    async testConnection() {
        if (!this.config.apiBase) {
            console.log('📍 Running in demo mode - no backend connection needed');
            return { mode: 'demo', available: false };
        }

        try {
            console.log(`🔍 Testing connection to ${this.config.apiBase}...`);
            
            const response = await fetch(`${this.config.apiBase}/health`, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend connection successful:', data);
                
                this.backendStatus = {
                    available: true,
                    version: data.version,
                    services: data.services
                };
                
                return this.backendStatus;
            }
        } catch (error) {
            console.warn('⚠️ Backend not available, falling back to demo mode:', error.message);
            
            // Fallback to demo mode
            this.config.mode = 'demo';
            this.config.features = ['mock-processing', 'demo-data'];
            
            this.backendStatus = {
                available: false,
                error: error.message,
                fallback: 'demo-mode'
            };
        }

        return this.backendStatus;
    }

    // Intelligent API call wrapper
    async apiCall(endpoint, options = {}) {
        // Demo mode - return mock data
        if (this.config.mode === 'demo') {
            return this.mockResponse(endpoint, options);
        }

        // Real API call
        const url = `${this.config.apiBase}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': 'demo-user'
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            console.error(`API call failed (${endpoint}):`, error);
            
            // Fallback to mock data on error
            console.log('🔄 Falling back to demo mode...');
            return this.mockResponse(endpoint, options);
        }
    }

    // WebSocket connection wrapper
    connectWebSocket(onMessage, onOpen, onClose) {
        if (this.config.mode === 'demo') {
            // Simulate WebSocket connection
            console.log('📡 Simulating WebSocket connection in demo mode');
            
            setTimeout(() => {
                onOpen && onOpen();
                // Send periodic demo updates
                setInterval(() => {
                    onMessage && onMessage({
                        data: JSON.stringify({
                            type: 'demo-update',
                            message: 'Demo WebSocket simulation',
                            timestamp: new Date().toISOString()
                        })
                    });
                }, 5000);
            }, 1000);
            
            return {
                send: (data) => console.log('📤 Demo WebSocket send:', data),
                close: () => console.log('📴 Demo WebSocket closed')
            };
        }

        // Real WebSocket connection
        const ws = new WebSocket(this.config.wsBase);
        
        ws.onopen = onOpen;
        ws.onmessage = onMessage;
        ws.onclose = onClose;
        
        return ws;
    }

    // Mock responses for demo mode
    mockResponse(endpoint, options) {
        const mockData = {
            '/api/jobs/process': {
                success: true,
                data: {
                    sessionId: 'demo-' + Date.now(),
                    jobData: {
                        jobTitle: 'Software Engineer (Demo)',
                        company: 'Demo Company Inc.',
                        location: 'Remote',
                        platform: 'demo',
                        description: 'This is a demo job posting. The full system would scrape real job details.',
                        requirements: ['JavaScript', 'React', 'Node.js']
                    },
                    documents: {
                        resume: {
                            content: `📄 DEMO RESUME\n\n${options.body ? JSON.parse(options.body).userProfile?.name || 'Your Name' : 'Your Name'}\nDemo Email Address\n\nPROFESSIONAL SUMMARY\nThis is a demo resume generated for testing purposes.\n\nEXPERIENCE\n${options.body ? JSON.parse(options.body).userProfile?.experience || 'Demo experience' : 'Demo experience'}\n\nSKILLS\n${options.body ? JSON.parse(options.body).userProfile?.skills || 'Demo skills' : 'Demo skills'}`
                        },
                        coverLetter: {
                            content: `📝 DEMO COVER LETTER\n\nDear Hiring Manager,\n\nThis is a demo cover letter generated for testing purposes.\n\nBest regards,\n${options.body ? JSON.parse(options.body).userProfile?.name || 'Your Name' : 'Your Name'}`
                        }
                    }
                }
            },
            '/api/jobs/test-scrape': {
                success: true,
                data: {
                    jobTitle: 'Demo Position',
                    company: 'Demo Company',
                    description: 'Demo job description from URL scraping test',
                    location: 'Demo Location',
                    platform: 'demo-site.com',
                    tested: true
                }
            },
            '/api/jobs/supported-sites': {
                success: true,
                data: {
                    sites: [
                        { name: 'Workable', supported: true, example: 'company.workable.com' },
                        { name: 'LinkedIn', supported: true, example: 'linkedin.com/jobs' },
                        { name: 'Indeed', supported: true, example: 'indeed.com/viewjob' },
                        { name: 'Demo Sites', supported: true, example: 'demo-jobs.com' }
                    ]
                }
            }
        };

        // Add artificial delay for realism
        return new Promise(resolve => {
            setTimeout(() => {
                const response = mockData[endpoint] || {
                    success: false,
                    error: 'Demo endpoint not found'
                };
                resolve(response);
            }, Math.random() * 2000 + 500); // 500-2500ms delay
        });
    }

    // Get status information
    getStatus() {
        return {
            environment: this.environment,
            config: this.config,
            backendStatus: this.backendStatus || { available: false, pending: true }
        };
    }

    // Show environment banner
    showEnvironmentBanner() {
        if (this.config.mode === 'demo') {
            const banner = document.createElement('div');
            banner.style.cssText = `
                background: linear-gradient(45deg, #fbbf24, #f59e0b);
                color: #92400e;
                padding: 1rem;
                text-align: center;
                font-weight: bold;
                border-bottom: 2px solid #f59e0b;
                position: relative;
                z-index: 1000;
            `;
            banner.innerHTML = `
                🚧 ${this.config.description} - For full functionality, deploy backend to Railway • 
                <a href="https://github.com/Soulfra/document-generator-mvp#deployment" 
                   style="color: #92400e; text-decoration: underline;">
                   View Setup Guide
                </a>
            `;
            document.body.insertBefore(banner, document.body.firstChild);
        }
    }

    // Process job application with intelligent routing
    async processJobApplication(jobData) {
        console.log(`🔄 Processing job application in ${this.config.mode} mode`);
        
        // Show progress simulation for demo mode
        if (this.config.mode === 'demo') {
            return this.simulateJobProcessing(jobData);
        }
        
        // Real processing
        return this.apiCall('/api/jobs/process', {
            method: 'POST',
            body: JSON.stringify(jobData)
        });
    }

    // Simulate job processing with realistic steps
    async simulateJobProcessing(jobData) {
        const steps = [
            { progress: 10, message: 'Initializing demo processing...', delay: 800 },
            { progress: 25, message: 'Analyzing job requirements (demo)...', delay: 1200 },
            { progress: 40, message: 'Generating tailored resume (demo)...', delay: 1800 },
            { progress: 60, message: 'Writing cover letter (demo)...', delay: 1500 },
            { progress: 80, message: 'Optimizing for ATS (demo)...', delay: 1000 },
            { progress: 100, message: 'Demo processing complete!', delay: 500 }
        ];

        // Emit progress events
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, step.delay));
            
            // Trigger progress callback if available
            if (window.onJobProgress) {
                window.onJobProgress(step.progress, step.message);
            }
        }

        // Return final demo result
        return this.mockResponse('/api/jobs/process', { body: JSON.stringify(jobData) });
    }
}

// Global instance
window.APIConfig = new APIConfig();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.APIConfig.showEnvironmentBanner();
    console.log('🌐 Document Generator API Config initialized:', window.APIConfig.getStatus());
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
}