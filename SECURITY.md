# Security Documentation - Map My Soul Backend

## Overview
This document outlines the comprehensive security measures implemented in the Map My Soul backend to ensure data protection both in transit and at rest, while maintaining our anonymous quiz strategy to avoid HIPAA compliance requirements.

## 🔐 Encryption Strategy

### Data at Rest Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits
- **Implementation**: Custom encryption utility with automatic field-level encryption
- **Coverage**: All sensitive data fields in models

### Data in Transit Encryption
- **Protocol**: TLS 1.3 (enforced in production)
- **Certificate**: SSL/TLS certificates required
- **Headers**: Security headers enforced via Helmet.js
- **CORS**: Strict CORS policy with allowed origins

## 🛡️ Security Layers

### 1. Application Security
```javascript
// Security middleware stack
app.use(helmet());           // Basic security headers
app.use(forceHTTPS);         // HTTPS enforcement
app.use(securityHeaders);    // Additional headers
app.use(securityLogger);     // Security event logging
app.use(sanitizeData);       // Input sanitization
app.use(rateLimiting);       // Rate limiting
```

### 2. Database Security
- **Connection**: SSL/TLS encrypted connections
- **Authentication**: MongoDB authentication required
- **Access Control**: Role-based access control
- **Audit Logging**: All database operations logged

### 3. API Security
- **Rate Limiting**: Per-endpoint rate limiting
- **Input Validation**: Joi schema validation
- **Data Sanitization**: XSS and injection prevention
- **CORS**: Strict cross-origin policy

## 📊 Model Security

### UserAuth Model
```javascript
// Encrypted fields
email: { set: encryptData, get: decryptData }
resetToken: { set: encryptData, get: decryptData }
password: { hashed with bcrypt }
```

### AnonymousQuizData Model
```javascript
// Security features
sessionId: { auto-generated secure token }
sessionFingerprint: { encrypted session validation }
```

### AuditLog Model
```javascript
// Security monitoring
userId: { optional for anonymous actions }
sessionId: { for anonymous tracking }
ipAddress: { for security monitoring }
```

## 🔒 Authentication & Authorization

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Verification**: Secure comparison
- **Reset**: Encrypted reset tokens

### Session Security
- **Session ID**: Cryptographically secure
- **Cookies**: HttpOnly, Secure, SameSite
- **Expiration**: Configurable session timeout

### JWT Security
- **Algorithm**: RS256 (asymmetric)
- **Expiration**: Short-lived tokens
- **Refresh**: Secure refresh token rotation

## 🚦 Rate Limiting

### Endpoint-Specific Limits
```javascript
authRateLimiter: 5 attempts per 15 minutes
quizRateLimiter: 10 submissions per minute
generalRateLimiter: 100 requests per 15 minutes
```

### Implementation
- **Storage**: In-memory with Redis option
- **Headers**: Rate limit headers included
- **Bypass**: Health checks excluded

## 🛡️ Input Validation & Sanitization

### Validation
- **Schema**: Joi validation schemas
- **Types**: Type checking for all inputs
- **Sanitization**: XSS and injection prevention

### Sanitization Rules
```javascript
// Remove dangerous characters
.replace(/[<>]/g, '')           // Remove < and >
.replace(/javascript:/gi, '')   // Remove javascript: protocol
.replace(/on\w+=/gi, '')        // Remove event handlers
```

## 🔍 Security Monitoring

### Audit Logging
- **Actions**: All CRUD operations logged
- **Metadata**: IP, user agent, timestamp
- **Performance**: Response time tracking
- **Errors**: Security event logging

### Security Events
- **Failed Logins**: Multiple failed attempts
- **Rate Limit Exceeded**: Too many requests
- **Invalid Sessions**: Session tampering
- **Data Access**: Unauthorized access attempts

## 🌐 Network Security

### HTTPS Enforcement
```javascript
// Production HTTPS enforcement
if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
  return res.redirect(`https://${req.get('host')}${req.url}`);
}
```

### Security Headers
```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: strict policy
Referrer-Policy: strict-origin-when-cross-origin
```

## 🔧 Environment Security

### Environment Variables
```bash
# Required security variables
ENCRYPTION_KEY=your-256-bit-encryption-key
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
API_KEY=your-api-key

# Production settings
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
```

### Key Management
- **Generation**: Secure key generation script
- **Rotation**: Regular key rotation policy
- **Storage**: Environment-specific keys
- **Backup**: Secure key backup procedures

## 🚨 Incident Response

### Security Events
1. **Data Breach**: Immediate encryption key rotation
2. **Unauthorized Access**: Session invalidation
3. **Rate Limit Abuse**: IP blocking
4. **Malicious Input**: Request rejection

### Response Procedures
1. **Detection**: Automated security monitoring
2. **Assessment**: Impact analysis
3. **Containment**: Immediate security measures
4. **Recovery**: System restoration
5. **Post-Incident**: Security review

## 📋 Security Checklist

### Development
- [ ] All dependencies updated
- [ ] Security audit completed
- [ ] Input validation implemented
- [ ] Error handling secure
- [ ] Logging configured

### Production
- [ ] HTTPS enabled
- [ ] Security headers set
- [ ] Rate limiting configured
- [ ] Monitoring active
- [ ] Backup procedures tested
- [ ] Incident response plan ready

### Maintenance
- [ ] Regular security updates
- [ ] Key rotation schedule
- [ ] Audit log review
- [ ] Penetration testing
- [ ] Security training

## 🔐 Anonymous Quiz Security

### Data Protection
- **No User References**: Complete anonymity
- **Session-Based**: Temporary session IDs
- **No PHI**: No personal health information
- **Encrypted Storage**: All data encrypted at rest

### Session Security
- **Secure Generation**: Cryptographically secure IDs
- **Fingerprinting**: Session integrity validation
- **Expiration**: Automatic session cleanup
- **Isolation**: No cross-session data access

## 📞 Security Contact

For security issues or questions:
- **Email**: security@mapmysoul.com
- **Response Time**: 24 hours
- **Disclosure**: Responsible disclosure policy

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practices-security.html)
