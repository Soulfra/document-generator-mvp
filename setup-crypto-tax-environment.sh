#!/bin/bash

# 🔐💰📊 CRYPTO TAX ENVIRONMENT SETUP
# Sets up all API keys, environment variables, and configurations
# for the crypto tax compliance system

set -e

echo "🔐 Setting up Crypto Tax Environment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment file
ENV_FILE=".env.crypto-tax"
ENV_EXAMPLE=".env.crypto-tax.example"

echo -e "${BLUE}📋 Creating environment configuration...${NC}"

# Create environment example file
cat > "$ENV_EXAMPLE" << 'EOF'
# 🔐 CRYPTO TAX COMPLIANCE ENVIRONMENT VARIABLES
# Copy this file to .env.crypto-tax and fill in your actual API keys

# ===========================================
# BLOCKCHAIN API KEYS
# ===========================================

# Ethereum / EVM Chains
ETHERSCAN_API_KEY=your_etherscan_api_key_here
ALCHEMY_API_KEY=your_alchemy_api_key_here
INFURA_PROJECT_ID=your_infura_project_id_here
INFURA_PROJECT_SECRET=your_infura_secret_here

# Polygon
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here

# BSC (Binance Smart Chain)
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLSCAN_API_KEY=your_solscan_api_key_here
HELIUS_API_KEY=your_helius_api_key_here

# Bitcoin
BLOCKSTREAM_API_URL=https://blockstream.info/api
MEMPOOL_SPACE_API_URL=https://mempool.space/api

# ===========================================
# PRICE DATA APIs
# ===========================================

# CoinGecko (Free tier available)
COINGECKO_API_KEY=your_coingecko_api_key_here

# CoinMarketCap
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# Cryptocompare
CRYPTOCOMPARE_API_KEY=your_cryptocompare_api_key_here

# ===========================================
# DeFi Protocol APIs
# ===========================================

# DeFi Pulse
DEFIPULSE_API_KEY=your_defipulse_api_key_here

# The Graph Protocol
GRAPH_API_KEY=your_graph_api_key_here

# Uniswap Analytics
UNISWAP_API_KEY=your_uniswap_api_key_here

# ===========================================
# TAX & COMPLIANCE SERVICES
# ===========================================

# Koinly API (for validation)
KOINLY_API_KEY=your_koinly_api_key_here

# CoinTracker API
COINTRACKER_API_KEY=your_cointracker_api_key_here

# ===========================================
# DATABASE & STORAGE
# ===========================================

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_tax_db

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# MongoDB (for transaction logs)
MONGODB_URL=mongodb://localhost:27017/crypto_tax

# ===========================================
# ENCRYPTION & SECURITY
# ===========================================

# Encryption keys (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_32_character_hex_encryption_key_here
JWT_SECRET=your_jwt_secret_for_authentication_here

# ===========================================
# SYSTEM CONFIGURATION
# ===========================================

# Node environment
NODE_ENV=development

# API rate limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Portfolio snapshot configuration
ENABLE_DAILY_SNAPSHOTS=true
ENABLE_MONTHLY_SNAPSHOTS=true
ENABLE_YEARLY_SNAPSHOTS=true

# Tax configuration
TAX_YEAR=2024
COST_BASIS_METHOD=FIFO
DEFAULT_FIAT_CURRENCY=USD

# Burn address monitoring
ENABLE_BURN_MONITORING=true
BURN_CHECK_INTERVAL_MINUTES=30

