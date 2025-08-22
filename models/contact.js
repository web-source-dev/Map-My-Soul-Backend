const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    // Contact information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    
    // Contact type/category
    contactType: {
        type: String,
        enum: ['general', 'support', 'feedback', 'partnership', 'other'],
        default: 'general'
    },
    
    // Priority level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['new', 'in_progress', 'responded', 'resolved', 'closed'],
        default: 'new'
    },
    
    // Response tracking
    respondedAt: {
        type: Date,
        default: null
    },
    
    responseMessage: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    
    // User information (if authenticated)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAuth',
        default: null
    },
    
    // Device/request information
    ipAddress: {
        type: String,
        default: null
    },
    
    userAgent: {
        type: String,
        default: null
    },
    
    // Additional metadata
    tags: [{
        type: String,
        trim: true
    }],
    
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    }
    
}, { 
    timestamps: true,
    strict: true
});

// Indexes for performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ contactType: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ userId: 1 });

// Static method to get contact statistics
contactSchema.statics.getStats = async function() {
    try {
        const stats = await this.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
                }
            }
        ]);
        
        return stats[0] || { total: 0, new: 0, inProgress: 0, resolved: 0 };
    } catch (error) {
        console.error('Error getting contact stats:', error);
        return { total: 0, new: 0, inProgress: 0, resolved: 0 };
    }
};

// Instance method to mark as responded
contactSchema.methods.markAsResponded = async function(responseMessage) {
    this.status = 'responded';
    this.respondedAt = new Date();
    this.responseMessage = responseMessage;
    return await this.save();
};

// Create and export the model
let ContactModel = null;

const createContactModel = () => {
    if (!ContactModel) {
        const { getUserModel } = require('../config/database');
        ContactModel = getUserModel('Contact', contactSchema);
    }
    return ContactModel;
};

module.exports = createContactModel;
