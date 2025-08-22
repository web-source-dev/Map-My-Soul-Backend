const express = require('express');
const createRecommendationsModel = require('../models/recommendations');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function to get models
const getModels = () => {
  const Recommendations = createRecommendationsModel();
  return { Recommendations };
};

// Get user recommendations
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { Recommendations } = getModels();
    
    const userRecommendations = await Recommendations.findOne({ 
      userId: req.user.userId 
    }).sort({ createdAt: -1 });

    if (!userRecommendations) {
      return res.json({
        recommendations: {
          services: [],
          products: [],
          podcasts: []
        }
      });
    }

    res.json({
      recommendations: userRecommendations.recommendations
    });

  } catch (error) {
    console.error('Get user recommendations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user recommendations history
router.get('/user/history', authenticateToken, async (req, res) => {
  try {
    const { Recommendations } = getModels();
    
    const recommendationsHistory = await Recommendations.find({ 
      userId: req.user.userId 
    }).sort({ createdAt: -1 }).limit(10);

    res.json({
      history: recommendationsHistory.map(rec => ({
        id: rec._id,
        createdAt: rec.createdAt,
        servicesCount: rec.recommendations.services.length,
        productsCount: rec.recommendations.products.length,
        podcastsCount: rec.recommendations.podcasts.length
      }))
    });

  } catch (error) {
    console.error('Get recommendations history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;