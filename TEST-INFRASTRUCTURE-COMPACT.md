# TEST INFRASTRUCTURE COMPACT GUIDE
*Streamlined Implementation with NFT/Meme Integration*

## 🎮 QUICK TIER REFERENCE

```
Tier 1: Infrastructure (0x1234...5678) → 100 FART → Habbo Builder Badge
Tier 2: Services      (0x5678...9ABC) → 500 FART → Pepe Tester NFT  
Tier 3: Gaming        (0x9ABC...DEF0) → 1000 FART → Rare Wojak Pass
Tier 4: Verification  (0xDEF0...1234) → 5000 FART → Diamond Hands Trophy
```

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Folder Structure (5 min)
```bash
__tests__/
├── tier-1-infrastructure/
├── tier-2-services/  
├── tier-3-gaming/
├── tier-4-verification/
└── assets/
    ├── icons/
    ├── badges/
    └── memes/
```

### Phase 2: Tier Manager (10 min)
```javascript
// tier-manager.js
const TIERS = {
  1: { contract: '0x1234...5678', reward: 100, badge: '🏗️' },
  2: { contract: '0x5678...9ABC', reward: 500, badge: '🚀' },
  3: { contract: '0x9ABC...DEF0', reward: 1000, badge: '🎮' },
  4: { contract: '0xDEF0...1234', reward: 5000, badge: '💎' }
};
```

### Phase 3: Framework Links (5 min)
```bash
# Symlink existing frameworks
ln -s unified-auditable-testing-framework.js __tests__/tier-4-verification/
ln -s deathtodata-test-suite.js __tests__/tier-3-gaming/
```

### Phase 4: Visual Assets
- Habbo characters: `/assets/icons/habbo-*.png`
- NFT badges: `/assets/badges/tier-*.svg`
- Meme rewards: `/assets/memes/fart-*.jpg`

## 🚀 QUICK SETUP SCRIPT

```bash
#!/bin/bash
# setup-test-tiers.sh
mkdir -p __tests__/{tier-{1..4}-*,assets/{icons,badges,memes}}
npm install --save-dev jest-canvas-mock jest-image-snapshot
echo "✅ Tier structure ready! Run: npm test"
```

## 🎯 MINIMAL JEST CONFIG UPDATE

```javascript
// Add to jest.config.js projects array
{
  displayName: 'tier-1-infrastructure',
  testMatch: ['<rootDir>/__tests__/tier-1-*/**/*.test.js'],
  setupFiles: ['<rootDir>/__tests__/tier-setup.js']
}
```

## 💰 FART TOKEN INTEGRATION

```javascript
// __tests__/tier-setup.js
beforeAll(async () => {
  global.FART = { 
    mint: (address, amount) => console.log(`🪙 Minted ${amount} FART`),
    balance: {} 
  };
});
```

## 🎮 CHARACTER SELECTION

```javascript
// __tests__/helpers/character-selector.js
const HABBO_CHARS = {
  builder: { bonus: 1.1, icon: '👷' },
  tester: { bonus: 1.2, icon: '🧪' },
  gamer: { bonus: 1.3, icon: '🎮' },
  auditor: { bonus: 1.5, icon: '🔍' }
};
```

## 📊 MEME GENERATION

```javascript
// Generate meme on test completion
afterAll(() => {
  if (testsPassed === totalTests) {
    generateMeme('success', `${totalTests} tests passed! Here's your ${FART_EARNED} FART`);
  }
});
```

## 🔗 CONTRACT ADDRESSES

```yaml
mainnet:
  fartcoin: "0xFART...C01N"
  nft_minter: "0xNFT...M1NT"
  tier_unlock: "0xT13R...L0CK"
  
testnet:
  faucet: "0xFAUC...3T00"
```

## ⚡ EXECUTION COMMANDS

```bash
# Run specific tier
npm test -- tier-1

# Run with character
TEST_CHAR=auditor npm test

# Generate report with memes
npm test -- --coverage --json | node meme-generator.js
```

## 🏆 ACHIEVEMENT UNLOCKS

| Tests Passed | Reward | NFT Badge | Meme |
|-------------|---------|-----------|------|
| 10 | 100 FART | Habbo Builder | "It's working" cat |
| 25 | 500 FART | Pepe Tester | Rare Pepe #42 |
| 50 | 1000 FART | Wojak Gamer | Pink Wojak |
| 100 | 5000 FART | Diamond Hands | "Never selling" |

---
*Compact guide to avoid API overload - Full docs available after implementation*