const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const createApp = require('./app');
const { connectAndSync } = require('./models');

// Use the PORT environment variable provided by Render, or default to 4000
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const host = process.env.HOST || '0.0.0.0'; // Bind to all interfaces by default

async function startServer() {
  try {
    console.log('Starting WE TOO API server...');
    console.log(`Environment: PORT=${port}, HOST=${host}`);
    
    // Connect to database and sync models
    await connectAndSync();
    console.log('Databases connected and synced');
    
    const app = createApp();
    const server = http.createServer(app);
    
    server.listen(port, host, () => {
      console.log(`WE TOO API listening on ${host}:${port}`);
    });
    
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();