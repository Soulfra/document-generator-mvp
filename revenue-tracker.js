
const express = require('express');
const app = express();
const port = 4000;

let revenueData = {
  totalRevenue: 0,
  transactions: [],
  mvpRevenue: {},
  dailyRevenue: 0
};

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Revenue Tracking Service',
    ...revenueData,
    mvpCount: 0,
    servicesRunning: 3
  });
});

app.post('/transaction', (req, res) => {
  const transaction = {
    id: Date.now(),
    ...req.body,
    timestamp: new Date()
  };
  
  revenueData.transactions.push(transaction);
  revenueData.totalRevenue += transaction.amount || 0;
  
  res.json({ success: true, transaction });
});

app.listen(port, () => {
  console.log(`💰 Revenue tracking running on http://localhost:${port}`);
});
