# 🚨 Emergency Recovery System

**Comprehensive security and recovery system that activates on user interactions with intelligent threat detection and interchangeable key management.**

## 🎯 Overview

The Emergency Recovery System is a comprehensive security infrastructure that:

- **Activates on any user interaction** with your site/network/apps
- **Provides interchangeable key systems** for agent authentication
- **Monitors PGP certificates and private keys** for leaks
- **Tracks tampering** across all system components
- **Generates custom UPC/QR/RFID/Bluetooth identifiers**
- **Maintains legacy hardware compatibility**
- **Provides real-time threat monitoring**

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User Interaction│────▶│Emergency Recovery│────▶│  Action Triggers │
│  (Site/App)     │     │     System      │     │   & Monitoring   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PGP Auth       │     │ UPC/QR Tracker │     │ Custom ID Gen   │
│  (Port 3000)    │     │ (Port 3003)     │     │ (Built-in)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                    ┌─────────────────────────┐
                    │    WebSocket Monitor    │
                    │     (Port 9912)        │
                    └─────────────────────────┘
```

## 🚀 Quick Start

### 1. Launch the System

```bash
# Make launch script executable
chmod +x launch-emergency-recovery.sh

# Start all services
./launch-emergency-recovery.sh
```

### 2. Access Points

- **Main API**: http://localhost:9911
- **WebSocket**: ws://localhost:9912
- **Health Check**: http://localhost:9911/health
- **Status Dashboard**: http://localhost:9911/status

### 3. Test Integration

```bash
# Run comprehensive tests
node test-emergency-integration.js
```

## 🔧 Core Features

### Emergency Activation

Triggers when users interact with your systems:

```javascript
// Automatic triggers on:
// - Website visits
// - App connections
// - Network access
// - API calls

// Manual activation
curl -X POST http://localhost:9911/emergency/activate \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-123",
    "reason": "Suspected compromise",
    "authMethod": "pgp"
  }'
```

### Interchangeable Key System

Agent keys work across all authentication methods:

```javascript
// Key interchange
curl -X POST http://localhost:9911/keys/interchange \
  -H 'Content-Type: application/json' \
  -d '{
    "agentId": "agent-001",
    "currentKey": "-----BEGIN PUBLIC KEY-----...",
    "newKey": "-----BEGIN PUBLIC KEY-----...",
    "signature": "hex-signature"
  }'
```

### Leak Detection

Continuous monitoring for compromised keys:

```javascript
// Check for leaks
curl -X POST http://localhost:9911/security/check-leak \
  -H 'Content-Type: application/json' \
  -d '{
    "keyType": "pgp",
    "keyData": "-----BEGIN PGP PUBLIC KEY-----...",
    "checkSource": "deep"
  }'
```

### Custom Identifier Generation

Create UPC/QR/RFID/Bluetooth codes compatible with legacy hardware:

```javascript
// Generate universal identifier
curl -X POST http://localhost:9911/identifier/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "universal",
    "ownerId": "owner-123",
    "metadata": {"purpose": "authentication"},
    "legacyCompatible": true
  }'
