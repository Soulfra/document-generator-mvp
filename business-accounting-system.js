#!/usr/bin/env node

/**
 * 💼 BUSINESS ACCOUNTING SYSTEM
 * QuickBooks-style accounting for the modern economy
 * Tracks crypto, fiat, expenses, and calculates taxes
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Initialize database
const db = new sqlite3.Database('./business-accounting.db');

// Business configuration
const businessConfig = {
    name: 'Your Business Name',
    ein: '',
    address: '',
    taxYear: new Date().getFullYear(),
    fiscalYearStart: 'January',
    accountingMethod: 'cash', // or 'accrual'
    businessType: 'LLC' // LLC, S-Corp, C-Corp, Sole Prop
};

// Accounting state
let accountingState = {
    accounts: {
        revenue: 0,
        expenses: 0,
        assets: 0,
        liabilities: 0,
        equity: 0
    },
    currentQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
    taxesOwed: {
        federal: 0,
        state: 0,
        quarterly: 0
    },
    connectedWallets: [],
    connectedBanks: [],
    sessionId: generateSessionId()
};

// Tax rates and brackets (2024)
const TAX_CONFIG = {
    federal: {
        corporateRate: 0.21,
        selfEmployment: 0.153,
        brackets: [
            { min: 0, max: 11000, rate: 0.10 },
            { min: 11000, max: 44725, rate: 0.12 },
            { min: 44725, max: 95375, rate: 0.22 },
            { min: 95375, max: 182050, rate: 0.24 },
            { min: 182050, max: 231250, rate: 0.32 },
            { min: 231250, max: 578125, rate: 0.35 },
            { min: 578125, max: Infinity, rate: 0.37 }
        ]
    },
    state: {
        CA: 0.0884, // California
        NY: 0.0685, // New York
        TX: 0,      // Texas (no state tax)
        FL: 0,      // Florida (no state tax)
        // Add more states as needed
    },
    deductions: {
        standard: 13850, // 2024 standard deduction
        business: {
            homeOffice: 5, // per sq ft
            mileage: 0.655, // per mile
            meals: 0.5, // 50% deductible
            equipment: 1.0 // 100% deductible
        }
    }
};

// Initialize database tables
function initializeDatabase() {
    // Transactions table
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT CHECK(type IN ('income', 'expense')),
            account TEXT,
            tax_deductible BOOLEAN DEFAULT 0,
            receipt_url TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Accounts table
    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('bank', 'crypto', 'credit', 'cash')),
            address TEXT,
            balance REAL DEFAULT 0,
            currency TEXT DEFAULT 'USD',
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Invoices table
    db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            client_name TEXT NOT NULL,
            client_email TEXT,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            due_date DATE,
            paid_date DATE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Tax payments table
    db.run(`
        CREATE TABLE IF NOT EXISTS tax_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tax_year INTEGER NOT NULL,
            quarter INTEGER,
            payment_type TEXT,
            amount REAL NOT NULL,
            payment_date DATE,
            confirmation_number TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Contractors/1099s table
    db.run(`
        CREATE TABLE IF NOT EXISTS contractors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            address TEXT,
            tax_id TEXT,
            total_paid REAL DEFAULT 0,
            tax_year INTEGER,
            form_1099_sent BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    console.log('📊 Database initialized');
}

// Business logic classes
class AccountingEngine {
    static async recordTransaction(data) {
        const { date, description, category, amount, type, account, taxDeductible, notes } = data;
        
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO transactions (date, description, category, amount, type, account, tax_deductible, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [date, description, category, amount, type, account, taxDeductible ? 1 : 0, notes],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, ...data });
                }
            );
        });
    }
    
    static async getTransactions(filters = {}) {
        let query = 'SELECT * FROM transactions WHERE 1=1';
        const params = [];
        
        if (filters.startDate) {
            query += ' AND date >= ?';
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ' AND date <= ?';
            params.push(filters.endDate);
        }
        
        if (filters.type) {
            query += ' AND type = ?';
            params.push(filters.type);
        }
        
        if (filters.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }
        
        query += ' ORDER BY date DESC';
        
        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    static async calculateProfitLoss(startDate, endDate) {
        const transactions = await this.getTransactions({ startDate, endDate });
        
        let revenue = 0;
        let expenses = 0;
        let deductibleExpenses = 0;
        
        transactions.forEach(tx => {
            if (tx.type === 'income') {
                revenue += tx.amount;
            } else if (tx.type === 'expense') {
                expenses += tx.amount;
                if (tx.tax_deductible) {
                    deductibleExpenses += tx.amount;
                }
            }
        });
        
        const grossProfit = revenue - expenses;
        const taxableIncome = revenue - deductibleExpenses;
        
        return {
            revenue,
            expenses,
            deductibleExpenses,
            grossProfit,
            taxableIncome,
            profitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0
        };
    }
}

class TaxCalculator {
    static calculateQuarterlyTax(income, previousPayments = 0) {
        // Self-employment tax
        const selfEmploymentTax = income * TAX_CONFIG.federal.selfEmployment;
        
        // Federal income tax (simplified)
        let federalTax = 0;
        let remainingIncome = income;
        
        for (const bracket of TAX_CONFIG.federal.brackets) {
            if (remainingIncome <= 0) break;
            
            const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
            federalTax += taxableInBracket * bracket.rate;
            remainingIncome -= taxableInBracket;
        }
        
        // Quarterly payment (divide by 4)
        const totalTax = (selfEmploymentTax + federalTax) / 4;
        const amountDue = Math.max(0, totalTax - previousPayments);
        
        return {
            selfEmploymentTax: selfEmploymentTax / 4,
            federalIncomeTax: federalTax / 4,
            totalQuarterly: totalTax,
            amountDue,
            dueDate: this.getQuarterlyDueDate()
        };
    }
    
    static getQuarterlyDueDate() {
        const now = new Date();
        const year = now.getFullYear();
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        
        const dueDates = {
            1: new Date(year, 3, 15), // April 15
            2: new Date(year, 5, 15), // June 15
            3: new Date(year, 8, 15), // September 15
            4: new Date(year + 1, 0, 15) // January 15
        };
        
        return dueDates[quarter];
    }
    
    static async generateTaxSummary(year) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        const pl = await AccountingEngine.calculateProfitLoss(startDate, endDate);
        const quarterlyTax = this.calculateQuarterlyTax(pl.taxableIncome);
        
        // Get tax payments made
        const payments = await new Promise((resolve, reject) => {
            db.all(
                'SELECT SUM(amount) as total FROM tax_payments WHERE tax_year = ?',
                [year],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows[0]?.total || 0);
                }
            );
        });
        
        return {
            year,
            grossIncome: pl.revenue,
            deductions: pl.deductibleExpenses,
            taxableIncome: pl.taxableIncome,
            estimatedTax: quarterlyTax.totalQuarterly * 4,
            paymentsMade: payments,
            remainingTax: (quarterlyTax.totalQuarterly * 4) - payments,
            quarterlyBreakdown: quarterlyTax
        };
    }
}

class ExpenseTracker {
    static categories = {
        'Advertising': { deductible: true },
        'Car and truck': { deductible: true, mileageRate: TAX_CONFIG.deductions.business.mileage },
        'Commissions': { deductible: true },
        'Contract labor': { deductible: true, requires1099: true },
        'Depreciation': { deductible: true },
        'Insurance': { deductible: true },
        'Interest': { deductible: true },
        'Legal and professional': { deductible: true },
        'Office expense': { deductible: true },
        'Rent': { deductible: true },
        'Repairs': { deductible: true },
        'Supplies': { deductible: true },
        'Taxes and licenses': { deductible: true },
        'Travel': { deductible: true },
        'Meals': { deductible: true, deductionRate: TAX_CONFIG.deductions.business.meals },
        'Utilities': { deductible: true },
        'Wages': { deductible: true },
        'Other': { deductible: false },
        'Personal': { deductible: false }
    };
    
    static async categorizeExpense(description, amount) {
        // AI-powered categorization (mock for now)
        const keywords = {
            'uber|lyft|taxi|gas': 'Car and truck',
            'google ads|facebook|marketing': 'Advertising',
            'lawyer|attorney|cpa|accountant': 'Legal and professional',
            'aws|hosting|domain|software': 'Office expense',
            'contractor|freelance|consultant': 'Contract labor',
            'lunch|dinner|coffee|restaurant': 'Meals',
            'flight|hotel|airbnb': 'Travel',
            'insurance|health|liability': 'Insurance'
        };
        
        for (const [pattern, category] of Object.entries(keywords)) {
            if (new RegExp(pattern, 'i').test(description)) {
                return {
                    category,
                    deductible: this.categories[category].deductible,
                    confidence: 0.85
                };
            }
        }
        
        return {
            category: 'Other',
            deductible: false,
            confidence: 0.5
        };
    }
}

// API Routes
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>💼 Business Accounting System</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .positive { color: #27ae60; }
        .negative { color: #e74c3c; }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 5px;
            border: none;
            cursor: pointer;
        }
        .btn:hover { background: #2980b9; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #229954; }
        .quick-actions {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        th { background: #f8f9fa; font-weight: 600; }
        .form-group {
            margin: 15px 0;
        }
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        .tax-alert {
            background: #fff3cd;
            border: 1px solid #ffeeba;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>💼 Business Accounting System</h1>
            <p>QuickBooks for the Modern Economy</p>
        </div>
    </div>
    
    <div class="container">
        <div class="quick-actions">
            <button class="btn" onclick="showAddTransaction()">➕ Add Transaction</button>
            <button class="btn btn-success" onclick="showAddIncome()">💰 Record Income</button>
            <button class="btn" onclick="showAddExpense()">📝 Record Expense</button>
            <button class="btn" onclick="generateInvoice()">📄 Create Invoice</button>
            <button class="btn" onclick="importTransactions()">📥 Import Transactions</button>
            <button class="btn" onclick="showTaxCalculator()">🧮 Calculate Taxes</button>
        </div>
        
        <div class="dashboard-grid">
            <div class="card">
                <h3>📊 Profit & Loss</h3>
                <div class="metric positive">$<span id="revenue">0</span></div>
                <small>Revenue</small>
                <div class="metric negative">$<span id="expenses">0</span></div>
                <small>Expenses</small>
                <hr>
                <div class="metric">$<span id="profit">0</span></div>
                <small>Net Profit</small>
            </div>
            
            <div class="card">
                <h3>💸 Cash Flow</h3>
                <div class="metric">$<span id="cash-balance">0</span></div>
                <small>Current Balance</small>
                <div style="margin-top: 20px;">
                    <small>This Month</small>
                    <div>In: $<span id="cash-in">0</span></div>
                    <div>Out: $<span id="cash-out">0</span></div>
                </div>
            </div>
            
            <div class="card">
                <h3>🏦 Tax Obligations</h3>
                <div class="metric">$<span id="tax-owed">0</span></div>
                <small>Quarterly Estimate</small>
                <div class="tax-alert">
                    <strong>Next Payment Due:</strong><br>
                    <span id="tax-due-date">Loading...</span><br>
                    Amount: $<span id="tax-amount">0</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>📈 Recent Transactions</h3>
            <table id="transactions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Deductible</th>
                    </tr>
                </thead>
                <tbody id="transactions-body">
                    <tr><td colspan="6" style="text-align: center;">No transactions yet</td></tr>
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h3>💳 Connected Accounts</h3>
            <div id="accounts-list">
                <p>No accounts connected yet</p>
            </div>
            <button class="btn" onclick="connectAccount()">+ Connect Account</button>
        </div>
    </div>
    
    <!-- Add Transaction Modal -->
    <div id="transaction-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
        <div style="background: white; margin: 50px auto; max-width: 500px; padding: 30px; border-radius: 8px;">
            <h2>Add Transaction</h2>
            <form id="transaction-form">
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" class="form-control" id="tx-date" required>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select class="form-control" id="tx-type" required>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" class="form-control" id="tx-description" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select class="form-control" id="tx-category">
                        <option value="">Select category...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="number" step="0.01" class="form-control" id="tx-amount" required>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="tx-deductible"> Tax Deductible
                    </label>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea class="form-control" id="tx-notes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-success">Save Transaction</button>
                <button type="button" class="btn" onclick="closeModal()">Cancel</button>
            </form>
        </div>
    </div>
    
    <script>
        // Load dashboard data
        async function loadDashboard() {
            try {
                // Get current P&L
                const plResponse = await fetch('/api/reports/profit-loss');
                const pl = await plResponse.json();
                
                document.getElementById('revenue').textContent = pl.revenue.toFixed(2);
                document.getElementById('expenses').textContent = pl.expenses.toFixed(2);
                document.getElementById('profit').textContent = pl.grossProfit.toFixed(2);
                
                // Get tax info
                const taxResponse = await fetch('/api/tax/quarterly');
                const tax = await taxResponse.json();
                
                document.getElementById('tax-owed').textContent = tax.amountDue.toFixed(2);
                document.getElementById('tax-due-date').textContent = new Date(tax.dueDate).toLocaleDateString();
                document.getElementById('tax-amount').textContent = tax.totalQuarterly.toFixed(2);
                
                // Load transactions
                await loadTransactions();
                
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            }
        }
        
        async function loadTransactions() {
            try {
                const response = await fetch('/api/transactions');
                const transactions = await response.json();
                
                const tbody = document.getElementById('transactions-body');
                if (transactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No transactions yet</td></tr>';
                    return;
                }
                
                tbody.innerHTML = transactions.slice(0, 10).map(tx => \`
                    <tr>
                        <td>\${new Date(tx.date).toLocaleDateString()}</td>
                        <td>\${tx.description}</td>
                        <td>\${tx.category}</td>
                        <td class="\${tx.type === 'income' ? 'positive' : 'negative'}">
                            \${tx.type === 'income' ? '+' : '-'}$\${Math.abs(tx.amount).toFixed(2)}
                        </td>
                        <td>\${tx.type}</td>
                        <td>\${tx.tax_deductible ? '✓' : ''}</td>
                    </tr>
                \`).join('');
                
            } catch (error) {
                console.error('Failed to load transactions:', error);
            }
        }
        
        function showAddTransaction() {
            document.getElementById('transaction-modal').style.display = 'block';
            document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
            
            // Load categories
            const categories = ${JSON.stringify(Object.keys(ExpenseTracker.categories))};
            const select = document.getElementById('tx-category');
            select.innerHTML = '<option value="">Select category...</option>' + 
                categories.map(cat => \`<option value="\${cat}">\${cat}</option>\`).join('');
        }
        
        function closeModal() {
            document.getElementById('transaction-modal').style.display = 'none';
        }
        
        document.getElementById('transaction-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const transaction = {
                date: document.getElementById('tx-date').value,
                type: document.getElementById('tx-type').value,
                description: document.getElementById('tx-description').value,
                category: document.getElementById('tx-category').value || 'Other',
                amount: parseFloat(document.getElementById('tx-amount').value),
                taxDeductible: document.getElementById('tx-deductible').checked,
                notes: document.getElementById('tx-notes').value
            };
            
            try {
                const response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transaction)
                });
                
                if (response.ok) {
                    closeModal();
                    loadDashboard();
                } else {
                    alert('Failed to save transaction');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
        
        // Load dashboard on startup
        loadDashboard();
        
        // Refresh every 30 seconds
        setInterval(loadDashboard, 30000);
    </script>
</body>
</html>
    `);
});

// API endpoints
app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = await AccountingEngine.recordTransaction(req.body);
        res.json({ success: true, transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await AccountingEngine.getTransactions(req.query);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/profit-loss', async (req, res) => {
    try {
        const startDate = req.query.startDate || `${new Date().getFullYear()}-01-01`;
        const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
        const pl = await AccountingEngine.calculateProfitLoss(startDate, endDate);
        res.json(pl);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tax/quarterly', async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const startDate = `${year}-01-01`;
        const endDate = new Date().toISOString().split('T')[0];
        
        const pl = await AccountingEngine.calculateProfitLoss(startDate, endDate);
        const tax = TaxCalculator.calculateQuarterlyTax(pl.taxableIncome);
        
        res.json(tax);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tax/summary/:year', async (req, res) => {
    try {
        const summary = await TaxCalculator.generateTaxSummary(req.params.year);
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/expenses/categorize', async (req, res) => {
    try {
        const { description, amount } = req.body;
        const category = await ExpenseTracker.categorizeExpense(description, amount);
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Utility functions
function generateSessionId() {
    return crypto.randomBytes(8).toString('hex');
}

// Initialize and start server
const PORT = 3013;

initializeDatabase();

app.listen(PORT, (err) => {
    if (err) {
        console.error('❌ Server failed to start:', err);
        process.exit(1);
    }
    
    console.log('💼 BUSINESS ACCOUNTING SYSTEM');
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log('📊 QuickBooks-style accounting for crypto & fiat');
    console.log('🧮 Automatic tax calculation and tracking');
    console.log('📈 Real-time P&L and cash flow');
    console.log('🗓️ Quarterly tax reminders');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down accounting system...');
    db.close();
    process.exit(0);
});