const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { connectAndSync } = require('./models');
const authRoutes = require('./routes/auth.routes');

dotenv.config();

// Simple file logger: mirror console logs to a file for easier inspection while running
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const logFile = path.join(logsDir, 'server.log');
function appendLog(type, args) {
  try {
    const line = `[${new Date().toISOString()}] ${type.toUpperCase()} ${JSON.stringify(Array.from(args))}\n`;
    fs.appendFileSync(logFile, line);
  } catch (e) {
    // ignore logging errors
  }
}
const origLog = console.log;
const origError = console.error;
console.log = function () { appendLog('log', arguments); origLog.apply(console, arguments); };
console.error = function () { appendLog('error', arguments); origError.apply(console, arguments); };

function createApp() {
  const app = express();

  // Configure CORS with more permissive settings for development
  const corsOptions = {
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  };
  app.use(cors(corsOptions));
  
  // Note: In Express 5, wildcard '*' paths are not supported by path-to-regexp v6.
  // CORS middleware above will handle preflight automatically; no explicit app.options('*') needed.
  
  // Add middleware to handle JSON parsing errors
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global error handler for JSON parsing errors
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      console.error('Bad JSON request body:', {
        url: req.url,
        method: req.method,
        error: error.message,
        rawBody: req.body
      });
      return res.status(400).json({ 
        message: 'Invalid JSON format in request body',
        error: error.message 
      });
    }
    next();
  });

  // Test route
  app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Test route is working' });
  });
  
  // serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

  // initialize DB connections non-blocking
  connectAndSync()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Databases connected and synced');
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Database connection error:', err.message);
    });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'we-too-api' });
  });

  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.path}`);
    next();
  });

  // Mount API routes (single mounts to avoid duplicates)
  app.use('/api/auth', authRoutes);
  app.use('/api/otp', require('./routes/otp.routes'));
  app.use('/api/requests', require('./routes/requests.routes'));
  app.use('/api/senior-requests', require('./routes/seniorRequests.routes'));
  app.use('/api/chat', require('./routes/chat.routes'));
  app.use('/api/student', require('./routes/student.routes'));
  app.use('/api/senior', require('./routes/senior.routes'));
  // Conditionally mount admin routes for diagnostics
  if (process.env.ENABLE_ADMIN_ROUTES === 'true') {
    app.use('/api/admin', require('./routes/admin.routes'));
  }
  
  // Add donation routes
  app.use('/api/donations', require('./routes/donationRoutes'));

  // Global error handler
  app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  });

  app.use((req, res) => {
    console.log(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ message: 'Not Found', path: req.path });
  });

  return app;
}

module.exports = createApp;