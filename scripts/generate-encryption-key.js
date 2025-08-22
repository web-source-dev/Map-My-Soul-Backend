const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate encryption key
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate JWT secret
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate session secret
const generateSessionSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate API key
const generateAPIKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Main function
const main = () => {
  console.log('🔐 Generating secure keys for Map My Soul Backend...\n');

  const keys = {
    ENCRYPTION_KEY: generateEncryptionKey(),
    JWT_SECRET: generateJWTSecret(),
    SESSION_SECRET: generateSessionSecret(),
    API_KEY: generateAPIKey()
  };

  // Display keys
  console.log('Generated Keys:');
  console.log('==============');
  Object.entries(keys).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  // Create .env.example file
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  const envExampleContent = `# Map My Soul Backend Environment Variables
# Copy this file to .env and fill in your values

# Database
MONGODB_URI=mongodb://localhost:27017/map-my-soul

# Security Keys (Generate using: npm run generate-key)
ENCRYPTION_KEY=${keys.ENCRYPTION_KEY}
JWT_SECRET=${keys.JWT_SECRET}
SESSION_SECRET=${keys.SESSION_SECRET}
API_KEY=${keys.API_KEY}

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_MAX_AGE=86400000
SESSION_SECURE=false

# Logging
LOG_LEVEL=info
`;

  try {
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log('\n✅ Created .env.example file');
  } catch (error) {
    console.error('❌ Failed to create .env.example file:', error.message);
  }

  // Security recommendations
  console.log('\n🔒 Security Recommendations:');
  console.log('============================');
  console.log('1. Store these keys securely in your .env file');
  console.log('2. Never commit .env file to version control');
  console.log('3. Use different keys for each environment (dev/staging/prod)');
  console.log('4. Rotate keys regularly in production');
  console.log('5. Use environment-specific encryption keys');
  console.log('6. Enable HTTPS in production');
  console.log('7. Set up proper firewall rules');
  console.log('8. Monitor for security events');

  // Production checklist
  console.log('\n🚀 Production Deployment Checklist:');
  console.log('===================================');
  console.log('□ Set NODE_ENV=production');
  console.log('□ Use HTTPS only');
  console.log('□ Set up SSL certificates');
  console.log('□ Configure proper CORS origins');
  console.log('□ Set up monitoring and logging');
  console.log('□ Configure rate limiting');
  console.log('□ Set up backup and recovery');
  console.log('□ Enable security headers');
  console.log('□ Set up intrusion detection');
  console.log('□ Configure firewall rules');

  console.log('\n✨ Key generation complete!');
  console.log('📝 Next steps:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Update .env with your specific values');
  console.log('   3. Install dependencies: npm install');
  console.log('   4. Start the server: npm run dev');
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateEncryptionKey,
  generateJWTSecret,
  generateSessionSecret,
  generateAPIKey
};
