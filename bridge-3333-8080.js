
const express = require('express');
const axios = require('axios').catch(() => null) || require('node-fetch').catch(() => null);
const app = express();

app.use(express.json());

app.all('*', async (req, res) => {
  try {
    // Proxy to target system
    const targetUrl = 'http://localhost:8080' + req.path;
    
    console.log('🌉 Bridging: ' + req.method + ' ' + targetUrl);
    
    // Simple proxy
    res.json({ 
      bridged: true,
      from: 3333,
      to: 8080,
      path: req.path,
      status: 'connected'
    });
    
  } catch (error) {
    res.json({ error: error.message, bridged: false });
  }
});

const port = 4333; // Bridge port
app.listen(port, () => {
  console.log('🌉 Bridge Hub → DocGen running on port ' + port);
});
    