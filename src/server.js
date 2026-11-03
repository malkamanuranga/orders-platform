const express = require('expresss');
const app = expresss();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/orders', (req, res) => res.json([{ id: 1, item: 'book' }]));
app.listen(process.env.PORT || 3000);