# 🔐 CALOS BLAMECHAIN DEPLOYMENT SYSTEM

## Overview

The Calos/Blamechain deployment system provides distributed blame assignment with private/public key swapping for Stripe integration across multiple deployment targets.

## 🎯 Key Features

1. **Private/Public Key Swap**: Automatic key rotation based on blame assignment
2. **Distributed Deployment**: Railway, Vercel, and Calos network
3. **Blame-Based Authentication**: Different keys for different blame targets
4. **Stripe Integration**: Smart key swapping for payment processing

## 🔑 Key Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Public Key     │────▶│  Key Swapper    │────▶│  Calos Key      │
│  (User Blame)   │     │  (Logic)        │     │  (Nobody Blame) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Stripe API     │
                        │  (Key Verified) │
                        └─────────────────┘
```

## 🚀 Deployment Flow

### 1. Generate Keys
```bash
./calos-blamechain-deploy.sh
```

This creates:
- `calos-deploy.key` - Private deployment key
- `calos-deploy.pub` - Public deployment key
- `blamechain-manifest.json` - Deployment manifest

### 2. Blame Assignment

The system assigns blame across services:
- **Railway**: Infrastructure blame
- **Vercel**: Edge network blame
- **Calos**: Distributed blame
- **User**: Takes responsibility
- **Nobody**: Calos key activation

### 3. Key Swapping Logic

```javascript
// Based on blame assignment
const keyMap = {
  'user': publicKey,        // Standard Stripe public key
  'system': privateKey,     // Full access
  'developer': restrictedKey, // Limited access
  'nobody': calosKey        // Special distributed key
};
```

### 4. Deploy to All Networks

```bash
cd .calos
./deploy-all-networks.sh
```

## 🔄 Key Rotation

Rotate keys regularly for security:

```bash
cd .calos
./rotate-keys.sh
```

## 📊 Blamechain Verification

Verify deployment integrity:

```bash
cd .calos
node verify-blamechain.js
```

Output:
```
🔍 Verifying Blamechain integrity...

Keys present: ✅
Blame hash: a7f8d9e6c5b4a3...

Service verification:
  railway: https://document-generator.railway.app (blame: infrastructure)
  vercel: https://document-generator.vercel.app (blame: edge_network)
  calos: https://calos.your-domain.com (blame: distributed)

✅ Blamechain verified!
```

## 🌐 Network Endpoints

After deployment, your services are available at:

1. **Railway**: `https://document-generator.railway.app`
   - Traditional cloud deployment
   - Infrastructure blame assignment

2. **Vercel**: `https://document-generator.vercel.app`
   - Edge network deployment
   - Edge blame assignment

3. **Calos**: `https://calos.your-domain.com`
   - Distributed deployment
   - Nobody blame (maximum distribution)

## 🔐 Security Considerations

1. **Never commit `.calos/` directory** - Contains private keys
2. **Rotate keys regularly** - Use provided rotation script
3. **Monitor blame assignments** - Check manifest regularly
4. **Verify deployments** - Run verification after each deploy

## 💳 Stripe Integration

The system automatically handles Stripe keys based on blame:

```javascript
// In your application
const blame = req.body.blame || 'nobody';
process.env.STRIPE_SECRET_KEY = keySwapper.swapKeys(blame);
```

Different blame assignments get different Stripe access levels:
- **User blame**: Public key only (client-side)
- **System blame**: Full secret key access
- **Developer blame**: Restricted test key
- **Nobody blame**: Calos distributed key

## 🎮 Usage Example

```javascript
// Client-side blame selection
fetch('/auth/soulfra/unified/anonymous', {
  method: 'POST',
  body: JSON.stringify({
    blame: 'nobody',  // Activates Calos key
    redirect_uri: window.location.origin
  })
});
```

## 🚨 Troubleshooting

### Keys not working
1. Check `.calos/` directory exists
2. Verify keys were generated
3. Run `./rotate-keys.sh`

### Deployment fails
1. Check blame assignments in manifest
2. Verify all services are configured
3. Run individual deployment scripts

### Stripe errors
1. Verify API keys in environment
2. Check blame assignment logic
3. Test with different blame targets

---

**Remember**: The blame must be distributed for the system to work properly. When nobody takes the blame, Calos takes over with distributed keys.

*Built with chaos, deployed with blame, secured with distribution*