# ===========================================
# NOTIFICATION SETTINGS
# ===========================================

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Slack notifications (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url_here

# Discord notifications (optional)
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

# ===========================================
# DEVELOPMENT SETTINGS
# ===========================================

# Debug mode
DEBUG_MODE=false
LOG_LEVEL=info

# Test mode (uses testnets)
TEST_MODE=false

# Mock APIs (for development)
MOCK_API_RESPONSES=false
EOF

echo -e "${GREEN}✅ Created environment example: $ENV_EXAMPLE${NC}"

# Check if .env.crypto-tax already exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Environment file already exists: $ENV_FILE${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📝 Using existing environment file${NC}"
        ENV_EXISTS=true
    fi
fi

# Copy example to actual env file if it doesn't exist or user wants to overwrite
if [ "$ENV_EXISTS" != true ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo -e "${GREEN}✅ Created environment file: $ENV_FILE${NC}"
fi

# Create API key configuration guide
echo -e "${BLUE}📚 Creating API key setup guide...${NC}"

cat > "API_KEYS_SETUP_GUIDE.md" << 'EOF'
# 🔐 API Keys Setup Guide

This guide helps you obtain all necessary API keys for the crypto tax compliance system.

## 🔗 Required API Keys

### Blockchain APIs

#### 1. Etherscan (Ethereum)
- **Website**: https://etherscan.io/apis
- **Free Tier**: 5 calls/second, 100,000 calls/day
- **Steps**:
  1. Create account at etherscan.io
  2. Go to "API Keys" section
  3. Generate new API key
  4. Add to `ETHERSCAN_API_KEY`

#### 2. Alchemy (Ethereum/Polygon)
- **Website**: https://www.alchemy.com/
- **Free Tier**: 300M compute units/month
- **Steps**:
  1. Sign up at alchemy.com
  2. Create new app
  3. Get API key from dashboard
  4. Add to `ALCHEMY_API_KEY`

#### 3. Solscan (Solana)
- **Website**: https://pro.solscan.io/
- **Free Tier**: Available
- **Steps**:
  1. Sign up at pro.solscan.io
  2. Generate API key
  3. Add to `SOLSCAN_API_KEY`

### Price Data APIs

#### 4. CoinGecko
- **Website**: https://www.coingecko.com/en/api
- **Free Tier**: 10-50 calls/minute
- **Steps**:
  1. Sign up at coingecko.com
  2. Go to API section
  3. Generate API key
  4. Add to `COINGECKO_API_KEY`

#### 5. CoinMarketCap
- **Website**: https://coinmarketcap.com/api/
- **Free Tier**: 10,000 calls/month
- **Steps**:
  1. Create account
  2. Go to API section
  3. Get API key
  4. Add to `COINMARKETCAP_API_KEY`

## 🚀 Quick Setup Commands

```bash
# Generate encryption key
openssl rand -hex 32

# Generate JWT secret
openssl rand -base64 32

# Test API keys
node test-api-keys.js
```

## 🔧 Configuration Options

### Cost Basis Methods
- `FIFO` - First In, First Out
- `LIFO` - Last In, First Out
- `SPECIFIC` - Specific Identification

### Supported Chains
- Ethereum (ETH)
- Bitcoin (BTC)
- Solana (SOL)
- Polygon (MATIC)
- Binance Smart Chain (BNB)

## 💰 Free Tier Limits

| Service | Free Limit | Upgrade Cost |
|---------|------------|--------------|
| Etherscan | 100k/day | $199/month |
| Alchemy | 300M units | $49/month |
| CoinGecko | 50 calls/min | $129/month |
| Solscan | Basic access | Contact for pricing |

## 🛡️ Security Best Practices

1. **Never commit API keys to git**
2. **Use environment variables only**
3. **Rotate keys regularly**
4. **Monitor API usage**
5. **Use read-only keys when possible**

## 🔧 Testing Your Setup

Run the API key tester:
```bash
./test-crypto-tax-setup.sh
```

This will verify all your API keys are working correctly.
EOF

echo -e "${GREEN}✅ Created API setup guide: API_KEYS_SETUP_GUIDE.md${NC}"

# Create API key tester script
echo -e "${BLUE}🧪 Creating API key test script...${NC}"

cat > "test-crypto-tax-setup.sh" << 'EOF'
#!/bin/bash

# 🧪 Test crypto tax API setup

echo "🧪 Testing Crypto Tax API Setup..."
echo "================================"

# Load environment variables
if [ -f ".env.crypto-tax" ]; then
    export $(cat .env.crypto-tax | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables"
else
    echo "❌ .env.crypto-tax file not found"
    exit 1
fi

# Test functions
test_api() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url")
    
    if [ "$response" = "$expected" ]; then
        echo "✅ PASS"
        return 0
    else
        echo "❌ FAIL (HTTP $response)"
        return 1
    fi
}

# Test Etherscan
if [ ! -z "$ETHERSCAN_API_KEY" ]; then
    test_api "Etherscan" "https://api.etherscan.io/api?module=account&action=balance&address=0x742d35Cc9e4C925583C0c8E96fA62cfde5b74e5d&tag=latest&apikey=$ETHERSCAN_API_KEY" "200"
else
    echo "⚠️  Etherscan API key not set"
fi

# Test CoinGecko
if [ ! -z "$COINGECKO_API_KEY" ]; then
    test_api "CoinGecko" "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&x_cg_demo_api_key=$COINGECKO_API_KEY" "200"
else
    echo "⚠️  CoinGecko API key not set"
fi

# Test Solana RPC
test_api "Solana RPC" "$SOLANA_RPC_URL" "200"

# Test local services
echo ""
echo "Testing local services..."

# Test Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is running"
    else
        echo "❌ Redis is not running"
    fi
else
    echo "⚠️  Redis CLI not found"
fi

# Test PostgreSQL
if command -v psql &> /dev/null; then
    if pg_isready > /dev/null 2>&1; then
        echo "✅ PostgreSQL is running"
    else
        echo "❌ PostgreSQL is not running"
    fi
else
    echo "⚠️  PostgreSQL not found"
fi

echo ""
echo "🎯 Setup test complete!"
EOF

chmod +x "test-crypto-tax-setup.sh"

echo -e "${GREEN}✅ Created API test script: test-crypto-tax-setup.sh${NC}"

# Create database initialization script
echo -e "${BLUE}🗄️  Creating database setup script...${NC}"

cat > "setup-crypto-tax-database.sql" << 'EOF'
-- 🗄️ CRYPTO TAX COMPLIANCE DATABASE SCHEMA
-- Creates all necessary tables for tax tracking and compliance

-- Create database (run as postgres user)
-- CREATE DATABASE crypto_tax_db;

-- Connect to the database
\c crypto_tax_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- WALLETS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    label VARCHAR(255),
    user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(address, chain)
);

-- ===========================================
-- TRANSACTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    tx_hash VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    block_number BIGINT,
    block_timestamp TIMESTAMP,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    value_native DECIMAL(36, 18),
    value_usd DECIMAL(20, 8),
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    gas_fee_usd DECIMAL(20, 8),
    tx_type VARCHAR(50), -- transfer, swap, stake, unstake, etc.
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tx_hash, chain)
);

