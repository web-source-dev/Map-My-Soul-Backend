#!/usr/bin/env node

/**
 * Generate a secure JWT secret for production use
 * Run this script with: node scripts/generate-secret.js
 */

const crypto = require('crypto');

// Generate a secure random string
const generateSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate and display the secret
const secret = generateSecret();

console.log('='.repeat(60));
console.log('🔐 SECURE JWT SECRET GENERATED');
console.log('='.repeat(60));
console.log('');
console.log('Copy this secret and add it to your .env file:');
console.log('');
console.log(`JWT_SECRET=${secret}`);
console.log('');
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('• Keep this secret secure and never commit it to version control');
console.log('• Use different secrets for development, staging, and production');
console.log('• Store production secrets in a secure environment variable system');
console.log('• Rotate secrets periodically for enhanced security');
console.log('');
console.log('='.repeat(60));
