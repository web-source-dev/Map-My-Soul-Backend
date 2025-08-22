const mongoose = require('mongoose');
const { encryptData, decryptData, generateSecureToken } = require('../utils/encryption');

// Anonymous Quiz Data (No HIPAA requirements - no user references)
const anonymousQuizDataSchema = new mongoose.Schema({
    // Anonymous session ID (not linked to user)
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        default: function() {
            // Generate secure session ID
            return generateSecureToken(64);
        }
    },
    
    // Quiz responses (completely anonymous)
    quizResponses: {
        energyType: {
            type: String,
            enum: ['generator', 'manifestor', 'projector', 'reflector', 'unknown']
        },
        balanceActivities: [{
            type: String,
            enum: ['meditation', 'exercise', 'creative', 'social', 'nature', 'energy_work']
        }],
        budgetPreference: {
            type: String,
            enum: ['under_50', '50_100', '100_200', '200_plus']
        },
        timeAvailability: {
            type: String,
            enum: ['less_1_hour', '1_2_hours', '3_5_hours', '5_plus_hours']
        },
        sessionPreference: {
            type: String,
            enum: ['in_person', 'online', 'either']
        },
        practitionerInterest: {
            type: String,
            enum: ['energy_healer', 'mind_body', 'talk_therapy', 'bodywork', 'spiritual_guide']
        },
        productInterest: {
            type: Boolean,
            default: false
        },
        currentChallenge: {
            type: String,
            enum: ['anxiety', 'stress_management', 'trauma_recovery', 'emotional_balance', 'spiritual_growth', 'physical_health']
        }
    },
    
    // Generated recommendations (non-PHI)
    recommendations: {
        services: [{
            serviceId: String,
            name: String,
            category: String,
            price: Number,
            description: String,
            practitionerType: String
        }],
        products: [{
            productId: String,
            name: String,
            category: String,
            price: Number,
            description: String
        }],
        podcast: [{
            podcastId: String,
            title: String,
            episode: String,
            description: String,
            link: String,
            image: String
        }]
    },
    
    // Calculated insights (non-PHI)
    insights: {
        wellnessProfile: {
            type: String,
            enum: ['stress_focused', 'trauma_informed', 'spiritual_seeker', 'energy_balanced', 'mind_body_integrated']
        },
        recommendedApproach: {
            type: String,
            enum: ['gentle_healing', 'active_engagement', 'mindful_practice', 'energy_work', 'holistic_integration']
        },
        priorityAreas: [{
            area: String,
            priority: Number
        }]
    },
    
    // Session metadata (no personal info)
    sessionMetadata: {
        quizVersion: {
            type: String,
            default: '1.0'
        },
        completionTime: {
            type: Number, // in seconds
            default: 0
        },
        deviceType: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet']
        },
        browserType: String,
        ipCountry: String, // Only country, not specific location
        timestamp: {
            type: Date,
            default: Date.now
        },
        // Encrypted session fingerprint for security
        sessionFingerprint: {
            type: String,
            set: function(fingerprint) {
                return fingerprint ? encryptData(fingerprint) : null;
            },
            get: function(encryptedFingerprint) {
                return encryptedFingerprint ? decryptData(encryptedFingerprint) : null;
            }
        }
    },
    
    // Analytics data (completely anonymous)
    analytics: {
        timeSpentOnEachQuestion: [{
            questionId: String,
            timeSpent: Number
        }],
        questionsSkipped: [String],
        totalQuestionsAnswered: {
            type: Number,
            default: 0
        }
    }
    
}, { 
    timestamps: true,
    // Ensure no PHI is stored
    strict: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Pre-save middleware to ensure session security
anonymousQuizDataSchema.pre('save', function(next) {
    try {
        // Generate session fingerprint if not exists
        if (!this.sessionMetadata.sessionFingerprint) {
            const fingerprint = this.generateSessionFingerprint();
            this.sessionMetadata.sessionFingerprint = fingerprint;
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to generate session fingerprint
anonymousQuizDataSchema.methods.generateSessionFingerprint = function() {
    const data = {
        deviceType: this.sessionMetadata.deviceType,
        browserType: this.sessionMetadata.browserType,
        ipCountry: this.sessionMetadata.ipCountry,
        timestamp: this.sessionMetadata.timestamp
    };
    return JSON.stringify(data);
};

// Instance method to validate session integrity
anonymousQuizDataSchema.methods.validateSession = function(clientFingerprint) {
    const storedFingerprint = this.sessionMetadata.sessionFingerprint;
    return storedFingerprint === clientFingerprint;
};

// Static method to find by session ID with validation
anonymousQuizDataSchema.statics.findBySessionId = async function(sessionId) {
    return await this.findOne({ sessionId });
};

// Index for analytics queries (no personal data)
anonymousQuizDataSchema.index({ 'sessionMetadata.timestamp': -1 });
anonymousQuizDataSchema.index({ 'quizResponses.currentChallenge': 1 });
anonymousQuizDataSchema.index({ 'insights.wellnessProfile': 1 });
anonymousQuizDataSchema.index({ 'sessionMetadata.deviceType': 1 });
anonymousQuizDataSchema.index({ 'sessionMetadata.ipCountry': 1 });

// Create and export the model
let AnonymousQuizDataModel = null;

const createAnonymousQuizDataModel = () => {
    if (!AnonymousQuizDataModel) {
        const { getServicesModel } = require('../config/database');
        AnonymousQuizDataModel = getServicesModel('AnonymousQuizData', anonymousQuizDataSchema);
    }
    return AnonymousQuizDataModel;
};

module.exports = createAnonymousQuizDataModel;