-- ===========================================
-- TOKEN TRANSFERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS token_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    token_address VARCHAR(255),
    token_symbol VARCHAR(20),
    token_name VARCHAR(255),
    token_decimals INTEGER,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    amount_raw VARCHAR(255), -- Raw amount as string to avoid precision loss
    amount_decimal DECIMAL(36, 18),
    amount_usd DECIMAL(20, 8),
    price_per_token_usd DECIMAL(20, 8),
    transfer_type VARCHAR(50), -- in, out, internal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- PORTFOLIO SNAPSHOTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_timestamp TIMESTAMP NOT NULL,
    snapshot_type VARCHAR(50), -- daily, monthly, yearly, event
    trigger_event VARCHAR(100),
    total_value_usd DECIMAL(20, 8),
    portfolio_hash VARCHAR(64),
    data JSONB, -- Full snapshot data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- COST BASIS RECORDS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS cost_basis_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    token_address VARCHAR(255),
    token_symbol VARCHAR(20),
    acquisition_date TIMESTAMP,
    acquisition_price_usd DECIMAL(20, 8),
    amount DECIMAL(36, 18),
    cost_basis_method VARCHAR(20), -- FIFO, LIFO, SPECIFIC
    is_disposed BOOLEAN DEFAULT false,
    disposal_date TIMESTAMP,
    disposal_price_usd DECIMAL(20, 8),
    gain_loss_usd DECIMAL(20, 8),
    holding_period_days INTEGER,
    is_long_term BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- TAX EVENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS tax_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id),
    transaction_id UUID REFERENCES transactions(id),
    event_type VARCHAR(50), -- sale, swap, income, mining, staking, etc.
    event_date TIMESTAMP,
    taxable_amount_usd DECIMAL(20, 8),
    cost_basis_usd DECIMAL(20, 8),
    capital_gain_loss_usd DECIMAL(20, 8),
    is_short_term BOOLEAN,
    tax_year INTEGER,
    form_8949_category VARCHAR(10), -- A, B, C, D, E, F
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- BURN ADDRESSES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS burn_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(address, chain)
);

-- ===========================================
-- BURN TRANSACTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS burn_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    burn_address_id UUID REFERENCES burn_addresses(id),
    transaction_id UUID REFERENCES transactions(id),
    amount_burned DECIMAL(36, 18),
    token_symbol VARCHAR(20),
    usd_value_at_burn DECIMAL(20, 8),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- API USAGE TRACKING TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100),
    endpoint VARCHAR(255),
    request_count INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    cost_usd DECIMAL(10, 6),
    date_hour TIMESTAMP, -- Rounded to hour for aggregation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Wallets indexes
