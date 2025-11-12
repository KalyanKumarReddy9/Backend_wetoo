// Clean server with minimal routes
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Basic middleware
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Test the health check: http://localhost:4000/api/health');
});
