const crypto = require('crypto');

// Security middleware for data protection in transit and at rest

// Force HTTPS in production
const forceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Check if request is secure (HTTPS)
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.get('host')}${req.url}`);
    }
  }
  next();
};

// Add security headers
const securityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none';"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  
  next();
};

// Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max, // Limit each IP to max requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Key generator for rate limiting
    keyGenerator: (req) => {
      // Use IP address for rate limiting
      return req.ip || req.connection.remoteAddress;
    },
    // Skip rate limiting for certain conditions
    skip: (req) => {
      // Skip for health checks
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

// Specific rate limiters
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 50); // 50 attempts per 15 minutes for auth endpoints
const quizRateLimiter = createRateLimiter(60 * 1000, 10); // 10 quiz submissions per minute
const generalRateLimiter = createRateLimiter(15 * 60 * 1000, 200); // 200 requests per 15 minutes for general API
const cartWishlistRateLimiter = createRateLimiter(60 * 1000, 30); // 30 cart/wishlist operations per minute

// Data sanitization middleware
const sanitizeData = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  next();
};

// Recursively sanitize object properties
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remove potentially dangerous characters
      obj[key] = obj[key]
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

// Request validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Request validation error',
        message: error.message
      });
    }
  };
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com', // Replace with your domain
      'https://www.yourdomain.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  };
  
  // Log response details
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      responseTime,
      responseSize: res.get('Content-Length')
    };
    
    // Log security-relevant events
    if (res.statusCode >= 400) {
      console.warn('Security Event:', responseLog);
    }
  });
  
  next();
};

// Session security middleware
const sessionSecurity = (req, res, next) => {
  // Generate secure session ID if not exists
  if (!req.sessionID) {
    req.sessionID = crypto.randomBytes(32).toString('hex');
  }
  
  // Set secure session options
  if (req.session) {
    req.session.cookie.secure = process.env.NODE_ENV === 'production';
    req.session.cookie.httpOnly = true;
    req.session.cookie.sameSite = 'strict';
  }
  
  next();
};

module.exports = {
  forceHTTPS,
  securityHeaders,
  authRateLimiter,
  quizRateLimiter,
  generalRateLimiter,
  cartWishlistRateLimiter,
  sanitizeData,
  validateRequest,
  corsOptions,
  securityLogger,
  sessionSecurity
};
