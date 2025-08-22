const express = require('express');
const createProductModel = require('../models/products');

const router = express.Router();

// GET /api/products - list all products
router.get('/', async (req, res) => {
  try {
    const Product = createProductModel();
    const products = await Product.find({}).sort({ createdAt: -1 });

    res.json({
      products,
      count: products.length,
      success: true
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Optional: GET /api/products/:id - get a single product by id
router.get('/:id', async (req, res) => {
  try {
    const Product = createProductModel();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product, success: true });
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

module.exports = router;


