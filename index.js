const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
const { connectDatabase, closeConnections } = require('./config/database');

// Import security middleware
const {
  forceHTTPS,
  securityHeaders,
  authRateLimiter,
  quizRateLimiter,
  generalRateLimiter,
  cartWishlistRateLimiter,
  sanitizeData,
  corsOptions,
  securityLogger,
  sessionSecurity
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const servicesRoutes = require('./routes/services');
const productsRoutes = require('./routes/products');
const podcastsRoutes = require('./routes/podcasts');
const bookingsRoutes = require('./routes/bookings');

const app = express();

// Security middleware (order matters!)
app.use(helmet()); // Basic security headers
app.use(forceHTTPS); // Force HTTPS in production
app.use(securityHeaders); // Additional security headers
app.use(securityLogger); // Security event logging

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf; // Store raw body for signature verification if needed
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Data sanitization
app.use(sanitizeData);

// Compression middleware
app.use(compression());

// Session security
app.use(sessionSecurity);

// Rate limiting
app.use('/api/auth/login', authRateLimiter); // Stricter rate limiting for login/register
app.use('/api/auth/register', authRateLimiter); // Stricter rate limiting for login/register
app.use('/api/auth/forgot-password', authRateLimiter); // Stricter rate limiting for password reset
app.use('/api/auth/reset-password', authRateLimiter); // Stricter rate limiting for password reset
app.use('/api/auth/cart', cartWishlistRateLimiter); // Rate limiting for cart operations
app.use('/api/auth/wishlist', cartWishlistRateLimiter); // Rate limiting for wishlist operations
app.use('/api/quiz', quizRateLimiter); // Rate limiting for quiz submissions
app.use('/api', generalRateLimiter); // General rate limiting for all API routes

// Routes with security middleware
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/podcasts', podcastsRoutes);
app.use('/api/bookings', bookingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Security endpoint for checking encryption status
app.get('/api/security/status', (req, res) => {
  res.json({
    https: req.secure || req.get('x-forwarded-proto') === 'https',
    encryption: {
      algorithm: 'AES-256-GCM',
      keyLength: 256,
      status: 'enabled'
    },
    rateLimiting: 'enabled',
    cors: 'configured',
    securityHeaders: 'enabled',
  });
});

// Database status endpoint
app.get('/api/database/status', (req, res) => {
  const { getUserDbConnection, getServicesDbConnection } = require('./config/database');
  
  try {
    const userDb = getUserDbConnection();
    const servicesDb = getServicesDbConnection();
    
    res.json({
      status: 'connected',
      databases: {
        user_db: {
          status: userDb.readyState === 1 ? 'connected' : 'disconnected',
          collections: ['userauths', 'userprofiles', 'auditlogs']
        },
        services_db: {
          status: servicesDb.readyState === 1 ? 'connected' : 'disconnected',
          collections: ['services', 'products', 'podcasts', 'anonymousquizdata']
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Don't leak error details in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    error: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  await closeConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  await closeConnections();
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🗄️  Database setup:`);
      console.log(`   - User Database: connected`);
      console.log(`   - Services Database: connected`);
      console.log(`🔒 Security features enabled:`);
      console.log(`   - HTTPS enforcement: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'development'}`);
      console.log(`   - Data encryption: enabled`);
      console.log(`   - Rate limiting: enabled`);
      console.log(`   - CORS: configured`);
      console.log(`   - Security headers: enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer().catch(console.error);
