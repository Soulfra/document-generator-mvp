# 🔐 OAuth Setup Guide

Complete guide for setting up multi-provider OAuth authentication with proper "door manners" token management.

## 🚀 Quick Start

1. **Copy environment file**:
   ```bash
   cp .env.oauth .env
   ```

2. **Start the OAuth system**:
   ```bash
   node multi-provider-oauth-system.js
   ```

3. **Visit the authentication portal**:
   ```
   http://localhost:8000
   ```

## 📋 Provider Setup

### 1. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Document Generator
   - **Homepage URL**: `http://localhost:8000`
   - **Authorization callback URL**: `http://localhost:8000/auth/github/callback`
4. Copy the Client ID and Client Secret to `.env`

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Configure:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `http://localhost:8000`
   - **Authorized redirect URIs**: `http://localhost:8000/auth/google/callback`
6. Copy the Client ID and Client Secret to `.env`

### 3. Yahoo OAuth Setup

1. Go to [Yahoo Developer Network](https://developer.yahoo.com/apps/)
2. Create a new app
3. Fill in:
   - **Application Name**: Document Generator
   - **Application Type**: Web Application
   - **Callback Domain**: `localhost:8000`
   - **Callback URL**: `http://localhost:8000/auth/yahoo/callback`
4. Copy the Client ID and Client Secret to `.env`

### 4. Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Click "New registration"
3. Configure:
   - **Name**: Document Generator
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web → `http://localhost:8000/auth/microsoft/callback`
4. Go to Certificates & secrets → New client secret
5. Copy the Application (client) ID and client secret value to `.env`

## 🔧 Configuration

### Environment Variables

Edit `.env` with your OAuth credentials:

```bash
# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google  
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Yahoo
YAHOO_CLIENT_ID=your_yahoo_client_id
YAHOO_CLIENT_SECRET=your_yahoo_client_secret

# Microsoft
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### Security Settings

Generate secure secrets:

```bash
# Generate session secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

Add to `.env`:
```bash
SESSION_SECRET=your_generated_session_secret
JWT_SECRET=your_generated_jwt_secret
```

## 🚪 Token Lifecycle ("Proper Door Manners")

The system implements proper token management:

1. **Token Generation**: Single-use tokens created for specific purposes
2. **Immediate Use**: Tokens used exactly once for their intended action
3. **Automatic Revocation**: Tokens revoked within 1 second after use
4. **Comprehensive Logging**: All token lifecycle events audited

### Example Token Flow:
```
1. User clicks "Login with GitHub"
2. OAuth redirect to GitHub
3. User authorizes application
4. GitHub redirects back with code
5. System exchanges code for access token
6. System generates single-use session token
7. User session established
8. Single-use token immediately revoked
9. All events logged for audit
```

## 🛡️ Security Features

- **HTTPS Ready**: Configurable SSL/TLS support
- **Rate Limiting**: Per-IP request limiting
- **CSRF Protection**: State parameter validation
- **Session Security**: HttpOnly, Secure, SameSite cookies
- **Audit Logging**: Comprehensive security event logging
- **Token Expiration**: Configurable token lifespans
- **Input Validation**: Sanitized user inputs
- **Error Handling**: No sensitive data in error messages

## 📊 Monitoring & Analytics

### Audit Log Events
- `oauth_init` - OAuth flow started
- `oauth_success` - Successful authentication
- `oauth_error` - Authentication failed
- `token_generated` - Single-use token created
- `token_used` - Token consumed
- `token_revoked` - Token destroyed
- `logout` - User session ended

### System Stats
Access at `http://localhost:8000/api/admin/stats`:
- Active sessions count
- Active tokens count
- Recent login attempts
- Memory and uptime stats

## 🔄 Integration with Existing Systems

### Portal Integration

Update `portal-server.js` to use OAuth:

```javascript
// Replace voice auth with OAuth
app.get('/portal/auth/login', (req, res) => {
  res.redirect('http://localhost:8000/auth/github');
});
```

### Caddy Integration

Add to `Caddyfile`:

```
# OAuth System
:8000 {
    reverse_proxy localhost:8000
    
    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        X-Token-Policy "Multi-provider OAuth with single-use tokens"
    }
}
```

## 🧪 Testing

### Test OAuth Flow

1. Start the system: `node multi-provider-oauth-system.js`
2. Visit: `http://localhost:8000`
3. Click on each provider button
4. Complete OAuth flow
5. Verify user profile displays
6. Test logout functionality

### Verify Token Lifecycle

1. Check logs for token generation
2. Confirm immediate revocation after use
3. Verify audit log entries
4. Test token expiration

### Security Testing

- Test with invalid OAuth codes
- Verify state parameter validation
- Test session timeout
- Confirm rate limiting

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid client_id"**
   - Verify OAuth app configuration
   - Check `.env` file has correct credentials
   - Ensure callback URLs match exactly

2. **"Redirect URI mismatch"**
   - Update OAuth app redirect URIs
   - Check for http vs https mismatches
   - Verify port numbers

3. **"Token expired"**
   - Check system clock accuracy
   - Verify token expiration settings
   - Review session timeout configuration

4. **Rate limit errors**
   - Adjust `RATE_LIMIT_MAX_REQUESTS`
   - Increase `RATE_LIMIT_WINDOW_MS`
   - Check for bot traffic

### Debug Mode

Enable verbose logging:

```bash
DEBUG=oauth:* node multi-provider-oauth-system.js
```

## 📈 Production Deployment

### HTTPS Configuration

1. Obtain SSL certificates
2. Update `.env`:
   ```bash
   NODE_ENV=production
   PORT=443
   HTTPS_CERT_PATH=/path/to/cert.pem
   HTTPS_KEY_PATH=/path/to/key.pem
   ```

3. Update OAuth app redirect URLs to HTTPS

### Database Integration

For production, replace in-memory storage:

```javascript
// Replace Map with Redis/Database
this.sessions = new RedisStore();
this.auditLog = new DatabaseLogger();
```

### Process Management

Use PM2 for production:

```bash
npm install -g pm2
pm2 start multi-provider-oauth-system.js --name oauth-system
pm2 startup
pm2 save
```

## ✅ Success Checklist

- [ ] OAuth apps created for all providers
- [ ] Environment variables configured
- [ ] System starts without errors
- [ ] Can authenticate with GitHub
- [ ] Can authenticate with Google  
- [ ] Can authenticate with Yahoo
- [ ] Can authenticate with Microsoft
- [ ] Tokens are properly revoked
- [ ] Audit logging works
- [ ] Sessions persist correctly
- [ ] Logout clears all tokens
- [ ] Rate limiting active
- [ ] Security headers present

## 🎉 Ready!

Your multi-provider OAuth system is now ready with:

- ✅ Real authentication (no more mock logins)
- ✅ Proper code formatting (no truncation)
- ✅ Single-use tokens with immediate revocation
- ✅ Comprehensive security features
- ✅ Beautiful, responsive UI
- ✅ Complete audit trails
- ✅ Production-ready architecture

Visit `http://localhost:8000` to start authenticating with proper "door manners"!

---

*Multi-Provider OAuth: Professional authentication with single-use token lifecycle management*