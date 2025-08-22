const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
    },
    imageUrl: {
        type: String,
    },
    stock: {
        type: Number,
    },
})

// Create and export the model
let ProductModel = null;

const createProductModel = () => {
    if (!ProductModel) {
        const { getServicesModel } = require('../config/database');
        ProductModel = getServicesModel('Product', productSchema);
    }
    return ProductModel;
};

module.exports = createProductModel;