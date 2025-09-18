const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { Pool } = require('pg');
const AuthSystem = require('./auth-system');
const SoulFraUniversalAuth = require('./soulfra-universal-auth');
const CalCookieMonster = require('./cal-cookie-monster');
const rateLimit = require('express-rate-limit');

/**
 * 🎵🪢 PROFESSIONAL PORTFOLIO BACKEND
 * Integrates authentication, music knot theory, and client management
 */

class PortfolioBackend {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        
        // Database connection
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/portfolio_platform',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeServices();
    }
    
    setupMiddleware() {
        // Session middleware for OAuth state management
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'soulfra-session-secret-change-in-production',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1000 * 60 * 15 // 15 minutes for OAuth flows
            }
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://soulfra.github.io', 'https://portfolio.soulfra.com']
                : ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:5500'],
            credentials: true
        }));
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // General rate limiting
        this.app.use(rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // 1000 requests per window
            message: {
                error: 'Too many requests, please try again later.',
                retryAfter: 15 * 60
            }
        }));
        
        // Request logging with Cal cookie tracking
        this.app.use((req, res, next) => {
            const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.path}`;
            if (req.path.includes('cookie') || req.path.includes('cal')) {
                console.log(`🍪 ${logMessage}`);
            } else {
                console.log(logMessage);
            }
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', async (req, res) => {
            try {
                // Test database connection
                const dbResult = await this.db.query('SELECT NOW()');
                
                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                    services: {
                        auth: 'ready',
                        portfolio: 'ready',
                        music_knots: 'ready',
                        analytics: 'ready'
                    },
                    uptime: process.uptime()
                });
            } catch (error) {
                console.error('Health check failed:', error);
                res.status(503).json({
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });
        
        // API versioning
        const apiV1 = express.Router();
        
        // Portfolio routes
        apiV1.get('/portfolio', this.getPublicPortfolio.bind(this));
        apiV1.get('/portfolio/skills', this.getSkills.bind(this));
        apiV1.get('/portfolio/projects', this.getProjects.bind(this));
        apiV1.get('/portfolio/experience', this.getExperience.bind(this));
        apiV1.get('/portfolio/reviews', this.getReviews.bind(this));
        
        // Music knot routes
        apiV1.post('/music/generate', this.generateMusic.bind(this));
        apiV1.get('/music/knots', this.getMusicKnots.bind(this));
        apiV1.post('/music/knots', this.authSystem.authenticateToken.bind(this.authSystem), this.createMusicKnot.bind(this));
        
        // Analytics routes
        apiV1.post('/analytics/event', this.trackEvent.bind(this));
        apiV1.get('/analytics/dashboard', this.authSystem.authenticateToken.bind(this.authSystem), this.getAnalyticsDashboard.bind(this));
        
        // Client management routes (admin only)
        apiV1.get('/clients', this.authSystem.authenticateToken.bind(this.authSystem), this.requireRole('admin'), this.getClients.bind(this));
        apiV1.post('/clients', this.authSystem.authenticateToken.bind(this.authSystem), this.requireRole('admin'), this.createClient.bind(this));
        apiV1.put('/clients/:id', this.authSystem.authenticateToken.bind(this.authSystem), this.requireRole('admin'), this.updateClient.bind(this));
        
        // Review management
        apiV1.post('/reviews', this.authSystem.authenticateToken.bind(this.authSystem), this.createReview.bind(this));
        apiV1.put('/reviews/:id/approve', this.authSystem.authenticateToken.bind(this.authSystem), this.requireRole('admin'), this.approveReview.bind(this));
        
        // LinkedIn integration
        apiV1.post('/linkedin/sync', this.authSystem.authenticateToken.bind(this.authSystem), this.syncLinkedInProfile.bind(this));
        
        this.app.use('/api/v1', apiV1);
        
        // Mount auth routes
        this.app.use('/auth', this.authSystem.getRouter());
        
        // Mount SoulFra Universal Auth routes
        this.app.use('/auth/soulfra', this.soulFraAuth.getRouter());
        
        // Error handling
        this.app.use(this.errorHandler.bind(this));
    }
    
    initializeServices() {
        // Initialize authentication system with database
        this.authSystem = new AuthSystem(this.db);
        console.log('✅ Authentication system initialized');
        
        // Initialize SoulFra Universal Auth system
        this.soulFraAuth = new SoulFraUniversalAuth(this.db);
        console.log('🌐 SoulFra Universal Auth initialized');
        
        // Initialize Cal Cookie Monster
        this.calCookieMonster = new CalCookieMonster(this.db);
        console.log('🍪 Cal Cookie Monster initialized and ready for cookies!');
        
        // Test database connection
        this.testDatabaseConnection();
    }
    
    async testDatabaseConnection() {
        try {
            const result = await this.db.query('SELECT NOW() as current_time, version() as postgres_version');
            console.log('✅ Database connected:', result.rows[0].current_time);
            console.log('📊 PostgreSQL version:', result.rows[0].postgres_version.split(' ')[0]);
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
        }
    }
    
    // Portfolio methods
    async getPublicPortfolio(req, res) {
        try {
            const portfolio = await this.db.query(`
                SELECT 
                    u.name,
                    u.bio,
                    u.linkedin_url,
                    u.github_url,
                    u.avatar_url,
                    json_agg(DISTINCT p.*) FILTER (WHERE p.id IS NOT NULL) as projects,
                    json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL) as skills,
                    json_agg(DISTINCT e.*) FILTER (WHERE e.id IS NOT NULL) as experiences
                FROM users u
                LEFT JOIN projects p ON u.id = p.user_id AND p.visibility = 'public' AND p.status = 'active'
                LEFT JOIN skills s ON u.id = s.user_id AND s.featured = true
                LEFT JOIN experiences e ON u.id = e.user_id AND e.featured = true
                WHERE u.active = true AND u.role = 'admin'
                GROUP BY u.id, u.name, u.bio, u.linkedin_url, u.github_url, u.avatar_url
            `);
            
            res.json({
                success: true,
                portfolio: portfolio.rows[0] || {}
            });
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            res.status(500).json({ error: 'Failed to fetch portfolio' });
        }
    }
    
    async getSkills(req, res) {
        try {
            const skills = await this.db.query(`
                SELECT s.*, mk.base_notes, mk.rhythm_pattern, mk.tempo
                FROM skills s
                LEFT JOIN music_knots mk ON s.knot_type = mk.knot_type AND s.user_id = mk.user_id
                WHERE s.user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
                ORDER BY s.featured DESC, s.display_order, s.name
            `);
            
            res.json({
                success: true,
                skills: skills.rows
            });
        } catch (error) {
            console.error('Error fetching skills:', error);
            res.status(500).json({ error: 'Failed to fetch skills' });
        }
    }
    
    async getProjects(req, res) {
        try {
            const projects = await this.db.query(`
                SELECT * FROM projects 
                WHERE user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
                AND visibility = 'public' AND status = 'active'
                ORDER BY featured DESC, display_order, created_at DESC
            `);
            
            res.json({
                success: true,
                projects: projects.rows
            });
        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ error: 'Failed to fetch projects' });
        }
    }
    
    async getExperience(req, res) {
        try {
            const experiences = await this.db.query(`
                SELECT * FROM experiences 
                WHERE user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
                ORDER BY current_position DESC, start_date DESC
            `);
            
            res.json({
                success: true,
                experiences: experiences.rows
            });
        } catch (error) {
            console.error('Error fetching experience:', error);
            res.status(500).json({ error: 'Failed to fetch experience' });
        }
    }
    
    async getReviews(req, res) {
        try {
            const reviews = await this.db.query(`
                SELECT r.*, c.company_name, c.contact_name
                FROM reviews r
                JOIN clients c ON r.client_id = c.id
                WHERE r.approved = true AND r.public_display = true
                ORDER BY r.featured DESC, r.submitted_at DESC
                LIMIT 10
            `);
            
            res.json({
                success: true,
                reviews: reviews.rows
            });
        } catch (error) {
            console.error('Error fetching reviews:', error);
            res.status(500).json({ error: 'Failed to fetch reviews' });
        }
    }
    
    // Music knot methods
    async generateMusic(req, res) {
        try {
            const { skill, complexity = 'medium' } = req.body;
            
            // Get skill's musical mapping
            const skillData = await this.db.query(`
                SELECT s.*, mk.base_notes, mk.rhythm_pattern, mk.tempo, mk.scale_type
                FROM skills s
                LEFT JOIN music_knots mk ON s.knot_type = mk.knot_type
                WHERE s.name = $1
                LIMIT 1
            `, [skill]);
            
            if (skillData.rows.length === 0) {
                return res.status(404).json({ error: 'Skill not found' });
            }
            
            const skillInfo = skillData.rows[0];
            
            // Generate music based on knot theory
            const musicData = this.generateMusicFromKnot(skillInfo, complexity);
            
            // Track analytics
            await this.trackMusicGeneration(req, skill, complexity);
            
            res.json({
                success: true,
                skill: skill,
                knot_type: skillInfo.knot_type,
                music: musicData,
                metadata: {
                    complexity,
                    generated_at: new Date().toISOString(),
                    duration_ms: musicData.duration_ms
                }
            });
        } catch (error) {
            console.error('Error generating music:', error);
            res.status(500).json({ error: 'Failed to generate music' });
        }
    }
    
    generateMusicFromKnot(skillInfo, complexity) {
        // Basic music generation algorithm based on knot theory
        const baseNotes = skillInfo.base_notes || [60, 64, 67]; // C major triad default
        const tempo = skillInfo.tempo || 120;
        const pattern = skillInfo.rhythm_pattern || 'steady';
        
        // Generate sequence based on complexity
        const complexityMultiplier = {
            'simple': 1,
            'medium': 2,
            'complex': 3
        }[complexity] || 2;
        
        const sequence = [];
        for (let i = 0; i < baseNotes.length * complexityMultiplier; i++) {
            const noteIndex = i % baseNotes.length;
            const note = baseNotes[noteIndex];
            const duration = this.getNoteDuration(pattern, i);
            
            sequence.push({
                note: note,
                frequency: 440 * Math.pow(2, (note - 69) / 12), // Convert MIDI to frequency
                duration: duration,
                start_time: sequence.reduce((sum, n) => sum + n.duration, 0)
            });
        }
        
        return {
            sequence: sequence,
            tempo: tempo,
            pattern: pattern,
            knot_type: skillInfo.knot_type,
            duration_ms: sequence.reduce((sum, note) => sum + note.duration, 0) * 1000
        };
    }
    
    getNoteDuration(pattern, index) {
        const patterns = {
            'steady': 0.5,
            'smooth': 0.75,
            'dynamic': [0.25, 0.5, 0.75][index % 3],
            'fast': 0.25,
            'complex': [0.125, 0.25, 0.5, 0.75, 1.0][index % 5],
            'secure': 1.0,
            'elegant': 0.6,
            'harmonic': [0.5, 0.5, 1.0][index % 3]
        };
        
        return patterns[pattern] || 0.5;
    }
    
    async getMusicKnots(req, res) {
        try {
            const knots = await this.db.query(`
                SELECT * FROM music_knots 
                WHERE user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
                ORDER BY name
            `);
            
            res.json({
                success: true,
                knots: knots.rows
            });
        } catch (error) {
            console.error('Error fetching music knots:', error);
            res.status(500).json({ error: 'Failed to fetch music knots' });
        }
    }
    
    async createMusicKnot(req, res) {
        try {
            const { name, knot_type, base_notes, rhythm_pattern, tempo, scale_type, associated_skill } = req.body;
            
            const result = await this.db.query(`
                INSERT INTO music_knots (user_id, name, knot_type, base_notes, rhythm_pattern, tempo, scale_type, associated_skill)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [req.user.userId, name, knot_type, JSON.stringify(base_notes), rhythm_pattern, tempo, scale_type, associated_skill]);
            
            res.status(201).json({
                success: true,
                knot: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating music knot:', error);
            res.status(500).json({ error: 'Failed to create music knot' });
        }
    }
    
    // Analytics methods
    async trackEvent(req, res) {
        try {
            const { event_type, event_data, session_id } = req.body;
            const ip_address = req.ip;
            const user_agent = req.get('User-Agent');
            const referrer = req.get('Referrer');
            
            await this.db.query(`
                INSERT INTO analytics_events (event_type, event_data, session_id, ip_address, user_agent, referrer)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [event_type, JSON.stringify(event_data), session_id, ip_address, user_agent, referrer]);
            
            res.json({ success: true });
        } catch (error) {
            console.error('Error tracking event:', error);
            res.status(500).json({ error: 'Failed to track event' });
        }
    }
    
    async trackMusicGeneration(req, skill, complexity) {
        const ip_address = req.ip;
        const user_agent = req.get('User-Agent');
        
        await this.db.query(`
            INSERT INTO analytics_events (event_type, event_data, ip_address, user_agent)
            VALUES ('music_generation', $1, $2, $3)
        `, [JSON.stringify({ skill, complexity }), ip_address, user_agent]);
    }
    
    async getAnalyticsDashboard(req, res) {
        try {
            // Get analytics summary
            const stats = await this.db.query(`
                SELECT 
                    COUNT(*) as total_events,
                    COUNT(DISTINCT session_id) as unique_sessions,
                    COUNT(*) FILTER (WHERE event_type = 'music_generation') as music_generations,
                    COUNT(*) FILTER (WHERE event_type = 'skill_click') as skill_clicks,
                    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h_events
                FROM analytics_events
                WHERE created_at > NOW() - INTERVAL '30 days'
            `);
            
            // Get popular skills
            const popularSkills = await this.db.query(`
                SELECT 
                    event_data->>'skill' as skill_name,
                    COUNT(*) as click_count
                FROM analytics_events 
                WHERE event_type = 'music_generation' 
                AND created_at > NOW() - INTERVAL '30 days'
                GROUP BY event_data->>'skill'
                ORDER BY click_count DESC
                LIMIT 10
            `);
            
            res.json({
                success: true,
                analytics: {
                    summary: stats.rows[0],
                    popular_skills: popularSkills.rows,
                    period: '30 days'
                }
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
    
    // Client management methods
    async getClients(req, res) {
        try {
            const clients = await this.db.query(`
                SELECT c.*, 
                       COUNT(r.id) as review_count,
                       AVG(r.rating) as avg_rating
                FROM clients c
                LEFT JOIN reviews r ON c.id = r.client_id
                WHERE c.user_id = $1
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `, [req.user.userId]);
            
            res.json({
                success: true,
                clients: clients.rows
            });
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ error: 'Failed to fetch clients' });
        }
    }
    
    async createClient(req, res) {
        try {
            const { company_name, contact_name, contact_email, contact_phone, project_type, budget_range, timeline, notes } = req.body;
            
            const result = await this.db.query(`
                INSERT INTO clients (user_id, company_name, contact_name, contact_email, contact_phone, project_type, budget_range, timeline, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [req.user.userId, company_name, contact_name, contact_email, contact_phone, project_type, budget_range, timeline, notes]);
            
            res.status(201).json({
                success: true,
                client: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({ error: 'Failed to create client' });
        }
    }
    
    async updateClient(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            // Build dynamic update query
            const setClause = Object.keys(updates)
                .map((key, index) => `${key} = $${index + 2}`)
                .join(', ');
            
            const values = [id, ...Object.values(updates)];
            
            const result = await this.db.query(`
                UPDATE clients 
                SET ${setClause}, updated_at = NOW()
                WHERE id = $1 AND user_id = $${values.length + 1}
                RETURNING *
            `, [...values, req.user.userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }
            
            res.json({
                success: true,
                client: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating client:', error);
            res.status(500).json({ error: 'Failed to update client' });
        }
    }
    
    async createReview(req, res) {
        try {
            const { client_id, project_id, rating, title, content } = req.body;
            
            const result = await this.db.query(`
                INSERT INTO reviews (client_id, project_id, rating, title, content)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [client_id, project_id, rating, title, content]);
            
            res.status(201).json({
                success: true,
                review: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating review:', error);
            res.status(500).json({ error: 'Failed to create review' });
        }
    }
    
    async approveReview(req, res) {
        try {
            const { id } = req.params;
            const { approved, public_display = false } = req.body;
            
            const result = await this.db.query(`
                UPDATE reviews 
                SET approved = $1, public_display = $2, approved_at = NOW()
                WHERE id = $3
                RETURNING *
            `, [approved, public_display, id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Review not found' });
            }
            
            res.json({
                success: true,
                review: result.rows[0]
            });
        } catch (error) {
            console.error('Error approving review:', error);
            res.status(500).json({ error: 'Failed to approve review' });
        }
    }
    
    // LinkedIn integration
    async syncLinkedInProfile(req, res) {
        try {
            // Placeholder for LinkedIn API integration
            // In production, this would call LinkedIn API to get profile data
            
            res.json({
                success: true,
                message: 'LinkedIn sync functionality coming soon',
                synced_fields: [],
                last_sync: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error syncing LinkedIn:', error);
            res.status(500).json({ error: 'Failed to sync LinkedIn profile' });
        }
    }
    
    // Middleware
    requireRole(role) {
        return (req, res, next) => {
            if (!req.user || req.user.role !== role) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            next();
        };
    }
    
    errorHandler(error, req, res, next) {
        console.error('Server error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
    
    // Server lifecycle
    async start() {
        try {
            await this.testDatabaseConnection();
            
            this.server = this.app.listen(this.port, () => {
                console.log(`\n🎵🪢 Portfolio Backend Server Running`);
                console.log(`📍 Port: ${this.port}`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`🔐 Auth: JWT-based authentication`);
                console.log(`🎼 Music: Knot theory integration`);
                console.log(`📊 Features: Analytics, Client Management, LinkedIn sync`);
                console.log(`\n🚀 Ready to serve portfolio requests!`);
            });
            
            return this.server;
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    
    async stop() {
        if (this.server) {
            this.server.close();
            await this.db.end();
            console.log('Portfolio backend stopped');
        }
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new PortfolioBackend();
    server.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => server.stop());
    process.on('SIGINT', () => server.stop());
}

module.exports = PortfolioBackend;