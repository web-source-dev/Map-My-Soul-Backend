const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Service details
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    servicePrice: {
        type: Number,
        required: true
    },
    serviceProviderName: {
        type: String,
        required: true
    },
    serviceProviderEmail: {
        type: String,
        required: true
    },
    
    // Customer details
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAuth',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: false
    },
    
    // Booking details
    bookingDate: {
        type: Date,
        required: true
    },
    bookingTime: {
        type: String,
        required: true
    },
    sessionDuration: {
        type: Number, // in minutes
        default: 60
    },
    
    // Session details
    sessionType: {
        type: String,
        enum: ['video', 'audio', 'in_person'],
        default: 'video'
    },
    sessionPlatform: {
        type: String,
        default: 'Zoom'
    },
    
    // Special requests
    specialRequests: {
        type: String,
        maxlength: 500
    },
    
    // Booking status
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    // Payment status (for future implementation)
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    
    // Timestamps
    confirmedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: String,
        enum: ['customer', 'practitioner', 'system']
    },
    cancellationReason: {
        type: String,
        maxlength: 200
    }
    
}, { 
    timestamps: true 
});

// Indexes for performance
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ serviceId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ serviceProviderEmail: 1 });

// Create and export the model
let BookingModel = null;

const createBookingModel = () => {
    if (!BookingModel) {
        const { getUserModel } = require('../config/database');
        BookingModel = getUserModel('Booking', bookingSchema);
    }
    return BookingModel;
};

module.exports = createBookingModel;
