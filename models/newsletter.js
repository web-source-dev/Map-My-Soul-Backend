const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    // Email address (required and unique)
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
    
    // Subscription status
    isSubscribed: {
        type: Boolean,
        default: true
    },
    
    // User information (if authenticated)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAuth',
        default: null
    },
    
    // Subscription tracking
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    
    unsubscribedAt: {
        type: Date,
        default: null
    },
    
    // Source tracking
    source: {
        type: String,
        enum: ['popup', 'footer', 'homepage', 'manual', 'other'],
        default: 'popup'
    },
}, { 
    timestamps: true,
    strict: true
});

// Indexes for performance
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ isSubscribed: 1 });
newsletterSchema.index({ subscribedAt: -1 });
newsletterSchema.index({ userId: 1 });
newsletterSchema.index({ source: 1 });


// Static method to check if email is subscribed
newsletterSchema.statics.isEmailSubscribed = async function(email) {
    try {
        const subscriber = await this.findOne({ 
            email: email.toLowerCase(),
            isSubscribed: true 
        });
        return !!subscriber;
    } catch (error) {
        console.error('Error checking email subscription:', error);
        return false;
    }
};

// Instance method to unsubscribe
newsletterSchema.methods.unsubscribe = async function() {
    this.isSubscribed = false;
    this.unsubscribedAt = new Date();
    return await this.save();
};


// Create and export the model
let NewsletterModel = null;

const createNewsletterModel = () => {
    if (!NewsletterModel) {
        const { getUserModel } = require('../config/database');
        NewsletterModel = getUserModel('Newsletter', newsletterSchema);
    }
    return NewsletterModel;
};

module.exports = createNewsletterModel;
