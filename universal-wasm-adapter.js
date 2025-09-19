/**
 * Universal WASM Adapter
 * Provides consistent interface for loading and managing WASM modules
 */
class UniversalWasmAdapter {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.errorHandler = null;
    }

    setErrorHandler(handler) {
        this.errorHandler = handler;
    }

    async loadModule(wasmPath, imports = {}) {
        if (this.loadedModules.has(wasmPath)) {
            return this.loadedModules.get(wasmPath);
        }

        if (this.loadingPromises.has(wasmPath)) {
            return this.loadingPromises.get(wasmPath);
        }

        const loadingPromise = this._loadModuleInternal(wasmPath, imports);
        this.loadingPromises.set(wasmPath, loadingPromise);

        try {
            const module = await loadingPromise;
            this.loadedModules.set(wasmPath, module);
            this.loadingPromises.delete(wasmPath);
            return module;
        } catch (error) {
            this.loadingPromises.delete(wasmPath);
            if (this.errorHandler) {
                this.errorHandler(error, wasmPath);
            }
            throw error;
        }
    }

    async _loadModuleInternal(wasmPath, imports) {
        const loadMethods = [
            () => this._loadFromFile(wasmPath, imports),
            () => this._loadFromUrl(wasmPath, imports),
            () => this._loadWithFallback(wasmPath, imports)
        ];

        for (const method of loadMethods) {
            try {
                return await method();
            } catch (error) {
                console.warn("WASM load method failed for " + wasmPath + ":", error.message);
                continue;
            }
        }

        throw new Error("All loading methods failed for " + wasmPath);
    }

    async _loadFromFile(wasmPath, imports) {
        let wasmBuffer;

        if (typeof fetch !== "undefined") {
            const response = await fetch(wasmPath);
            if (!response.ok) {
                throw new Error("HTTP " + response.status + ": " + response.statusText);
            }
            wasmBuffer = await response.arrayBuffer();
        } else {
            const fs = require("fs");
            wasmBuffer = fs.readFileSync(wasmPath);
        }

        return await WebAssembly.instantiate(wasmBuffer, imports);
    }

    async _loadFromUrl(wasmPath, imports) {
        let url = wasmPath;
        if (!wasmPath.startsWith("http") && typeof window !== "undefined") {
            url = new URL(wasmPath, window.location.href).href;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("HTTP " + response.status + ": " + response.statusText);
        }

        const wasmBuffer = await response.arrayBuffer();
        return await WebAssembly.instantiate(wasmBuffer, imports);
    }

    unloadModule(wasmPath) {
        this.loadedModules.delete(wasmPath);
        this.loadingPromises.delete(wasmPath);
    }

    getLoadedModules() {
        return Array.from(this.loadedModules.keys());
    }

    clearAll() {
        this.loadedModules.clear();
        this.loadingPromises.clear();
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = UniversalWasmAdapter;
} else if (typeof window !== "undefined") {
    window.UniversalWasmAdapter = UniversalWasmAdapter;
}