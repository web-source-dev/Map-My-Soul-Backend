# Map My Soul Backend Architecture

## Overview
This document outlines the complete dual-database architecture with comprehensive security, encryption, and anonymous quiz strategy implementation.

## 🏗️ System Architecture

### Dual Database Setup
```
┌─────────────────────────────────────────────────────────────┐
│                    Map My Soul Backend                      │
├─────────────────────────────────────────────────────────────┤
│  Security Layer                                             │
│  ├── HTTPS Enforcement                                      │
│  ├── Rate Limiting                                          │
│  ├── Input Sanitization                                     │
│  ├── Security Headers                                       │
│  └── Audit Logging                                          │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                          │
│  ├── Authentication Routes                                  │
│  ├── Anonymous Quiz Routes                                  │
│  ├── Business Routes                                        │
│  └── Security Routes                                        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │   Database 1        │  │       Database 2            │   │
│  │   (User Data)       │  │     (Business Data)         │   │
│  │                     │  │                             │   │
│  │ • UserAuth          │  │ • Product                   │   │
│  │ • UserProfile       │  │ • Service                   │   │
│  │ • AnonymousQuizData │  │ • Podcast                   │   │
│  │ • AuditLog          │  │                             │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Architecture

### Database 1: User Data Database
**Purpose**: User authentication, profiles, anonymous quiz data, and security logs

**Collections**:
- **UserAuth**: Encrypted user authentication data
- **UserProfile**: User preferences and non-PHI profile data
- **AnonymousQuizData**: Completely anonymous quiz responses
- **AuditLog**: Security and compliance audit logs

**Security Features**:
- ✅ AES-256-GCM encryption for sensitive fields
- ✅ Password hashing with bcrypt
- ✅ Session fingerprinting
- ✅ No PHI storage (HIPAA avoidance)

### Database 2: Business Data Database
**Purpose**: Business content, products, services, and catalog data

**Collections**:
- **Product**: Product catalog and inventory
- **Service**: Service offerings and practitioners
- **Podcast**: Podcast content and episodes

**Security Features**:
- ✅ Standard business data security
- ✅ No user references
- ✅ Public catalog data

## 🔐 Security Implementation

### Data Encryption
```javascript
// AES-256-GCM encryption for sensitive data
const encryptData = (data) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', key);
  // ... encryption logic
};
```

### Model Security
```javascript
// UserAuth Model - Encrypted fields
email: {
  set: function(email) { return encryptData(email); },
  get: function(encryptedEmail) { return decryptData(encryptedEmail); }
}

// AnonymousQuizData Model - Session security
sessionId: { default: () => generateSecureToken(64) }
sessionFingerprint: { encrypted session validation }
```

### Security Middleware Stack
```javascript
app.use(helmet());           // Security headers
app.use(forceHTTPS);         // HTTPS enforcement
app.use(securityHeaders);    // Additional protection
app.use(securityLogger);     // Security monitoring
app.use(sanitizeData);       // Input sanitization
app.use(rateLimiting);       // Rate limiting
```

## 🛡️ Anonymous Quiz Strategy

### Complete Anonymity
- **No User References**: Quiz data stored without any user links
- **Session-Based**: Temporary session IDs for result retrieval
- **No PHI**: No personal health information collected
- **HIPAA Avoidance**: Complete compliance bypass

### Data Flow
```
1. User takes quiz → Creates anonymous session
2. Quiz responses stored with session ID only
3. Results retrieved using session ID
4. No user-quiz connection maintained
5. Analytics on anonymous data only
```

## 📁 File Structure & Alignment

### Configuration Files
```
backend/
├── config/
│   └── database.js          # Dual database configuration
├── models/
│   ├── userAuth.js          # Database 1 - Authentication
│   ├── userProfile.js       # Database 1 - User preferences
│   ├── anonymousQuizData.js # Database 1 - Anonymous quiz
│   ├── auditLog.js          # Database 1 - Security logs
│   ├── products.js          # Database 2 - Product catalog
│   ├── services.js          # Database 2 - Service offerings
│   └── podcast.js           # Database 2 - Podcast content
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── quiz.js              # Anonymous quiz routes
│   └── privacy.js           # Privacy management routes
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── security.js          # Security middleware
│   └── audit.js             # Audit logging middleware
├── utils/
│   ├── encryption.js        # Data encryption utilities
│   ├── sessionManager.js    # Anonymous session management
│   ├── quizProcessor.js     # Quiz data processing
│   ├── token.js             # JWT token utilities
│   ├── email.js             # Email utilities
│   └── dataRetention.js     # Data retention utilities
└── scripts/
    └── generate-encryption-key.js # Security key generation
