const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    podcastImageUrl: {
        type: String,
    },
    podcastUrl: {
        type: String,
    },
    podcastType: {
        type: String,
    },
}, { timestamps: true });

// Create and export the model
let PodcastModel = null;

const createPodcastModel = () => {
    if (!PodcastModel) {
        const { getServicesModel } = require('../config/database');
        PodcastModel = getServicesModel('Podcast', podcastSchema);
    }
    return PodcastModel;
};

module.exports = createPodcastModel;