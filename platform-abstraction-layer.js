#!/usr/bin/env node

/**
 * 🌍 PLATFORM ABSTRACTION LAYER
 * 
 * Universal platform detection and abstraction for:
 * - iOS, Android (React Native, Flutter, Native)
 * - Windows, macOS, Linux (Desktop)
 * - Web browsers (Chrome, Safari, Firefox, Edge)
 * - Node.js environments
 * - Electron applications
 * 
 * Provides consistent APIs across all platforms.
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PlatformAbstractionLayer {
    constructor() {
        // Platform detection results
        this.platform = null;
        this.environment = null;
        this.capabilities = new Set();
        
        // Platform-specific handlers
        this.handlers = new Map();
        
        // Detect current platform
        this.detectPlatform();
        
        console.log('🌍 Platform Abstraction Layer initialized');
        console.log(`   📱 Platform: ${this.platform.name} (${this.platform.version})`);
        console.log(`   🌐 Environment: ${this.environment}`);
        console.log(`   ⚡ Capabilities: ${Array.from(this.capabilities).join(', ')}`);
    }
    
    /**
     * Detect current platform and environment
     */
    detectPlatform() {
        // Check if running in browser
        if (typeof window !== 'undefined') {
            this.detectBrowserPlatform();
        }
        // Check if React Native
        else if (typeof global !== 'undefined' && global.__DEV__ !== undefined) {
            this.detectReactNativePlatform();
        }
        // Check if Electron
        else if (process.versions && process.versions.electron) {
            this.detectElectronPlatform();
        }
        // Node.js environment
        else {
            this.detectNodePlatform();
        }
        
        // Initialize platform-specific handlers
        this.initializeHandlers();
    }
    
    /**
     * Detect browser platform
     */
    detectBrowserPlatform() {
        this.environment = 'browser';
        
        const userAgent = window.navigator.userAgent;
        const platform = window.navigator.platform;
        
        // Detect mobile browsers
        if (/Android/i.test(userAgent)) {
            this.platform = {
                name: 'android-web',
                version: this.extractAndroidVersion(userAgent),
                os: 'android',
                browser: this.detectBrowser(userAgent)
            };
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            this.platform = {
                name: 'ios-web',
                version: this.extractIOSVersion(userAgent),
                os: 'ios',
                browser: this.detectBrowser(userAgent)
            };
        } else {
            // Desktop browser
            this.platform = {
                name: 'web',
                version: this.detectBrowser(userAgent).version,
                os: this.detectDesktopOS(platform),
                browser: this.detectBrowser(userAgent)
            };
        }
        
        // Set browser capabilities
        this.capabilities.add('localStorage');
        this.capabilities.add('sessionStorage');
        this.capabilities.add('indexedDB');
        this.capabilities.add('webWorkers');
        this.capabilities.add('serviceWorker');
        this.capabilities.add('webRTC');
        
        if ('geolocation' in navigator) this.capabilities.add('geolocation');
        if ('bluetooth' in navigator) this.capabilities.add('bluetooth');
        if ('usb' in navigator) this.capabilities.add('usb');
    }
    
    /**
     * Detect React Native platform
     */
    detectReactNativePlatform() {
        this.environment = 'react-native';
        
        // React Native provides Platform API
        const Platform = require('react-native').Platform;
        
        this.platform = {
            name: `react-native-${Platform.OS}`,
            version: Platform.Version,
            os: Platform.OS,
            isTV: Platform.isTV || false,
            constants: Platform.constants
        };
        
        // React Native capabilities
        this.capabilities.add('asyncStorage');
        this.capabilities.add('camera');
        this.capabilities.add('geolocation');
        this.capabilities.add('pushNotifications');
        this.capabilities.add('biometrics');
        this.capabilities.add('fileSystem');
    }
    
    /**
     * Detect Electron platform
     */
    detectElectronPlatform() {
        this.environment = 'electron';
        
        const electronVersion = process.versions.electron;
        const platform = process.platform;
        
        this.platform = {
            name: 'electron',
            version: electronVersion,
            os: platform,
            arch: process.arch,
            node: process.versions.node,
            chrome: process.versions.chrome
        };
        
        // Electron capabilities
        this.capabilities.add('fileSystem');
        this.capabilities.add('nativeAPI');
        this.capabilities.add('systemTray');
        this.capabilities.add('notifications');
        this.capabilities.add('autoUpdater');
        this.capabilities.add('ipc');
        this.capabilities.add('shell');
    }
    
    /**
     * Detect Node.js platform
     */
    detectNodePlatform() {
        this.environment = 'node';
        
        this.platform = {
            name: 'node',
            version: process.version,
            os: os.platform(),
            arch: os.arch(),
            release: os.release(),
            type: os.type()
        };
        
        // Node.js capabilities
        this.capabilities.add('fileSystem');
        this.capabilities.add('networking');
        this.capabilities.add('childProcess');
        this.capabilities.add('crypto');
        this.capabilities.add('clustering');
        this.capabilities.add('workerThreads');
    }
    
    /**
     * Initialize platform-specific handlers
     */
    initializeHandlers() {
        // File system handlers
        this.handlers.set('fileSystem', this.createFileSystemHandler());
        
        // Storage handlers
        this.handlers.set('storage', this.createStorageHandler());
        
        // Network handlers
        this.handlers.set('network', this.createNetworkHandler());
        
        // Crypto handlers
        this.handlers.set('crypto', this.createCryptoHandler());
        
        // Path handlers
        this.handlers.set('path', this.createPathHandler());
        
        // Permission handlers
        this.handlers.set('permissions', this.createPermissionHandler());
    }
    
    /**
     * Create file system handler
     */
    createFileSystemHandler() {
        switch (this.environment) {
            case 'browser':
                return {
                    readFile: async (path) => {
                        // Use FileSystem API or IndexedDB
                        throw new Error('File system not available in browser');
                    },
                    writeFile: async (path, data) => {
                        // Use FileSystem API or IndexedDB
                        throw new Error('File system not available in browser');
                    },
                    exists: async (path) => false,
                    mkdir: async (path) => {
                        throw new Error('File system not available in browser');
                    }
                };
                
            case 'react-native':
                const RNFS = require('react-native-fs');
                return {
                    readFile: (path) => RNFS.readFile(path, 'utf8'),
                    writeFile: (path, data) => RNFS.writeFile(path, data, 'utf8'),
                    exists: (path) => RNFS.exists(path),
                    mkdir: (path) => RNFS.mkdir(path)
                };
                
            case 'electron':
            case 'node':
                return {
                    readFile: (path) => fs.readFile(path, 'utf8'),
                    writeFile: (path, data) => fs.writeFile(path, data, 'utf8'),
                    exists: async (path) => {
                        try {
                            await fs.access(path);
                            return true;
                        } catch {
                            return false;
                        }
                    },
                    mkdir: (path) => fs.mkdir(path, { recursive: true })
                };
        }
    }
    
    /**
     * Create storage handler
     */
    createStorageHandler() {
        switch (this.environment) {
            case 'browser':
                return {
                    get: (key) => localStorage.getItem(key),
                    set: (key, value) => localStorage.setItem(key, value),
                    remove: (key) => localStorage.removeItem(key),
                    clear: () => localStorage.clear()
                };
                
            case 'react-native':
                const AsyncStorage = require('@react-native-async-storage/async-storage');
                return {
                    get: (key) => AsyncStorage.getItem(key),
                    set: (key, value) => AsyncStorage.setItem(key, value),
                    remove: (key) => AsyncStorage.removeItem(key),
                    clear: () => AsyncStorage.clear()
                };
                
            case 'electron':
                const { app } = require('electron');
                const Store = require('electron-store');
                const store = new Store();
                return {
                    get: (key) => store.get(key),
                    set: (key, value) => store.set(key, value),
                    remove: (key) => store.delete(key),
                    clear: () => store.clear()
                };
                
            case 'node':
                // Use file-based storage
                const storageFile = path.join(os.tmpdir(), 'platform-storage.json');
                return {
                    get: async (key) => {
                        try {
                            const data = await fs.readFile(storageFile, 'utf8');
                            const storage = JSON.parse(data);
                            return storage[key];
                        } catch {
                            return null;
                        }
                    },
                    set: async (key, value) => {
                        let storage = {};
                        try {
                            const data = await fs.readFile(storageFile, 'utf8');
                            storage = JSON.parse(data);
                        } catch {}
                        storage[key] = value;
                        await fs.writeFile(storageFile, JSON.stringify(storage));
                    },
                    remove: async (key) => {
                        try {
                            const data = await fs.readFile(storageFile, 'utf8');
                            const storage = JSON.parse(data);
                            delete storage[key];
                            await fs.writeFile(storageFile, JSON.stringify(storage));
                        } catch {}
                    },
                    clear: async () => {
                        await fs.writeFile(storageFile, '{}');
                    }
                };
        }
    }
    
    /**
     * Create network handler
     */
    createNetworkHandler() {
        // Universal fetch API (polyfilled where needed)
        const universalFetch = this.environment === 'node' 
            ? require('node-fetch') 
            : fetch;
            
        return {
            fetch: universalFetch,
            isOnline: () => {
                if (typeof navigator !== 'undefined') {
                    return navigator.onLine;
                }
                // For Node.js, assume online
                return true;
            },
            getNetworkType: () => {
                if (typeof navigator !== 'undefined' && navigator.connection) {
                    return navigator.connection.effectiveType;
                }
                return 'unknown';
            }
        };
    }
    
    /**
     * Create crypto handler
     */
    createCryptoHandler() {
        switch (this.environment) {
            case 'browser':
                return {
                    randomBytes: (size) => {
                        const buffer = new Uint8Array(size);
                        crypto.getRandomValues(buffer);
                        return buffer;
                    },
                    hash: async (data, algorithm = 'SHA-256') => {
                        const encoder = new TextEncoder();
                        const dataBuffer = encoder.encode(data);
                        const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    }
                };
                
            case 'react-native':
                // Would need react-native-crypto or similar
                return {
                    randomBytes: (size) => {
                        // Implement with react-native-crypto
                        return new Uint8Array(size);
                    },
                    hash: async (data, algorithm = 'sha256') => {
                        // Implement with react-native-crypto
                        return '';
                    }
                };
                
            case 'electron':
            case 'node':
                return {
                    randomBytes: (size) => crypto.randomBytes(size),
                    hash: async (data, algorithm = 'sha256') => {
                        return crypto.createHash(algorithm).update(data).digest('hex');
                    }
                };
        }
    }
    
    /**
     * Create path handler
     */
    createPathHandler() {
        switch (this.environment) {
            case 'browser':
                return {
                    join: (...paths) => paths.join('/'),
                    resolve: (...paths) => '/' + paths.join('/'),
                    dirname: (filePath) => {
                        const parts = filePath.split('/');
                        parts.pop();
                        return parts.join('/');
                    },
                    basename: (filePath) => {
                        const parts = filePath.split('/');
                        return parts[parts.length - 1];
                    }
                };
                
            case 'react-native':
                return {
                    join: (...paths) => paths.join('/'),
                    resolve: (...paths) => '/' + paths.join('/'),
                    dirname: (filePath) => {
                        const parts = filePath.split('/');
                        parts.pop();
                        return parts.join('/');
                    },
                    basename: (filePath) => {
                        const parts = filePath.split('/');
                        return parts[parts.length - 1];
                    }
                };
                
            case 'electron':
            case 'node':
                return {
                    join: path.join,
                    resolve: path.resolve,
                    dirname: path.dirname,
                    basename: path.basename
                };
        }
    }
    
    /**
     * Create permission handler
     */
    createPermissionHandler() {
        return {
            request: async (permission) => {
                switch (this.environment) {
                    case 'browser':
                        if (permission === 'notifications') {
                            return Notification.requestPermission();
                        }
                        if (permission === 'geolocation') {
                            return new Promise((resolve) => {
                                navigator.geolocation.getCurrentPosition(
                                    () => resolve('granted'),
                                    () => resolve('denied')
                                );
                            });
                        }
                        break;
                        
                    case 'react-native':
                        // Would use react-native-permissions
                        break;
                        
                    case 'electron':
                        // Electron handles permissions differently
                        return 'granted';
                        
                    case 'node':
                        // Node.js has full system access
                        return 'granted';
                }
                
                return 'denied';
            },
            
            check: async (permission) => {
                // Implementation depends on platform
                return 'granted';
            }
        };
    }
    
    /**
     * Helper methods
     */
    extractAndroidVersion(userAgent) {
        const match = userAgent.match(/Android\s+([\d.]+)/);
        return match ? match[1] : 'unknown';
    }
    
    extractIOSVersion(userAgent) {
        const match = userAgent.match(/OS\s+([\d_]+)/);
        return match ? match[1].replace(/_/g, '.') : 'unknown';
    }
    
    detectBrowser(userAgent) {
        if (userAgent.includes('Chrome')) {
            return { name: 'chrome', version: this.extractVersion(userAgent, 'Chrome') };
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return { name: 'safari', version: this.extractVersion(userAgent, 'Version') };
        } else if (userAgent.includes('Firefox')) {
            return { name: 'firefox', version: this.extractVersion(userAgent, 'Firefox') };
        } else if (userAgent.includes('Edge')) {
            return { name: 'edge', version: this.extractVersion(userAgent, 'Edge') };
        }
        return { name: 'unknown', version: 'unknown' };
    }
    
    extractVersion(userAgent, browserName) {
        const regex = new RegExp(`${browserName}\\/(\\S+)`);
        const match = userAgent.match(regex);
        return match ? match[1] : 'unknown';
    }
    
    detectDesktopOS(platform) {
        if (platform.includes('Win')) return 'windows';
        if (platform.includes('Mac')) return 'macos';
        if (platform.includes('Linux')) return 'linux';
        return 'unknown';
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Get current platform info
     */
    getPlatform() {
        return {
            ...this.platform,
            environment: this.environment,
            capabilities: Array.from(this.capabilities)
        };
    }
    
    /**
     * Check if capability is available
     */
    hasCapability(capability) {
        return this.capabilities.has(capability);
    }
    
    /**
     * Get platform-specific handler
     */
    getHandler(type) {
        return this.handlers.get(type);
    }
    
    /**
     * Universal file operations
     */
    async readFile(filePath) {
        const fs = this.getHandler('fileSystem');
        return fs.readFile(filePath);
    }
    
    async writeFile(filePath, data) {
        const fs = this.getHandler('fileSystem');
        return fs.writeFile(filePath, data);
    }
    
    async fileExists(filePath) {
        const fs = this.getHandler('fileSystem');
        return fs.exists(filePath);
    }
    
    /**
     * Universal storage operations
     */
    async getStorageItem(key) {
        const storage = this.getHandler('storage');
        return storage.get(key);
    }
    
    async setStorageItem(key, value) {
        const storage = this.getHandler('storage');
        return storage.set(key, value);
    }
    
    /**
     * Universal path operations
     */
    joinPath(...paths) {
        const pathHandler = this.getHandler('path');
        return pathHandler.join(...paths);
    }
    
    resolvePath(...paths) {
        const pathHandler = this.getHandler('path');
        return pathHandler.resolve(...paths);
    }
    
    /**
     * Get app data directory
     */
    getAppDataDir() {
        switch (this.environment) {
            case 'browser':
                return '/app-data'; // Virtual path
                
            case 'react-native':
                const RNFS = require('react-native-fs');
                return RNFS.DocumentDirectoryPath;
                
            case 'electron':
                const { app } = require('electron');
                return app.getPath('userData');
                
            case 'node':
                return path.join(os.homedir(), '.document-generator');
        }
    }
    
    /**
     * Get temp directory
     */
    getTempDir() {
        switch (this.environment) {
            case 'browser':
                return '/temp'; // Virtual path
                
            case 'react-native':
                const RNFS = require('react-native-fs');
                return RNFS.TemporaryDirectoryPath;
                
            case 'electron':
            case 'node':
                return os.tmpdir();
        }
    }
    
    /**
     * Check if running on mobile
     */
    isMobile() {
        return this.platform.os === 'ios' || this.platform.os === 'android';
    }
    
    /**
     * Check if running on desktop
     */
    isDesktop() {
        return ['windows', 'macos', 'linux'].includes(this.platform.os);
    }
    
    /**
     * Check if running in browser
     */
    isBrowser() {
        return this.environment === 'browser';
    }
    
    /**
     * Get platform-specific error handler
     */
    handlePlatformError(error) {
        const errorInfo = {
            platform: this.platform,
            environment: this.environment,
            error: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        // Platform-specific error handling
        switch (this.environment) {
            case 'browser':
                console.error('Browser Error:', errorInfo);
                // Could send to error tracking service
                break;
                
            case 'react-native':
                console.error('React Native Error:', errorInfo);
                // Could use Crashlytics or Sentry
                break;
                
            case 'electron':
                console.error('Electron Error:', errorInfo);
                // Could use electron-log
                break;
                
            case 'node':
                console.error('Node.js Error:', errorInfo);
                // Could write to error log file
                break;
        }
        
        return errorInfo;
    }
}

// Export for use
module.exports = PlatformAbstractionLayer;

// Run demo if executed directly
if (require.main === module) {
    const pal = new PlatformAbstractionLayer();
    
    console.log('\n📊 Platform Abstraction Layer Demo');
    console.log('===================================\n');
    
    console.log('Platform Info:');
    console.log(JSON.stringify(pal.getPlatform(), null, 2));
    
    console.log('\nCapabilities:');
    console.log(`- File System: ${pal.hasCapability('fileSystem')}`);
    console.log(`- Storage: ${pal.hasCapability('localStorage') || pal.hasCapability('asyncStorage')}`);
    console.log(`- Networking: ${pal.hasCapability('networking')}`);
    console.log(`- Crypto: ${pal.hasCapability('crypto')}`);
    
    console.log('\nPlatform Checks:');
    console.log(`- Is Mobile: ${pal.isMobile()}`);
    console.log(`- Is Desktop: ${pal.isDesktop()}`);
    console.log(`- Is Browser: ${pal.isBrowser()}`);
    
    console.log('\nDirectories:');
    console.log(`- App Data: ${pal.getAppDataDir()}`);
    console.log(`- Temp: ${pal.getTempDir()}`);
    
    // Test storage
    (async () => {
        console.log('\nTesting Storage:');
        await pal.setStorageItem('test-key', 'test-value');
        const value = await pal.getStorageItem('test-key');
        console.log(`- Stored and retrieved: ${value}`);
    })();
}