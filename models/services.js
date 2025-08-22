const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    image: {
        type: String,
    },
    description: {
        type: String,
    },
    serviceProviderName: {
        type: String,
    },
    serviceProviderEmail: {
        type: String,
    },
    price: {
        type: Number,
    },
    serviceType: {
        type: String,
    },
    uniqueId: {
        type: mongoose.Schema.Types.ObjectId,
    },
}, { timestamps: true });   

// Create and export the model
let ServiceModel = null;

const createServiceModel = () => {
    if (!ServiceModel) {
        const { getServicesModel } = require('../config/database');
        ServiceModel = getServicesModel('Service', serviceSchema);
    }
    return ServiceModel;
};

module.exports = createServiceModel;