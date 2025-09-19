# 🎮⚔️ Battle.net API Integration Documentation

Complete guide for integrating Battle.net APIs with the Ladder Slasher verification system.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup & Authentication](FinishThisIdea-Complete/SETUP.md)
3. [API Endpoints](API.md)
4. [Verification Process](ObsidianVault/02-Documentation/VERIFICATION.md)
5. [Usage Examples](FinishThisIdea/docs/EXAMPLES.md)
6. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Battle.net API integration provides:
- **Official Diablo 2 ladder data** for verification
- **Character profile validation** against scraped D2JSP data
- **Real-time accuracy scoring** of scraper effectiveness
- **Comprehensive reporting** for data quality assessment

### Key Features
- ✅ OAuth 2.0 authentication
- ✅ Diablo 2 ladder data access
- ✅ Character profile retrieval
- ✅ Automated data validation
- ✅ Mock data support for testing
- ✅ Comprehensive error handling

## 🔧 Setup & Authentication

### 1. Create Battle.net Developer Account

1. Go to [Battle.net Developer Portal](ObsidianVault/99-Uncategorized/battle.txt)
2. Sign in with your Battle.net account
3. Click "Create Client"
4. Fill in application details:
   - **Name**: "Ladder Slasher Verification"
   - **Intended Use**: "Data analysis and verification"
   - **Website**: Your website or GitHub repo
5. Copy your **Client ID** and **Client Secret**

### 2. Configure Credentials

#### Option A: Environment Variables (Recommended)
```bash
export BATTLENET_CLIENT_ID="your_client_id_here"
export BATTLENET_CLIENT_SECRET="your_client_secret_here"
export BATTLENET_REGION="us"  # us, eu, kr, tw, cn
```

#### Option B: Configuration File
```bash
# Create config file
python3 battlenet-api-integration.py
# This creates battlenet_config_template.json

# Edit the template
{
  "client_id": "YOUR_ACTUAL_CLIENT_ID",
  "client_secret": "YOUR_ACTUAL_CLIENT_SECRET",
  "region": "us"
}

# Rename to battlenet_config.json
mv battlenet_config_template.json battlenet_config.json
```

### 3. Install Dependencies
```bash
pip3 install aiohttp requests python-dotenv
```

## 🌐 API Endpoints

### Authentication
```
POST https://{region}.battle.net/oauth/token
```
- **Headers**: `Authorization: Basic {base64(client_id:client_secret)}`
- **Body**: `grant_type=client_credentials`
- **Response**: Access token valid for 1 hour

### Diablo 2 Ladder (Conceptual)
```
GET https://{region}.api.blizzard.com/data/d2/ladder/{ladder_type}
```
- **ladder_type**: `standard`, `hardcore`, `expansion`
- **Headers**: `Authorization: Bearer {access_token}`

### Character Profile (Conceptual)
```
GET https://{region}.api.blizzard.com/data/d2/character/{realm}/{character_name}
```
- **realm**: `useast`, `uswest`, `europe`, `asia`
- **Headers**: `Authorization: Bearer {access_token}`

> **Note**: Diablo 2 specific endpoints are conceptual. The integration includes mock data for testing until official D2 APIs are available.

## 🔍 Verification Process

### 1. Data Collection Flow
```
D2JSP Scraper → Extract Characters → Battle.net API → Official Data → Validation Engine → Accuracy Report
```

### 2. Validation Criteria

#### Character Matching
- **Name**: Exact match (case-insensitive)
- **Level**: Within ±2 levels tolerance
- **Class**: Normalized class name matching
- **Realm**: Direct comparison

#### Accuracy Scoring
```python
accuracy = (matched_characters / total_comparisons) * 100
```

#### Quality Thresholds
- **Excellent**: ≥90% accuracy
- **Good**: 80-89% accuracy
- **Fair**: 70-79% accuracy
- **Poor**: <70% accuracy

## 💻 Usage Examples

### Basic Integration
```python
from battlenet_api_integration import BattleNetAPI, APICredentials, D2JSPBattleNetValidator

# Initialize API
credentials = APICredentials("client_id", "client_secret", "us")
battlenet_api = BattleNetAPI(credentials)

# Get ladder data
ladder_data = await battlenet_api.get_d2_ladder('standard')
print(f"Retrieved {len(ladder_data.characters)} characters")

# Validate against D2JSP data
validator = D2JSPBattleNetValidator(battlenet_api)
results = await validator.validate_character_data(d2jsp_chars, ladder_data.characters)
print(f"Validation accuracy: {results['accuracy_score']:.1f}%")
```

### Complete Verification Suite
```python
from ladder_slasher_verification_suite import LadderSlasherVerificationSuite

# Run comprehensive verification
verifier = LadderSlasherVerificationSuite()
results = await verifier.run_comprehensive_verification()

# Includes Battle.net validation automatically
if results['overall_success']:
    print("✅ Scraper verified and working!")
```