CREATE INDEX IF NOT EXISTS idx_wallets_address_chain ON wallets(address, chain);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hash_chain ON transactions(tx_hash, chain);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(block_timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_addresses ON transactions(from_address, to_address);

-- Token transfers indexes
CREATE INDEX IF NOT EXISTS idx_token_transfers_transaction_id ON token_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_token_transfers_token ON token_transfers(token_address, token_symbol);
CREATE INDEX IF NOT EXISTS idx_token_transfers_addresses ON token_transfers(from_address, to_address);

-- Portfolio snapshots indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_timestamp ON portfolio_snapshots(snapshot_timestamp);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_type ON portfolio_snapshots(snapshot_type);

-- Cost basis indexes
CREATE INDEX IF NOT EXISTS idx_cost_basis_wallet_token ON cost_basis_records(wallet_id, token_symbol);
CREATE INDEX IF NOT EXISTS idx_cost_basis_acquisition_date ON cost_basis_records(acquisition_date);

-- Tax events indexes
CREATE INDEX IF NOT EXISTS idx_tax_events_wallet_year ON tax_events(wallet_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_events_date ON tax_events(event_date);
CREATE INDEX IF NOT EXISTS idx_tax_events_type ON tax_events(event_type);

-- ===========================================
-- INSERT DEFAULT BURN ADDRESSES
-- ===========================================

INSERT INTO burn_addresses (address, chain, description) VALUES
-- Ethereum burn addresses
('0x000000000000000000000000000000000000dEaD', 'ethereum', 'Standard Ethereum burn address'),
('0x0000000000000000000000000000000000000000', 'ethereum', 'Zero address'),

-- Solana burn addresses  
('11111111111111111111111111111112', 'solana', 'Solana system program (burn)'),
('1nc1nerator11111111111111111111111111111111', 'solana', 'Solana incinerator'),

-- Bitcoin burn addresses
('1BitcoinEaterAddressDontSendf59kuE', 'bitcoin', 'Bitcoin eater address'),
('1CounterpartyXXXXXXXXXXXXXXXUWLpVr', 'bitcoin', 'Counterparty burn address')

ON CONFLICT (address, chain) DO NOTHING;

-- ===========================================
-- VIEWS FOR COMMON QUERIES
-- ===========================================

-- Current portfolio view
CREATE OR REPLACE VIEW current_portfolio AS
SELECT 
    w.address,
    w.chain,
    w.label,
    COUNT(t.id) as transaction_count,
    MAX(t.block_timestamp) as last_activity,
    SUM(CASE WHEN tt.transfer_type = 'in' THEN tt.amount_usd ELSE 0 END) as total_inflow_usd,
    SUM(CASE WHEN tt.transfer_type = 'out' THEN tt.amount_usd ELSE 0 END) as total_outflow_usd
FROM wallets w
LEFT JOIN transactions t ON w.id = t.wallet_id
LEFT JOIN token_transfers tt ON t.id = tt.transaction_id
WHERE w.is_active = true
GROUP BY w.id, w.address, w.chain, w.label;

-- Tax year summary view
CREATE OR REPLACE VIEW tax_year_summary AS
SELECT 
    tax_year,
    COUNT(*) as total_events,
    SUM(CASE WHEN capital_gain_loss_usd > 0 THEN capital_gain_loss_usd ELSE 0 END) as total_gains,
    SUM(CASE WHEN capital_gain_loss_usd < 0 THEN ABS(capital_gain_loss_usd) ELSE 0 END) as total_losses,
    SUM(capital_gain_loss_usd) as net_capital_gain_loss,
    SUM(CASE WHEN is_short_term THEN capital_gain_loss_usd ELSE 0 END) as short_term_gain_loss,
    SUM(CASE WHEN NOT is_short_term THEN capital_gain_loss_usd ELSE 0 END) as long_term_gain_loss
FROM tax_events
GROUP BY tax_year
ORDER BY tax_year DESC;

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cost_basis_updated_at BEFORE UPDATE ON cost_basis_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- GRANTS (adjust user as needed)
-- ===========================================

-- Grant permissions to application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO crypto_tax_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO crypto_tax_user;

COMMENT ON DATABASE crypto_tax_db IS 'Crypto tax compliance and portfolio tracking database';

SELECT 'Database schema created successfully!' as status;
EOF

echo -e "${GREEN}✅ Created database schema: setup-crypto-tax-database.sql${NC}"

# Create systemd service file for automated monitoring
echo -e "${BLUE}⚙️  Creating systemd service...${NC}"

cat > "crypto-tax-monitor.service" << 'EOF'
[Unit]
Description=Crypto Tax Compliance Monitor
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/crypto-tax-system
Environment=NODE_ENV=production
EnvironmentFile=/opt/crypto-tax-system/.env.crypto-tax
ExecStart=/usr/bin/node CRYPTO-TAX-INTEGRATION-HUB.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=crypto-tax-monitor

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✅ Created systemd service: crypto-tax-monitor.service${NC}"

# Create final setup instructions
echo -e "${BLUE}📋 Creating setup instructions...${NC}"

cat > "CRYPTO_TAX_SETUP_INSTRUCTIONS.md" << 'EOF'
# 🚀 Crypto Tax System Setup Instructions

## Quick Setup (5 minutes)

1. **Setup environment variables:**
   ```bash
   cp .env.crypto-tax.example .env.crypto-tax
   # Edit .env.crypto-tax with your API keys
   ```

2. **Setup database:**
   ```bash
   sudo -u postgres psql -f setup-crypto-tax-database.sql
   ```

3. **Test your setup:**
   ```bash
   ./test-crypto-tax-setup.sh
   ```

4. **Start the system:**
   ```bash
   node CRYPTO-TAX-INTEGRATION-HUB.js
   ```

## API Keys Required

See `API_KEYS_SETUP_GUIDE.md` for detailed instructions on obtaining:

- ✅ Etherscan API key (free)
- ✅ CoinGecko API key (free) 
- ✅ Solana RPC endpoint (free)
- ⚠️  Alchemy key (optional, but recommended)

## System Components

1. **CRYPTO-TAX-INTEGRATION-HUB.js** - Master orchestrator
2. **BURN-ADDRESS-SCANNER.js** - Monitors burn addresses
3. **BLOCKCHAIN-CHUNK-PROCESSOR.js** - Efficient data processing
4. **PORTFOLIO-SNAPSHOT-MANAGER.js** - Automated snapshots

## Automated Features

- 📸 Daily portfolio snapshots
- 🔥 Burn address monitoring  
- 💰 Cost basis calculations
- 📊 Tax implication analysis
- 🎯 Tax loss harvesting detection

## Production Deployment

```bash
# Install as systemd service
sudo cp crypto-tax-monitor.service /etc/systemd/system/
sudo systemctl enable crypto-tax-monitor
sudo systemctl start crypto-tax-monitor
```

## Monitoring

- Logs: `journalctl -u crypto-tax-monitor -f`
- Status: `systemctl status crypto-tax-monitor`
- Dashboard: http://localhost:8080/tax-dashboard

## Support

- 📚 Read the documentation in each component file
- 🧪 Run test scripts to verify setup
- 🔍 Check logs for any issues
- 💬 Enable debug mode in .env for verbose logging
EOF

echo -e "${GREEN}✅ Created setup instructions: CRYPTO_TAX_SETUP_INSTRUCTIONS.md${NC}"

echo ""
echo -e "${GREEN}🎉 Crypto Tax Environment Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Edit ${BLUE}.env.crypto-tax${NC} with your API keys"
echo -e "2. Run ${BLUE}./test-crypto-tax-setup.sh${NC} to verify"
echo -e "3. Setup database with ${BLUE}setup-crypto-tax-database.sql${NC}"
echo -e "4. Start system with ${BLUE}node CRYPTO-TAX-INTEGRATION-HUB.js${NC}"
echo ""
echo -e "${GREEN}📚 Documentation Created:${NC}"
echo -e "- ${BLUE}API_KEYS_SETUP_GUIDE.md${NC} - How to get API keys"
echo -e "- ${BLUE}CRYPTO_TAX_SETUP_INSTRUCTIONS.md${NC} - Complete setup guide"
echo -e "- ${BLUE}.env.crypto-tax.example${NC} - Environment template"
echo ""
echo -e "${BLUE}🔐 Security Note:${NC} Never commit your .env.crypto-tax file to git!"