```

## 🔄 Data Flow Examples

### User Registration Flow
```
1. POST /api/auth/register
   ↓
2. Create UserAuth (Database 1) - Encrypted email/password
   ↓
3. Create UserProfile (Database 1) - Non-PHI preferences
   ↓
4. Generate JWT token
   ↓
5. Return user data (no PHI)
```

### Anonymous Quiz Flow
```
1. POST /api/quiz/submit
   ↓
2. Generate secure session ID
   ↓
3. Store AnonymousQuizData (Database 1) - No user reference
   ↓
4. Return session ID and results
   ↓
5. User retrieves results via session ID
```

### Business Data Flow
```
1. GET /api/products
   ↓
2. Query Product collection (Database 2)
   ↓
3. Return public catalog data
   ↓
4. No user authentication required
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Database Configuration
MONGODB_URI_1=mongodb://localhost:27017/mapmysoul_users
MONGODB_URI_2=mongodb://localhost:27017/mapmysoul_business

# Security Keys
ENCRYPTION_KEY=your-256-bit-encryption-key
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
API_KEY=your-api-key

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## 🚀 API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/reset-password` - Password reset confirmation
- `GET /api/auth/verify` - Token verification
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Anonymous Quiz Endpoints
- `POST /api/quiz/submit` - Submit anonymous quiz
- `GET /api/quiz/results/:sessionId` - Get quiz results
- `GET /api/quiz/analytics` - Get anonymous analytics
- `GET /api/quiz/health` - Quiz service health check

### System Endpoints
- `GET /health` - System health check
- `GET /api/security/status` - Security status
- `GET /api/database/status` - Database status

## 🔍 Monitoring & Health Checks

### Health Check Response
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "databases": {
    "db1": { "status": "connected", "readyState": 1 },
    "db2": { "status": "connected", "readyState": 1 }
  },
  "uptime": 3600
}
```

### Security Status Response
```json
{
  "https": false,
  "encryption": {
    "algorithm": "AES-256-GCM",
    "keyLength": 256,
    "status": "enabled"
  },
  "rateLimiting": "enabled",
  "cors": "configured",
  "securityHeaders": "enabled",
  "dualDatabase": "enabled"
}
```

## 🛡️ Security Features Summary

### Data Protection
- ✅ **AES-256-GCM encryption** for sensitive data
- ✅ **Password hashing** with bcrypt (12 rounds)
- ✅ **JWT tokens** for authentication
- ✅ **Session fingerprinting** for integrity
- ✅ **Rate limiting** on all endpoints
- ✅ **Input sanitization** and validation
- ✅ **Security headers** (Helmet.js)
- ✅ **HTTPS enforcement** in production
- ✅ **CORS protection** with allowed origins

### HIPAA Compliance Strategy
- ✅ **Complete anonymity** for quiz data
- ✅ **No PHI collection** or storage
- ✅ **No user-quiz bridges** maintained
- ✅ **Session-based** data retrieval
- ✅ **Audit logging** for security monitoring
- ✅ **Data separation** across databases

## 🚀 Deployment Checklist

### Development Setup
- [x] Dual database configuration
- [x] Security key generation
- [x] Environment variables configured
- [x] All dependencies installed
- [x] Models properly aligned
- [x] Routes configured
- [x] Middleware stack implemented
- [x] Encryption utilities working
- [x] Health checks functional

### Production Deployment
- [ ] Set NODE_ENV=production
- [ ] Configure production database URIs
- [ ] Set up SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures
- [ ] Set up intrusion detection
- [ ] Configure firewall rules

## 📞 Support & Maintenance

### Key Files for Maintenance
- `config/database.js` - Database configuration
- `utils/encryption.js` - Encryption utilities
- `middleware/security.js` - Security middleware
- `models/` - All data models
- `routes/` - All API routes
- `scripts/generate-encryption-key.js` - Key generation

### Monitoring Endpoints
- `/health` - Overall system health
- `/api/security/status` - Security status
- `/api/database/status` - Database status
- `/api/quiz/health` - Quiz service health

This architecture provides a robust, secure, and HIPAA-compliant solution for the Map My Soul wellness application while maintaining complete anonymity for quiz data.
