const mongoose = require('mongoose');

// Non-PHI User Profile (No HIPAA requirements - preferences only)
const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAuth',
        required: true,
        unique: true
    },
    
    // Display information (non-PHI)
    displayName: {
        type: String,
        trim: true,
        maxlength: 50
    },
    avatar: {
        type: String,
        default: null
    },
    
    // User preferences (non-PHI)
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        },
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'es', 'fr', 'de']
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    
    // Wellness preferences (non-PHI)
    wellnessGoals: [{
        type: String,
        enum: ['stress_reduction', 'better_sleep', 'energy_boost', 'emotional_balance', 'spiritual_growth', 'physical_health', 'mindfulness', 'creativity']
    }],
    
    // Service preferences (non-PHI)
    favoritePractitioners: [{
        practitionerId: String,
        name: String,
        specialty: String,
        rating: Number
    }],
    
    savedServices: [{
        serviceId: String,
        name: String,
        category: String,
        savedAt: { type: Date, default: Date.now }
    }],
    
    // Activity history (non-PHI)
    activityHistory: [{
        action: {
            type: String,
            enum: ['quiz_completed', 'service_viewed', 'product_viewed', 'podcast_listened', 'profile_updated', 'login', 'logout', 'cart_added', 'wishlist_added']
        },
        timestamp: { type: Date, default: Date.now },
        details: mongoose.Schema.Types.Mixed
    }],
    
    // Cart and Wishlist functionality
    cart: [{
        productId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        imageUrl: {
            type: String,
            default: null
        },
        quantity: {
            type: Number,
            default: 1,
            min: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    wishlist: [{
        productId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        imageUrl: {
            type: String,
            default: null
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Marketing preferences (GDPR compliant)
    marketingConsent: {
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        thirdParty: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now }
    },
    
    // Account settings
    accountSettings: {
        twoFactorEnabled: { type: Boolean, default: false },
        privacyLevel: {
            type: String,
            enum: ['public', 'friends', 'private'],
            default: 'private'
        }
    }
    
}, { 
    timestamps: true,
    // Ensure no PHI is stored
    strict: true
});

// Indexes for performance
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ 'preferences.theme': 1 });
userProfileSchema.index({ 'wellnessGoals': 1 });
userProfileSchema.index({ 'activityHistory.timestamp': -1 });

// Create and export the model
let UserProfileModel = null;

const createUserProfileModel = () => {
    if (!UserProfileModel) {
        const { getUserModel } = require('../config/database');
        UserProfileModel = getUserModel('UserProfile', userProfileSchema);
    }
    return UserProfileModel;
};

module.exports = createUserProfileModel;
