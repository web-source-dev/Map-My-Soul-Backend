const express = require('express');
const createServiceModel = require('../models/services');

const router = express.Router();

// GET /api/services - list all services
router.get('/', async (req, res) => {
  try {
    const Service = createServiceModel();
    const services = await Service.find({}).sort({ createdAt: -1 });

    res.json({
      services,
      count: services.length,
      success: true
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// Optional: GET /api/services/:id - get a single service by id
router.get('/:id', async (req, res) => {
  try {
    const Service = createServiceModel();
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ service, success: true });
  } catch (error) {
    console.error('Get service by id error:', error);
    res.status(500).json({ message: 'Failed to fetch service' });
  }
});

module.exports = router;


