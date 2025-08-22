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
    
}, { 
    timestamps: true,
    // Ensure no PHI is stored
    strict: true
});

// Indexes for performance
userProfileSchema.index({ userId: 1 });
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
