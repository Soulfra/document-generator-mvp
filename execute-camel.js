#!/usr/bin/env node

// Execute CAMEL third hump directly
console.log('🐪 EXECUTING CAMEL THIRD HUMP...\n');

const CAMELThirdHump = require('./camel-third-hump.js');
const camel = new CAMELThirdHump();

camel.activateThirdHump()
  .then(report => {
    console.log('\n✅ CAMEL ACTIVATED!');
    console.log(`🧠 Consciousness: ${(report.emergence.consciousness_level * 100).toFixed(1)}%`);
  })
  .catch(console.error);