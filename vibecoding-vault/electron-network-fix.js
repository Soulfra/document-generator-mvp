/**
 * Electron Network Fix Module
 * Comprehensive network connectivity fixes for Electron apps
 */

const { app, session, net, ipcMain } = require('electron');
const dns = require('dns');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);

class ElectronNetworkFix {
  constructor() {
    this.networkStatus = {
      isOnline: true,
      lastCheck: Date.now(),
      errors: []
    };
  }

  /**
   * Apply all network fixes
   */
  applyFixes() {
    // 1. Certificate and SSL fixes
    this.fixCertificateIssues();
    
    // 2. DNS fixes
    this.fixDNSIssues();
    
    // 3. Proxy fixes
    this.fixProxyIssues();
    
    // 4. Network protocol fixes
    this.fixNetworkProtocols();
    
    // 5. WebRequest fixes
    this.fixWebRequests();
    
    // 6. Set up IPC handlers
    this.setupIPCHandlers();
    
    console.log('✅ All network fixes applied');
  }

  /**
   * Fix certificate and SSL issues
   */
  fixCertificateIssues() {
    // Ignore certificate errors in development
    if (process.env.NODE_ENV !== 'production') {
      app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
      app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
      
      // Disable certificate transparency
      app.commandLine.appendSwitch('disable-features', 'CertificateTransparencyComponentUpdater');
    }

    // Handle certificate errors
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      console.warn(`Certificate error for ${url}: ${error}`);
      
      // In development, accept all certificates
      if (process.env.NODE_ENV !== 'production') {
        event.preventDefault();
        callback(true);
      } else {
        // In production, only accept certificates for localhost
        if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
          event.preventDefault();
          callback(true);
        } else {
          callback(false);
        }
      }
    });

    // When app is ready, set certificate verify proc
    app.whenReady().then(() => {
      session.defaultSession.setCertificateVerifyProc((request, callback) => {
        // In development, accept all certificates
        if (process.env.NODE_ENV !== 'production') {
          callback(0); // 0 = OK
        } else {
          // In production, perform normal verification
          callback(-3); // -3 = Use chromium default
        }
      });
    });
  }

  /**
   * Fix DNS resolution issues
   */
  fixDNSIssues() {
    // Force IPv4 first
    app.commandLine.appendSwitch('enable-features', 'DnsOverHttps');
    
    // Use Google's DNS-over-HTTPS
    app.commandLine.appendSwitch('doh-server-url', 'https://dns.google/dns-query');
    
    // Disable IPv6 if causing issues
    if (process.env.DISABLE_IPV6) {
      app.commandLine.appendSwitch('disable-ipv6');
    }
    
    // Set custom DNS servers
    const customDNS = process.env.CUSTOM_DNS || '8.8.8.8,1.1.1.1';
    app.commandLine.appendSwitch('host-resolver-rules', `MAP * ~NOTFOUND, EXCLUDE ${customDNS}`);
  }

  /**
   * Fix proxy-related issues
   */
  fixProxyIssues() {
    // Check for proxy environment variables
    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;
    
    if (proxyUrl) {
      console.log(`Using proxy: ${proxyUrl}`);
      
      // Configure proxy settings when app is ready
      app.whenReady().then(() => {
        session.defaultSession.setProxy({
          proxyRules: proxyUrl,
          proxyBypassRules: process.env.NO_PROXY || 'localhost,127.0.0.1,localaddress,.localdomain.com'
        });
      });
    } else {
      // Explicitly disable proxy
      app.commandLine.appendSwitch('no-proxy-server');
    }
    
    // Disable proxy auto-detection which can cause delays
    app.commandLine.appendSwitch('disable-features', 'ProxyAutoDetect');
  }

  /**
   * Fix network protocol issues
   */
  fixNetworkProtocols() {
    // Enable all network features
    app.commandLine.appendSwitch('enable-features', 'NetworkService,NetworkServiceInProcess');
    
    // Enable QUIC protocol for better performance
    app.commandLine.appendSwitch('enable-quic');
    
    // Set aggressive timeouts to fail fast
    app.commandLine.appendSwitch('network-timeout', '30');
    
    // Enable experimental web platform features
    app.commandLine.appendSwitch('enable-experimental-web-platform-features');
    
    // Force Chrome's network stack
    app.commandLine.appendSwitch('use-chrome-network-stack', 'true');
  }

  /**
   * Fix web request handling
   */
  fixWebRequests() {
    app.whenReady().then(() => {
      // Modify headers to ensure proper network access
      session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        // Add user agent if missing
        if (!details.requestHeaders['User-Agent']) {
          details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (compatible; Electron)';
        }
        
        // Remove problematic headers
        delete details.requestHeaders['Origin'];
        delete details.requestHeaders['Referer'];
        
        callback({ requestHeaders: details.requestHeaders });
      });
      
      // Handle redirect issues
      session.defaultSession.webRequest.onBeforeRedirect((details) => {
        console.log(`Redirect: ${details.url} -> ${details.redirectURL}`);
      });
      
      // Log failed requests for debugging
      session.defaultSession.webRequest.onErrorOccurred((details) => {
        console.error(`Request failed: ${details.url} - ${details.error}`);
        this.networkStatus.errors.push({
          url: details.url,
          error: details.error,
          timestamp: Date.now()
        });
      });
    });
  }

  /**
   * Set up IPC handlers for network operations
   */
  setupIPCHandlers() {
    // Get network status
    ipcMain.handle('get-network-status', async () => {
      return this.checkNetworkStatus();
    });
    
    // Check specific URL connectivity
    ipcMain.handle('check-connectivity', async (event, url) => {
      return this.checkURLConnectivity(url);
    });
    
    // Get system info
    ipcMain.handle('get-system-info', async () => {
      const os = require('os');
      return {
        platform: process.platform,
        arch: process.arch,
        version: process.version,
        networkInterfaces: os.networkInterfaces(),
        proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || 'none'
      };
    });
  }

  /**
   * Check overall network status
   */
  async checkNetworkStatus() {
    const tests = [
      { url: 'https://www.google.com', name: 'Google' },
      { url: 'https://dns.google', name: 'Google DNS' },
      { url: 'https://1.1.1.1', name: 'Cloudflare' }
    ];
    
    const results = await Promise.all(
      tests.map(test => this.checkURLConnectivity(test.url))
    );
    
    const isOnline = results.some(r => r.success);
    
    this.networkStatus = {
      isOnline,
      lastCheck: Date.now(),
      tests: tests.map((test, i) => ({ ...test, ...results[i] })),
      errors: this.networkStatus.errors.slice(-10) // Keep last 10 errors
    };
    
    return this.networkStatus;
  }

  /**
   * Check connectivity to a specific URL
   */
  async checkURLConnectivity(url) {
    try {
      const startTime = Date.now();
      
      // First try DNS lookup
      const urlObj = new URL(url);
      try {
        await dnsLookup(urlObj.hostname);
      } catch (dnsError) {
        return {
          success: false,
          error: `DNS lookup failed: ${dnsError.message}`,
          duration: Date.now() - startTime
        };
      }
      
      // Then try actual request
      return new Promise((resolve) => {
        const request = net.request({
          url,
          method: 'HEAD',
          timeout: 10000
        });
        
        request.on('response', (response) => {
          resolve({
            success: response.statusCode >= 200 && response.statusCode < 400,
            statusCode: response.statusCode,
            duration: Date.now() - startTime
          });
        });
        
        request.on('error', (error) => {
          resolve({
            success: false,
            error: error.message,
            duration: Date.now() - startTime
          });
        });
        
        request.end();
      });
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: 0
      };
    }
  }
}

// Create and export singleton instance
const networkFix = new ElectronNetworkFix();

// Auto-apply fixes when module is loaded
networkFix.applyFixes();

module.exports = networkFix;