const mongoose = require('mongoose');
const { encryptData, decryptData, hashPassword, verifyPassword } = require('../utils/encryption');

const userAuthSchema = new mongoose.Schema({
    // Email (stored in plain text for authentication efficiency)
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    
    // Password (hashed, not encrypted)
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters long'],
        validate: {
            validator: function(v) {
                return v && v.length >= 6;
            },
            message: 'Password must be at least 6 characters long'
        }
    },
    
    // User role
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    
    // Account status
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Password reset functionality
    resetToken: {
        type: String,
        default: null,
        set: function(token) {
            // Encrypt reset tokens
            return token ? encryptData(token) : null;
        },
        get: function(encryptedToken) {
            // Decrypt reset tokens
            return encryptedToken ? decryptData(encryptedToken) : null;
        }
    },
    resetTokenExpires: {
        type: Date,
        default: null
    },
    
    // Minimal activity tracking (non-PHI)
    lastLoginAt: {
        type: Date,
        default: Date.now
    },
    loginCount: {
        type: Number,
        default: 0
    },
    
    // Security features
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLockedUntil: {
        type: Date,
        default: null
    }
    
}, { 
    timestamps: true,
    // Ensure no PHI is stored
    strict: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Pre-save middleware to hash password
userAuthSchema.pre('save', async function(next) {
    try {
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified('password')) return next();
        
        // Hash the password
        this.password = await hashPassword(this.password);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to verify password
userAuthSchema.methods.verifyPassword = async function(candidatePassword) {
    return await verifyPassword(candidatePassword, this.password);
};

// Instance method to update password
userAuthSchema.methods.updatePassword = async function(newPassword) {
    this.password = await hashPassword(newPassword);
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    return await this.save();
};

// Static method to find user by email (plain text search)
userAuthSchema.statics.findByEmail = async function(email) {
    try {
        return await this.findOne({ email: email.toLowerCase() });
    } catch (error) {
        console.error('Error in findByEmail:', error);
        return null;
    }
};

// Static method to check if email exists (for registration)
userAuthSchema.statics.emailExists = async function(email) {
    try {
        const user = await this.findOne({ email: email.toLowerCase() });
        return !!user;
    } catch (error) {
        console.error('Error in emailExists:', error);
        return false;
    }
};

// Index for performance
userAuthSchema.index({ email: 1 });
userAuthSchema.index({ role: 1 });
userAuthSchema.index({ isActive: 1 });
userAuthSchema.index({ isVerified: 1 });

// Create and export the model with all static methods
let UserAuthModel = null;

const createUserAuthModel = () => {
    if (!UserAuthModel) {
        const { getUserModel } = require('../config/database');
        UserAuthModel = getUserModel('UserAuth', userAuthSchema);
    }
    return UserAuthModel;
};

module.exports = createUserAuthModel;
