# UTP Quick Reference
*All Commands and Key Information at a Glance*

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/utp/universal-test-protocol
cd universal-test-protocol
./quick-start.sh

# Start everything
docker-compose up -d
npm install
npm run start:all

# Run your first test
npm test -- --utp --character=auditor
```

## 📟 Essential Commands

### System Management
```bash
# Start/Stop
./utp start              # Start all services
./utp stop               # Stop all services
./utp restart            # Restart everything
./utp status             # Check system health

# Monitoring
./utp logs               # View all logs
./utp logs --adapter=js  # View specific adapter logs
./utp monitor            # Real-time dashboard

# Updates
./utp update             # Update all components
./utp version            # Show version info
```

### Testing Commands
```bash
# Run tests for FART
utp test                 # Run all tests
utp test file.js         # Run specific file
utp test --tier=2        # Run tier 2 tests only
utp test --watch         # Watch mode

# Character selection
TEST_CHAR=builder utp test    # Use builder character
TEST_CHAR=auditor utp test    # Use auditor (1.5x bonus)
```

### Blockchain Commands
```bash
# Check balances
utp balance              # Your FART balance
utp nfts                 # Your achievements

# Contract management  
utp contracts            # List active contracts
utp contracts update     # Update addresses
utp contracts verify     # Verify deployment
```

## 🎮 Character Quick Reference

| Character | Bonus | Best For | Icon |
|-----------|-------|----------|------|
| Builder | 1.1x | Infrastructure tests | 👷 |
| Tester | 1.2x | General testing | 🧪 |
| Gamer | 1.3x | Gaming/UI tests | 🎮 |
| Auditor | 1.5x | Security/compliance | 🔍 |

## 💰 Reward Structure

| Tier | Tests | FART Reward | NFT |
|------|-------|-------------|-----|
| 1 | Infrastructure | 100 | Habbo Builder |
| 2 | Services | 500 | Pepe Tester |
| 3 | Gaming | 1000 | Rare Wojak |
| 4 | Verification | 5000 | Diamond Hands |

## 🔗 Contract Addresses

### Mainnet
```
FART Token:  0xFART000000000000000000000000000000C01234
NFT Minter:  0xNFT0000000000000000000000000000000M1234  
Tier Unlock: 0xT13R000000000000000000000000000000L0CK
```

### Testnet (Sepolia)
```
FART Token:  0x1234567890123456789012345678901234567890
NFT Minter:  0x2345678901234567890123456789012345678901
Tier Unlock: 0x3456789012345678901234567890123456789012
```

## 🌐 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Registry | http://localhost:3456 | Contract management |
| Monitor | http://localhost:3457 | System dashboard |
| Redis | localhost:6379 | Message bus |
| Postgres | localhost:5432 | Data storage |

## 🔧 Environment Variables

```bash
# Required
UTP_NETWORK=testnet            # or mainnet, local
UTP_PRIVATE_KEY=0x...          # Your wallet key
UTP_RPC_URL=https://...        # Blockchain RPC

# Optional
UTP_CHARACTER=auditor          # Default character
UTP_LOG_LEVEL=info            # debug, info, warn, error
UTP_REDIS_URL=localhost:6379   # Redis connection
```

## 📦 Language Adapter Setup

### JavaScript
```bash
cd adapters/javascript
npm install
npm test
npm run example
```

### Python
```bash
cd adapters/python
pip install -r requirements.txt
pytest
python examples/basic_test.py
```

### Rust
```bash
cd adapters/rust
cargo build
cargo test
cargo run --example basic
```

## 🐛 Debug Commands

```bash
# Message inspection
utp inspect              # Live message viewer
utp inspect --save       # Save to file
utp replay <file>        # Replay messages

# State debugging  
utp snapshot             # Capture system state
utp trace <msg-id>       # Trace message flow
utp verify               # Verify system integrity

# Emergency
utp emergency-stop       # Kill everything
utp reset               # Reset to clean state
utp restore <backup>    # Restore from backup
```

## 📊 Monitoring URLs

- **Dashboard**: http://localhost:3457
- **Grafana**: http://localhost:3000
- **Redis Commander**: http://localhost:8081
- **Blockchain Explorer**: http://localhost:3458

## 🚨 Common Issues & Fixes

### Redis Connection Failed
```bash
# Check Redis
redis-cli ping

# Restart Redis
docker-compose restart redis

# Clear Redis
redis-cli FLUSHALL
```

### Contract Not Found
```bash
# Update registry
utp contracts update

# Verify addresses
utp contracts verify

# Force refresh
curl -X POST http://localhost:3456/contracts/refresh
```

### Messages Not Syncing
```bash
# Check adapters
utp status --adapters

# Restart message router
docker-compose restart router

# Debug mode
UTP_LOG_LEVEL=debug utp test
```

## 📱 Mobile Commands (Future)

```bash
# React Native
utp mobile init react-native
utp mobile test ios
utp mobile test android

# Flutter
utp mobile init flutter
utp mobile test
```

## 🎯 Pro Tips

1. **Maximize Rewards**: Use auditor character for 1.5x bonus
2. **Batch Tests**: Run multiple tests together for efficiency
3. **Monitor Gas**: Check gas prices before large test runs
4. **Cache Results**: Enable caching for faster re-runs
5. **Use Shortcuts**: `utp t` = `utp test`, `utp b` = `utp balance`

## ⌨️ Keyboard Shortcuts (Dashboard)

| Key | Action |
|-----|--------|
| `r` | Refresh data |
| `t` | Run tests |
| `l` | View logs |
| `m` | Message inspector |
| `?` | Help menu |
| `q` | Quit |

## 🆘 Emergency Contacts

- **Discord**: https://discord.gg/utp
- **Telegram**: https://t.me/utp_support
- **Email**: support@utp.dev
- **Emergency**: emergency@utp.dev

## 📝 Config File Locations

```
~/.utp/config.json         # User config
./utp.config.js            # Project config
./.env                     # Environment vars
./contracts/addresses.json # Contract addresses
```

## 🎉 Achievement Unlocks

| Achievement | Requirement | Reward |
|-------------|-------------|---------|
| First Test | Run 1 test | 10 FART |
| Centurion | Run 100 tests | 100 FART + NFT |
| Polyglot | Use 3+ languages | 500 FART |
| Speed Demon | <10ms avg latency | 1000 FART |
| Bug Slayer | Find 10 bugs | Special NFT |

---

**Quick Links**:
- Docs: https://docs.utp.dev
- API: https://api.utp.dev
- Status: https://status.utp.dev
- Explorer: https://explorer.utp.dev

*Keep this handy for quick lookups!*