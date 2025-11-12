// Minimal server to test routing
const express = require('express');
const app = express();

// Basic route - should work
app.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'Basic route works' });
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Minimal server running on http://localhost:${PORT}`);
  console.log('Test the basic route: http://localhost:4000/test');
});
