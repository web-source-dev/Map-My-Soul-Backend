const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_ROUNDS = 12;

// Get encryption key from environment or generate one
const getEncryptionKey = () => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length >= ENCRYPTION_KEY_LENGTH) {
    return Buffer.from(envKey, 'hex');
  }
  
  // Generate a new key if none exists (for development)
  const key = crypto.randomBytes(ENCRYPTION_KEY_LENGTH);
  console.warn('⚠️  No ENCRYPTION_KEY found in environment. Generated temporary key for development.');
  return key;
};

// Encrypt sensitive data
const encryptData = (data) => {
  try {
    if (!data || typeof data !== 'string') {
      return data;
    }

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Use createCipheriv instead of deprecated createCipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag
    const encryptedData = iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
    
    return encryptedData;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt sensitive data
const decryptData = (encryptedData) => {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return encryptedData;
    }

    // Check if data is already encrypted (has the format iv:data:authTag)
    if (!encryptedData.includes(':')) {
      return encryptedData; // Not encrypted
    }

    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      return encryptedData; // Invalid format, return as-is
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    // Use createDecipheriv instead of deprecated createDecipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Hash passwords securely
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

// Verify password hash
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    throw new Error('Failed to verify password');
  }
};

// Encrypt object fields selectively
const encryptObjectFields = (obj, fieldsToEncrypt) => {
  const encrypted = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encryptData(encrypted[field]);
    }
  }
  
  return encrypted;
};

// Decrypt object fields selectively
const decryptObjectFields = (obj, fieldsToDecrypt) => {
  const decrypted = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decryptData(decrypted[field]);
    }
  }
  
  return decrypted;
};

// Generate secure random tokens
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash sensitive data for comparison (one-way)
const hashSensitiveData = (data) => {
  if (!data) return null;
  return crypto.createHash('sha256').update(data.toString()).digest('hex');
};

// Encrypt session data
const encryptSessionData = (sessionData) => {
  const dataString = JSON.stringify(sessionData);
  return encryptData(dataString);
};

// Decrypt session data
const decryptSessionData = (encryptedSessionData) => {
  const decryptedString = decryptData(encryptedSessionData);
  return JSON.parse(decryptedString);
};

module.exports = {
  encryptData,
  decryptData,
  hashPassword,
  verifyPassword,
  encryptObjectFields,
  decryptObjectFields,
  generateSecureToken,
  hashSensitiveData,
  encryptSessionData,
  decryptSessionData,
  ENCRYPTION_ALGORITHM,
  ENCRYPTION_KEY_LENGTH
};
