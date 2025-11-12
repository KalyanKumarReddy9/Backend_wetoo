// Rate limiting middleware for API endpoints
// Prevents abuse by limiting the number of requests from a single IP

const rateLimit = require('express-rate-limit');

// Check if we're in test environment
const isTestEnv = process.env.NODE_ENV === 'test';

// No-op middleware for test environment
const noopMiddleware = (req, res, next) => next();

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = isTestEnv ? noopMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth endpoints rate limiter (5 requests per 15 minutes) - stricter
const authLimiter = isTestEnv ? noopMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP endpoints rate limiter (3 requests per hour) - very strict
const otpLimiter = isTestEnv ? noopMiddleware : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 OTP requests per hour
  message: 'Too many OTP requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload endpoints rate limiter (10 uploads per hour)
const uploadLimiter = isTestEnv ? noopMiddleware : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: 'Too many upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
  uploadLimiter,
};
