/**
 * Agreement Decoder System
 * Decrypts and displays asterisk-masked recruitment agreements
 * Allows secure viewing of collected legal contracts and user data
 */

const express = require('express');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class AgreementDecoderSystem {
    constructor() {
        this.app = express();
        this.port = 42014;
        this.dbPath = './recruitment-agreements.db';
        this.encryptionKey = process.env.AGREEMENT_ENCRYPTION_KEY || 'cookie-monster-secret-key-2025';
        
        this.setupDatabase();
        this.setupRoutes();
        this.setupMiddleware();
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static('public'));
        
        // CORS for local development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            next();
        });
    }

    setupDatabase() {
        const db = new sqlite3.Database(this.dbPath);
        
        db.serialize(() => {
            // Create agreements table
            db.run(`
                CREATE TABLE IF NOT EXISTS recruitment_agreements (
                    id TEXT PRIMARY KEY,
                    character TEXT NOT NULL,
                    email TEXT NOT NULL,
                    encrypted_access_code TEXT,
                    income_range TEXT,
                    encrypted_business_info TEXT,
                    tech_experience TEXT,
                    signature_data TEXT,
                    user_agent TEXT,
                    recruitment_source TEXT,
                    created_at INTEGER,
                    decoded_at INTEGER,
                    decoder_user TEXT
                )
            `);
            
            // Create decoder sessions table
            db.run(`
                CREATE TABLE IF NOT EXISTS decoder_sessions (
                    id TEXT PRIMARY KEY,
                    admin_email TEXT NOT NULL,
                    session_token TEXT NOT NULL,
                    permissions TEXT,
                    created_at INTEGER,
                    expires_at INTEGER,
                    last_used INTEGER
                )
            `);
            
            // Create audit log
            db.run(`
                CREATE TABLE IF NOT EXISTS decoder_audit_log (
                    id TEXT PRIMARY KEY,
                    session_id TEXT,
                    action TEXT,
                    agreement_id TEXT,
                    timestamp INTEGER,
                    ip_address TEXT,
                    details TEXT
                )
            `);
        });
        
        db.close();
        console.log('🔒 Agreement decoder database initialized');
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                service: 'Agreement Decoder System',
                status: 'healthy',
                version: '1.0.0',
                timestamp: Date.now()
            });
        });

        // Admin login
        this.app.post('/decoder/login', async (req, res) => {
            try {
                const { adminEmail, masterPassword } = req.body;
                
                // Verify master password (in production, use proper auth)
                if (masterPassword !== 'cookie-monster-master-2025') {
                    return res.status(401).json({ 
                        success: false, 
                        error: 'Invalid master password' 
                    });
                }
                
                const sessionToken = this.generateSessionToken();
                const sessionId = this.generateUUID();
                
                const db = new sqlite3.Database(this.dbPath);
                
                const session = {
                    id: sessionId,
                    admin_email: adminEmail,
                    session_token: sessionToken,
                    permissions: JSON.stringify(['read_agreements', 'decode_data', 'export_data']),
                    created_at: Date.now(),
                    expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                    last_used: Date.now()
                };
                
                db.run(`
                    INSERT INTO decoder_sessions 
                    (id, admin_email, session_token, permissions, created_at, expires_at, last_used)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [session.id, session.admin_email, session.session_token, 
                    session.permissions, session.created_at, session.expires_at, session.last_used], 
                function(err) {
                    if (err) {
                        console.error('Session creation error:', err);
                        return res.status(500).json({ success: false, error: 'Session creation failed' });
                    }
                    
                    res.json({
                        success: true,
                        sessionToken,
                        expiresAt: session.expires_at,
                        permissions: JSON.parse(session.permissions)
                    });
                });
                
                db.close();
                
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ success: false, error: 'Login failed' });
            }
        });

        // List agreements (encrypted summary)
        this.app.get('/decoder/agreements', async (req, res) => {
            try {
                const sessionToken = req.headers.authorization?.replace('Bearer ', '');
                
                if (!await this.validateSession(sessionToken)) {
                    return res.status(401).json({ success: false, error: 'Invalid session' });
                }
                
                const db = new sqlite3.Database(this.dbPath);
                
                db.all(`
                    SELECT 
                        id, character, email, income_range, recruitment_source, 
                        created_at, decoded_at, decoder_user,
                        CASE WHEN encrypted_access_code IS NOT NULL THEN 'YES' ELSE 'NO' END as has_access_code,
                        CASE WHEN encrypted_business_info IS NOT NULL THEN 'YES' ELSE 'NO' END as has_business_info,
                        CASE WHEN signature_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_signature
                    FROM recruitment_agreements 
                    ORDER BY created_at DESC
                `, [], (err, rows) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ success: false, error: 'Database error' });
                    }
                    
                    const agreements = rows.map(row => ({
                        ...row,
                        created_at_readable: new Date(row.created_at).toLocaleString(),
                        decoded_at_readable: row.decoded_at ? new Date(row.decoded_at).toLocaleString() : null
                    }));
                    
                    res.json({
                        success: true,
                        agreements,
                        total: agreements.length
                    });
                });
                
                db.close();
                
            } catch (error) {
                console.error('List agreements error:', error);
                res.status(500).json({ success: false, error: 'Failed to list agreements' });
            }
        });

        // Decode specific agreement
        this.app.post('/decoder/decode/:agreementId', async (req, res) => {
            try {
                const { agreementId } = req.params;
                const sessionToken = req.headers.authorization?.replace('Bearer ', '');
                const { justification } = req.body;
                
                const session = await this.validateSession(sessionToken);
                if (!session) {
                    return res.status(401).json({ success: false, error: 'Invalid session' });
                }
                
                const db = new sqlite3.Database(this.dbPath);
                
                db.get(`
                    SELECT * FROM recruitment_agreements WHERE id = ?
                `, [agreementId], (err, row) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ success: false, error: 'Database error' });
                    }
                    
                    if (!row) {
                        return res.status(404).json({ success: false, error: 'Agreement not found' });
                    }
                    
                    // Decrypt sensitive fields
                    const decodedAgreement = {
                        id: row.id,
                        character: row.character,
                        email: row.email,
                        access_code: row.encrypted_access_code ? this.decrypt(row.encrypted_access_code) : null,
                        income_range: row.income_range,
                        business_info: row.encrypted_business_info ? this.decrypt(row.encrypted_business_info) : null,
                        tech_experience: row.tech_experience,
                        signature_data: row.signature_data,
                        user_agent: row.user_agent,
                        recruitment_source: row.recruitment_source,
                        created_at: row.created_at,
                        created_at_readable: new Date(row.created_at).toLocaleString(),
                        decoded_by: session.admin_email,
                        decoded_at: Date.now()
                    };
                    
                    // Update decoded timestamp
                    db.run(`
                        UPDATE recruitment_agreements 
                        SET decoded_at = ?, decoder_user = ?
                        WHERE id = ?
                    `, [Date.now(), session.admin_email, agreementId]);
                    
                    // Log the decoding action
                    this.logAuditAction(session.id, 'DECODE_AGREEMENT', agreementId, {
                        justification,
                        admin_email: session.admin_email
                    });
                    
                    res.json({
                        success: true,
                        agreement: decodedAgreement
                    });
                });
                
                db.close();
                
            } catch (error) {
                console.error('Decode agreement error:', error);
                res.status(500).json({ success: false, error: 'Failed to decode agreement' });
            }
        });

        // Export agreements (CSV format)
        this.app.get('/decoder/export', async (req, res) => {
            try {
                const sessionToken = req.headers.authorization?.replace('Bearer ', '');
                const session = await this.validateSession(sessionToken);
                
                if (!session) {
                    return res.status(401).json({ success: false, error: 'Invalid session' });
                }
                
                const db = new sqlite3.Database(this.dbPath);
                
                db.all(`
                    SELECT * FROM recruitment_agreements ORDER BY created_at DESC
                `, [], (err, rows) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ success: false, error: 'Database error' });
                    }
                    
                    const csvData = this.generateCSVExport(rows);
                    
                    // Log export action
                    this.logAuditAction(session.id, 'EXPORT_AGREEMENTS', null, {
                        record_count: rows.length,
                        admin_email: session.admin_email
                    });
                    
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename="agreements-export-${Date.now()}.csv"`);
                    res.send(csvData);
                });
                
                db.close();
                
            } catch (error) {
                console.error('Export error:', error);
                res.status(500).json({ success: false, error: 'Export failed' });
            }
        });

        // Get audit log
        this.app.get('/decoder/audit', async (req, res) => {
            try {
                const sessionToken = req.headers.authorization?.replace('Bearer ', '');
                
                if (!await this.validateSession(sessionToken)) {
                    return res.status(401).json({ success: false, error: 'Invalid session' });
                }
                
                const db = new sqlite3.Database(this.dbPath);
                
                db.all(`
                    SELECT 
                        dal.*, ds.admin_email 
                    FROM decoder_audit_log dal
                    LEFT JOIN decoder_sessions ds ON dal.session_id = ds.id
                    ORDER BY dal.timestamp DESC
                    LIMIT 100
                `, [], (err, rows) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ success: false, error: 'Database error' });
                    }
                    
                    const auditLog = rows.map(row => ({
                        ...row,
                        timestamp_readable: new Date(row.timestamp).toLocaleString(),
                        details: row.details ? JSON.parse(row.details) : null
                    }));
                    
                    res.json({
                        success: true,
                        auditLog
                    });
                });
                
                db.close();
                
            } catch (error) {
                console.error('Audit log error:', error);
                res.status(500).json({ success: false, error: 'Failed to retrieve audit log' });
            }
        });

        // Serve decoder dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDecoderDashboard());
        });
    }

    // Utility methods
    encrypt(text) {
        const cipher = crypto.createCipher('aes256', this.encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decrypt(encryptedText) {
        try {
            const decipher = crypto.createDecipher('aes256', this.encryptionKey);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return '[DECRYPTION_ERROR]';
        }
    }

    generateSessionToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    generateUUID() {
        return crypto.randomUUID();
    }

    async validateSession(sessionToken) {
        return new Promise((resolve) => {
            const db = new sqlite3.Database(this.dbPath);
            
            db.get(`
                SELECT * FROM decoder_sessions 
                WHERE session_token = ? AND expires_at > ?
            `, [sessionToken, Date.now()], (err, row) => {
                if (err || !row) {
                    resolve(null);
                } else {
                    // Update last used
                    db.run(`UPDATE decoder_sessions SET last_used = ? WHERE id = ?`, 
                           [Date.now(), row.id]);
                    resolve(row);
                }
            });
            
            db.close();
        });
    }

    logAuditAction(sessionId, action, agreementId, details) {
        const db = new sqlite3.Database(this.dbPath);
        
        db.run(`
            INSERT INTO decoder_audit_log 
            (id, session_id, action, agreement_id, timestamp, details)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            this.generateUUID(),
            sessionId,
            action,
            agreementId,
            Date.now(),
            JSON.stringify(details)
        ]);
        
        db.close();
    }

    generateCSVExport(agreements) {
        const headers = [
            'ID', 'Character', 'Email', 'Access Code', 'Income Range', 
            'Business Info', 'Tech Experience', 'Has Signature', 
            'Recruitment Source', 'Created At', 'Decoded At', 'Decoder User'
        ];
        
        let csv = headers.join(',') + '\n';
        
        agreements.forEach(agreement => {
            const row = [
                agreement.id,
                agreement.character,
                agreement.email,
                agreement.encrypted_access_code ? this.decrypt(agreement.encrypted_access_code) : '',
                agreement.income_range || '',
                agreement.encrypted_business_info ? this.decrypt(agreement.encrypted_business_info) : '',
                agreement.tech_experience || '',
                agreement.signature_data ? 'YES' : 'NO',
                agreement.recruitment_source,
                new Date(agreement.created_at).toISOString(),
                agreement.decoded_at ? new Date(agreement.decoded_at).toISOString() : '',
                agreement.decoder_user || ''
            ].map(field => `"${String(field).replace(/"/g, '""')}"`);
            
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }

    generateDecoderDashboard() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔒 Agreement Decoder Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
            color: #00ff00;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border: 2px solid #00ff00;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }

        .title {
            font-size: 2em;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #ffff00;
            font-size: 1.1em;
        }

        .login-form {
            background: rgba(0,0,0,0.9);
            padding: 30px;
            border: 2px solid #ff4500;
            border-radius: 10px;
            margin-bottom: 30px;
        }

        .form-group {
            margin: 20px 0;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            color: #ffff00;
            font-weight: bold;
        }

        .form-input {
            width: 100%;
            padding: 12px;
            background: #000;
            color: #00ff00;
            border: 2px solid #00ff00;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 1em;
        }

        .form-input:focus {
            outline: none;
            border-color: #ffff00;
            box-shadow: 0 0 10px rgba(255,255,0,0.3);
        }

        .btn {
            background: linear-gradient(45deg, #ff4500, #ff6500);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255,69,0,0.4);
        }

        .agreements-table {
            background: rgba(0,0,0,0.9);
            border: 2px solid #00ff00;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 30px;
        }

        .table-header {
            background: #00ff00;
            color: #000;
            padding: 15px;
            font-weight: bold;
            text-align: center;
        }

        .table-content {
            max-height: 500px;
            overflow-y: auto;
        }

        .agreement-row {
            padding: 15px;
            border-bottom: 1px solid #333;
            cursor: pointer;
            transition: background 0.3s ease;
        }

        .agreement-row:hover {
            background: rgba(0,255,0,0.1);
        }

        .agreement-info {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 20px;
            align-items: center;
        }

        .decode-btn {
            background: linear-gradient(45deg, #ff0000, #ff4500);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.9em;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
        }

        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a1a1a;
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 30px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
        }

        .decoded-data {
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border: 1px solid #ffff00;
            border-radius: 5px;
            margin: 10px 0;
        }

        .sensitive-data {
            color: #ff4500;
            font-weight: bold;
        }

        .status-connected {
            color: #00ff00;
        }

        .status-disconnected {
            color: #ff0000;
        }

        .close-btn {
            float: right;
            background: #ff0000;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🔒 Agreement Decoder Dashboard</div>
            <div class="subtitle">Secure Access to Cookie Monster Recruitment Data</div>
            <div id="connectionStatus" class="status-disconnected">⚠️ Not Connected</div>
        </div>

        <div id="loginSection" class="login-form">
            <h3 style="color: #ff4500; margin-bottom: 20px;">🍪 Admin Authentication Required</h3>
            <div class="form-group">
                <label class="form-label">Admin Email:</label>
                <input type="email" id="adminEmail" class="form-input" placeholder="admin@nilsportsagency.com">
            </div>
            <div class="form-group">
                <label class="form-label">Master Password:</label>
                <input type="password" id="masterPassword" class="form-input" placeholder="Enter master password">
            </div>
            <button class="btn" onclick="login()">🔓 Access Decoder System</button>
        </div>

        <div id="dashboardSection" style="display: none;">
            <div class="agreements-table">
                <div class="table-header">
                    📄 Collected Recruitment Agreements
                    <button class="btn" onclick="exportAgreements()" style="float: right;">📊 Export CSV</button>
                    <button class="btn" onclick="refreshAgreements()" style="float: right; margin-right: 10px;">🔄 Refresh</button>
                </div>
                <div class="table-content" id="agreementsTable">
                    <!-- Agreements will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <!-- Decode Modal -->
    <div id="decodeModal" class="modal">
        <div class="modal-content">
            <button class="close-btn" onclick="closeModal()">✕</button>
            <h3 style="color: #ff4500; margin-bottom: 20px;">🔓 Decoded Agreement Data</h3>
            <div id="decodedContent">
                <!-- Decoded data will appear here -->
            </div>
        </div>
    </div>

    <script>
        let sessionToken = null;
        let currentAgreements = [];

        async function login() {
            const adminEmail = document.getElementById('adminEmail').value;
            const masterPassword = document.getElementById('masterPassword').value;

            if (!adminEmail || !masterPassword) {
                alert('Please enter both email and password');
                return;
            }

            try {
                const response = await fetch('/decoder/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ adminEmail, masterPassword })
                });

                const result = await response.json();

                if (result.success) {
                    sessionToken = result.sessionToken;
                    document.getElementById('loginSection').style.display = 'none';
                    document.getElementById('dashboardSection').style.display = 'block';
                    document.getElementById('connectionStatus').textContent = '✅ Connected as ' + adminEmail;
                    document.getElementById('connectionStatus').className = 'status-connected';
                    
                    await loadAgreements();
                } else {
                    alert('Login failed: ' + result.error);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed: Network error');
            }
        }

        async function loadAgreements() {
            try {
                const response = await fetch('/decoder/agreements', {
                    headers: {
                        'Authorization': 'Bearer ' + sessionToken
                    }
                });

                const result = await response.json();

                if (result.success) {
                    currentAgreements = result.agreements;
                    renderAgreements(result.agreements);
                } else {
                    alert('Failed to load agreements: ' + result.error);
                }
            } catch (error) {
                console.error('Load agreements error:', error);
                alert('Failed to load agreements');
            }
        }

        function renderAgreements(agreements) {
            const table = document.getElementById('agreementsTable');
            
            if (agreements.length === 0) {
                table.innerHTML = '<div style="padding: 20px; text-align: center; color: #ffff00;">No agreements found</div>';
                return;
            }

            let html = '';
            agreements.forEach(agreement => {
                html += \`
                    <div class="agreement-row">
                        <div class="agreement-info">
                            <div>
                                <strong>\${agreement.character}</strong> - \${agreement.email}<br>
                                <small>Source: \${agreement.recruitment_source}</small><br>
                                <small>Created: \${agreement.created_at_readable}</small>
                            </div>
                            <div>
                                Access Code: \${agreement.has_access_code}<br>
                                Business Info: \${agreement.has_business_info}<br>
                                Signature: \${agreement.has_signature}
                            </div>
                            <div>
                                Income: \${agreement.income_range || 'Not specified'}<br>
                                \${agreement.decoded_at ? 'Decoded: ' + agreement.decoded_at_readable : 'Never decoded'}
                            </div>
                            <div>
                                <button class="decode-btn" onclick="decodeAgreement('\${agreement.id}')">
                                    🔓 Decode
                                </button>
                            </div>
                        </div>
                    </div>
                \`;
            });
            
            table.innerHTML = html;
        }

        async function decodeAgreement(agreementId) {
            const justification = prompt('Enter justification for decoding this agreement:');
            if (!justification) return;

            try {
                const response = await fetch(\`/decoder/decode/\${agreementId}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + sessionToken
                    },
                    body: JSON.stringify({ justification })
                });

                const result = await response.json();

                if (result.success) {
                    showDecodedData(result.agreement);
                } else {
                    alert('Decoding failed: ' + result.error);
                }
            } catch (error) {
                console.error('Decode error:', error);
                alert('Decoding failed');
            }
        }

        function showDecodedData(agreement) {
            const content = \`
                <div class="decoded-data">
                    <h4>Basic Information</h4>
                    <p><strong>ID:</strong> \${agreement.id}</p>
                    <p><strong>Character Guide:</strong> \${agreement.character}</p>
                    <p><strong>Email:</strong> \${agreement.email}</p>
                    <p><strong>Created:</strong> \${agreement.created_at_readable}</p>
                </div>
                
                <div class="decoded-data">
                    <h4>Sensitive Data (Asterisk-Masked)</h4>
                    <p><strong>Access Code:</strong> <span class="sensitive-data">\${agreement.access_code || 'Not provided'}</span></p>
                    <p><strong>Business Info:</strong> <span class="sensitive-data">\${agreement.business_info || 'Not provided'}</span></p>
                    <p><strong>Income Range:</strong> \${agreement.income_range || 'Not specified'}</p>
                </div>
                
                <div class="decoded-data">
                    <h4>Additional Information</h4>
                    <p><strong>Tech Experience:</strong> \${agreement.tech_experience || 'Not provided'}</p>
                    <p><strong>Recruitment Source:</strong> \${agreement.recruitment_source}</p>
                    <p><strong>User Agent:</strong> \${agreement.user_agent}</p>
                    <p><strong>Has Digital Signature:</strong> \${agreement.signature_data ? 'YES' : 'NO'}</p>
                </div>
                
                <div class="decoded-data">
                    <h4>Audit Trail</h4>
                    <p><strong>Decoded By:</strong> \${agreement.decoded_by}</p>
                    <p><strong>Decoded At:</strong> \${new Date(agreement.decoded_at).toLocaleString()}</p>
                </div>
            \`;
            
            document.getElementById('decodedContent').innerHTML = content;
            document.getElementById('decodeModal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('decodeModal').style.display = 'none';
        }

        async function exportAgreements() {
            try {
                const response = await fetch('/decoder/export', {
                    headers: {
                        'Authorization': 'Bearer ' + sessionToken
                    }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`agreements-export-\${Date.now()}.csv\`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                } else {
                    alert('Export failed');
                }
            } catch (error) {
                console.error('Export error:', error);
                alert('Export failed');
            }
        }

        function refreshAgreements() {
            loadAgreements();
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('decodeModal');
            if (event.target === modal) {
                closeModal();
            }
        }
    </script>
</body>
</html>
        `;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🔒 Agreement Decoder System running on http://localhost:${this.port}`);
            console.log('🍪 Ready to decode Cookie Monster recruitment agreements');
            console.log('🔐 Master password: cookie-monster-master-2025');
        });
    }
}

// Start the service
const decoderSystem = new AgreementDecoderSystem();
decoderSystem.start();

module.exports = { AgreementDecoderSystem };