### Mock Data Testing
```python
# Test without real credentials
mock_credentials = APICredentials("mock", "mock", "us")
api = BattleNetAPI(mock_credentials)

# Returns realistic mock data for testing
ladder = await api.get_d2_ladder('standard')
```

## 📊 Data Structures

### BattleNetCharacter
```python
@dataclass
class BattleNetCharacter:
    name: str                    # Character name
    character_class: str         # Amazon, Sorceress, etc.
    level: int                   # Character level (1-99)
    experience: int              # Total experience points
    ladder_rank: Optional[int]   # Ladder position (if ranked)
    realm: str                   # useast, europe, etc.
    seasonal: bool               # Seasonal character
    hardcore: bool               # Hardcore mode
    dead: bool                   # Character death status
    last_update: datetime        # Last data update
```

### ValidationResult
```python
validation_results = {
    'total_d2jsp_characters': 150,
    'total_battlenet_characters': 500,
    'matches_found': 125,
    'accuracy_score': 83.3,
    'discrepancies': [...],
    'validation_timestamp': '2024-01-15T10:30:00'
}
```

## 🧪 Testing & Verification

### Run Complete Test Suite
```bash
# Test everything
python3 ladder-slasher-verification-suite.py

# Test Battle.net integration specifically
python3 battlenet-api-integration.py

# Launch verification UI
python3 run-verification-tests.py
```

### Manual Testing Steps

1. **Connectivity Test**
   ```bash
   curl -X POST "https://us.battle.net/oauth/token" \
        -H "Authorization: Basic $(echo -n 'client_id:client_secret' | base64)" \
        -d "grant_type=client_credentials"
   ```

2. **Scraper Test**
   ```bash
   # Run ladder slasher and verify it finds data
   python3 live-ladder-slasher-ui.py
   ```

3. **Cross-Reference Test**
   ```bash
   # Compare scraped data with Battle.net
   python3 battlenet-api-integration.py
   ```

## 🔧 Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: "invalid_client"
Solution: Verify client_id and client_secret are correct
```

#### Rate Limiting
```
Error: HTTP 429 "Too Many Requests"
Solution: Implement exponential backoff, respect rate limits
```

#### API Unavailable
```
Error: HTTP 404 "Not Found"
Solution: Falls back to mock data, update endpoint URLs
```

#### Network Issues
```
Error: Connection timeout
Solution: Check firewall, proxy settings, network connectivity
```

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable detailed API logging
battlenet_api = BattleNetAPI(credentials)
# All requests/responses will be logged
```

### Validation Debugging
```python
# Get detailed validation report
validator = D2JSPBattleNetValidator(battlenet_api)
results = await validator.validate_character_data(d2jsp_data, bn_data)

# Check discrepancies
for discrepancy in results['discrepancies']:
    print(f"Mismatch: {discrepancy}")
```

## 📈 Performance Optimization

### Caching Strategy
```python
# Cache Battle.net data for 1 hour
class CachedBattleNetAPI(BattleNetAPI):
    def __init__(self, credentials):
        super().__init__(credentials)
        self.cache = {}
        self.cache_ttl = 3600  # 1 hour
```

### Batch Processing
```python
# Process characters in batches
async def validate_in_batches(characters, batch_size=100):
    for i in range(0, len(characters), batch_size):
        batch = characters[i:i+batch_size]
        await validate_batch(batch)
```

### Rate Limit Handling
```python
import asyncio

class RateLimitedAPI:
    def __init__(self):
        self.request_times = []
        self.requests_per_second = 10
    
    async def make_request(self):
        # Implement rate limiting logic
        await self.wait_for_rate_limit()
        return await self.actual_request()
```

## 🚀 Advanced Features

### Real-time Monitoring
```python
# Monitor validation accuracy over time
class ValidationMonitor:
    async def continuous_validation(self):
        while True:
            results = await self.run_validation()
            if results['accuracy_score'] < 80:
                await self.alert_admin()
            await asyncio.sleep(3600)  # Check hourly
```

### Custom Validators
```python
class CustomValidator(D2JSPBattleNetValidator):
    def _compare_levels(self, d2jsp_level, bn_level, tolerance=1):
        # Stricter level comparison
        return abs(d2jsp_level - bn_level) <= tolerance
```

### Data Export
```python
# Export validation results
validator.export_results('csv')  # CSV format
validator.export_results('json') # JSON format
validator.export_results('xlsx') # Excel format
```

## 🔐 Security Best Practices

1. **Credential Storage**
   - Use environment variables
   - Never commit credentials to git
   - Rotate credentials regularly

2. **API Security**
   - Validate all API responses
   - Implement request signing
   - Use HTTPS only

3. **Error Handling**
   - Don't expose sensitive errors
   - Log security events
   - Implement circuit breakers

## 📚 Resources

- [Battle.net Developer Portal](ObsidianVault/99-Uncategorized/battle.txt)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Diablo 2 Game Guide](https://diablo2.diablowiki.net/)
- [D2JSP Forums](ObsidianVault/99-Uncategorized/forum.rst)

---

**Ready to verify your ladder slashing prowess with official Battle.net data! ⚔️🎮**