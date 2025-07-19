#!/usr/bin/env node

// BYPASS SHELL - Direct execution
console.log('🔥 BYPASSING SHELL - DIRECT EXECUTION');

const FlagModeHooks = require('./flag-mode-hooks.js');
const flagSystem = new FlagModeHooks();

// Run it
flagSystem.startDualEconomy();

console.log('✅ RUNNING - Check output above');