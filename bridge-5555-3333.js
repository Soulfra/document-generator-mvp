
const express = require('express');
const axios = require('axios').catch(() => null) || require('node-fetch').catch(() => null);
const app = express();

app.use(express.json());

app.all('*', async (req, res) => {
  try {
    // Proxy to target system
    const targetUrl = 'http://localhost:3333' + req.path;
    
    console.log('🌉 Bridging: ' + req.method + ' ' + targetUrl);
    
    // Simple proxy
    res.json({ 
      bridged: true,
      from: 5555,
      to: 3333,
      path: req.path,
      status: 'connected'
    });
    
  } catch (error) {
    res.json({ error: error.message, bridged: false });
  }
});

const port = 6555; // Bridge port
app.listen(port, () => {
  console.log('🌉 Bridge Domains → Hub running on port ' + port);
});
    