const mongoose = require('mongoose');

// Audit Log for Security and Compliance (No HIPAA requirements)
const auditLogSchema = new mongoose.Schema({
  // User reference (optional for anonymous actions)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAuth',
    required: false // Allow anonymous actions
  },
  
  // Session information for anonymous actions
  sessionId: {
    type: String,
    required: false // For anonymous quiz sessions
  },
  
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'ACCESS', 'QUIZ_SUBMIT', 'QUIZ_VIEW', 'ANONYMOUS_ACTION']
  },
  
  resource: {
    type: String,
    required: true,
    enum: ['USER_PROFILE', 'QUIZ_DATA', 'ANONYMOUS_QUIZ', 'AUTH', 'PRODUCTS', 'SERVICES', 'PODCASTS']
  },
  
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  
  // Request information
  ipAddress: {
    type: String,
    required: true
  },
  
  userAgent: {
    type: String,
    required: true
  },
  
  // Geographic information (non-personal)
  country: {
    type: String,
    required: false
  },
  
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  success: {
    type: Boolean,
    default: true
  },
  
  errorMessage: {
    type: String,
    default: null
  },
  
  // Performance metrics
  responseTime: {
    type: Number, // in milliseconds
    required: false
  }
  
}, { timestamps: true });

// Index for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ sessionId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Create and export the model
let AuditLogModel = null;

const createAuditLogModel = () => {
    if (!AuditLogModel) {
        const { getUserModel } = require('../config/database');
        AuditLogModel = getUserModel('AuditLog', auditLogSchema);
    }
    return AuditLogModel;
};

module.exports = createAuditLogModel;
