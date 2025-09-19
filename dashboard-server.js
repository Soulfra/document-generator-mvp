
const express = require('express');
const path = require('path');
const app = express();
const port = 9000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'business-empire-dashboard.html'));
});

app.listen(port, () => {
  console.log(`🎛️ Business Empire Dashboard: http://localhost:${port}`);
});