```

## 📊 Supported Identifier Types

### UPC Codes
- **Format**: GS1-compliant UPC-A/UPC-E
- **Legacy Support**: EAN-13, Code-128
- **Scannable**: All commercial barcode scanners

### QR Codes
- **Format**: QR Code with embedded security
- **Legacy Support**: Data Matrix, QR Version 1
- **Features**: Error correction, payload signing

### RFID Frequencies
- **Range**: 125-134 kHz (LF), 13.56 MHz (HF)
- **Protocols**: ISO 18000-2, ISO 14443
- **Legacy Support**: EM4100, HID Prox

### Bluetooth Beacons
- **Format**: iBeacon, Eddystone
- **Frequency**: 2.4-2.485 GHz
- **Legacy Support**: Bluetooth 4.0+

## 🛡️ Security Monitoring

### Real-time Threat Detection

- **PGP Certificate Monitoring**: Checks certificate transparency logs
- **Private Key Leak Detection**: Scans breach databases and paste sites
- **Tamper Detection**: File integrity monitoring with hash verification
- **Network Anomaly Detection**: Unusual access pattern identification

### Threat Response

```javascript
// WebSocket monitoring
const ws = new WebSocket('ws://localhost:9912');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  switch(event.type) {
    case 'tamper_alert':
      // Handle tamper detection
      break;
    case 'leak_detected':
      // Handle key compromise
      break;
    case 'emergency_activated':
      // Handle emergency situation
      break;
  }
});
```

## 🔄 Integration with Existing Systems

### PGP Authentication
- **Service**: pgp-auth-middleware.js
- **Port**: 3000
- **Features**: Key generation, challenge/response, session management

### UPC/QR Tracking
- **Service**: upc-qr-reverse-tracker.js
- **Port**: 3003
- **Features**: Multi-source lookup, company hierarchy, ownership chains

### Internal Search
- **Service**: internal-search-engine.js
- **Port**: 3333
- **Features**: Document indexing, service discovery, unified search

## 📈 Monitoring Dashboard

Access the status dashboard at http://localhost:9911/status:

```json
{
  "system": "Emergency Recovery System",
  "security": {
    "activeThreats": 0,
    "lockouts": 0,
    "recentLeaks": 0,
    "recentTampers": 0
  },
  "recovery": {
    "availableMethods": ["pgp", "biometric", "hardware-token"],
    "activeRecoveries": 2,
    "successRate": "98.5%"
  },
  "identifiers": {
    "totalGenerated": 156,
    "activeAllocations": 89,
    "supportedProtocols": ["GS1", "ISO/IEC 18004", "Bluetooth LE"]
  }
}
```

## 🔌 WebSocket Events

Connect to ws://localhost:9912 for real-time monitoring:

### Connection
```json
{
  "type": "connected",
  "sessionId": "abc123",
  "status": "monitoring"
}
```

### Tamper Alert
```json
{
  "type": "tamper_alert",
  "event": {
    "resource_type": "file",
    "resource_id": "./config.json",
    "tamper_type": "hash_mismatch",
    "severity": "critical"
  }
}
```

### Leak Detection
```json
{
  "type": "leak_detected",
  "event": {
    "key_type": "pgp",
    "key_fingerprint": "1234ABCD",
    "leak_source": "paste-site",
    "severity": "critical"
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Emergency Recovery System
EMERGENCY_PORT=9911
EMERGENCY_WS_PORT=9912

# Security Settings
MAX_FAILED_ATTEMPTS=3
LOCKOUT_DURATION=900000  # 15 minutes
LEAK_CHECK_INTERVAL=300000  # 5 minutes

# Integration URLs
PGP_AUTH_URL=http://localhost:3000
UPC_TRACKER_URL=http://localhost:3003
SEARCH_ENGINE_URL=http://localhost:3333

# Database
EMERGENCY_DB_PATH=./emergency-recovery.db
```

### Custom Frequency Ranges

```javascript
{
  "frequencyRange": {
    "bluetooth": { "min": 2.4e9, "max": 2.485e9 },
    "rfid": { "min": 125e3, "max": 134e3 },
    "nfc": { "min": 13.553e6, "max": 13.567e6 }
  }
}
```

## 🧪 Testing

### Run Integration Tests

```bash
# Full test suite
node test-emergency-integration.js

# Specific test
node test-emergency-integration.js --test=leak-detection
```

### Manual Testing

```bash
# Test emergency activation
curl -X POST http://localhost:9911/emergency/activate \
  -H 'Content-Type: application/json' \
  -d '{"userId":"test","reason":"manual test"}'

# Test identifier generation
curl -X POST http://localhost:9911/identifier/generate \
  -H 'Content-Type: application/json' \
  -d '{"type":"qr","ownerId":"test"}'

# Test leak check
curl -X POST http://localhost:9911/security/check-leak \
  -H 'Content-Type: application/json' \
  -d '{"keyType":"test","keyData":"test-key"}'
```

## 📚 API Reference

### Emergency Endpoints

- `POST /emergency/activate` - Activate emergency recovery
- `POST /emergency/verify-identity` - Verify user identity
- `POST /emergency/recover-access` - Recover account access

### Key Management

- `POST /keys/interchange` - Interchange agent keys
- `POST /keys/rotate` - Rotate key pairs
- `GET /keys/agent/:id` - Get agent key info

### Security Monitoring

- `POST /security/check-leak` - Check for key leaks
- `POST /security/report-compromise` - Report compromise
- `GET /security/certificate-status` - Certificate status

### Identifier Generation

- `POST /identifier/generate` - Generate custom identifier
- `POST /identifier/verify` - Verify identifier authenticity
- `GET /identifier/legacy-compatible/:id` - Get legacy formats

### System Status

- `GET /health` - System health check
- `GET /status` - Detailed status information
- `GET /tamper/history` - Tamper event history

## 🚨 Emergency Procedures

### Key Compromise Response

1. **Automatic Detection**: System detects leaked key
2. **Immediate Lockout**: Compromised key is revoked
3. **Alert Generation**: Notifications sent via WebSocket
4. **Recovery Initiation**: Emergency recovery activated
5. **Key Rotation**: New keys generated and distributed

### Tamper Detection Response

1. **Hash Verification**: File integrity continuously monitored
2. **Change Detection**: Unauthorized modifications detected
3. **Alert Broadcasting**: Real-time alerts to all clients
4. **Protective Mode**: System enters read-only mode
5. **Investigation**: Tamper events logged for analysis

### System Recovery

1. **Identity Verification**: Multi-factor authentication
2. **Key Validation**: Verify all cryptographic materials
3. **System Integrity**: Check all components for tampering
4. **Service Restoration**: Gradual service restoration
5. **Monitoring**: Enhanced monitoring during recovery

## 💡 Best Practices

### Security
- Rotate agent keys every 30 days
- Monitor leak detection alerts continuously
- Verify all custom identifiers before deployment
- Maintain offline backups of recovery keys

### Performance
- Cache frequently accessed identifiers
- Use WebSocket for real-time updates
- Batch leak detection checks
- Monitor system resource usage

### Integration
- Use provided middleware for authentication
- Implement proper error handling
- Log all security events
- Test emergency procedures regularly

## 🔗 Related Systems

- **PGP Authentication**: `pgp-auth-middleware.js`
- **UPC/QR Tracking**: `upc-qr-reverse-tracker.js`
- **Internal Search**: `internal-search-engine.js`
- **Document Generator**: Core platform integration

## 📞 Support

For issues or questions:

1. Check the logs in `./logs/emergency-recovery.log`
2. Review the health check at `/health`
3. Monitor WebSocket events for real-time issues
4. Run integration tests to verify functionality

---

**🚨 Emergency Recovery System - Protecting your digital identity and infrastructure**