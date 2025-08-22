const mongoose = require('mongoose');

// User Recommendations Model (stored in user database)
const recommendationsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAuth',
        required: true,
        index: true
    },    
    // Recommendations stored as string IDs (not ObjectIds)
    recommendations: {
        services: [{
            serviceId: {
                type: String,
                required: true
            },
            name: String,
            price: Number,
            description: String,
            practitionerType: String,
            image: String
        }],
        products: [{
            productId: {
                type: String,
                required: true
            },
            name: String,
            price: Number,
            description: String,
            image: String
        }],
        podcasts: [{
            podcastId: {
                type: String,
                required: true
            },
            title: String,
            episode: String,
            description: String,
            link: String,
            image: String
        }]
    },
    
}, { 
    timestamps: true 
});

// Indexes for performance
recommendationsSchema.index({ userId: 1, createdAt: -1 });
recommendationsSchema.index({ 'recommendations.services.serviceId': 1 });
recommendationsSchema.index({ 'recommendations.products.productId': 1 });
recommendationsSchema.index({ 'recommendations.podcasts.podcastId': 1 });

// Create and export the model
let RecommendationsModel = null;

const createRecommendationsModel = () => {
    if (!RecommendationsModel) {
        const { getUserModel } = require('../config/database');
        RecommendationsModel = getUserModel('Recommendations', recommendationsSchema);
    }
    return RecommendationsModel;
};

module.exports = createRecommendationsModel;
