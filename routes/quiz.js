const express = require('express');
const { createAnonymousSession, getAnonymousResults, getAnalytics } = require('../utils/sessionManager');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const createRecommendationsModel = require('../models/recommendations');

const router = express.Router();

// Submit quiz data (authenticated users only)
router.post('/submit', authenticateToken, requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId; // User ID from authenticated token
    const quizData = req.body;
    
    // Extract device information (non-personal)
    const deviceInfo = {
      deviceType: getDeviceType(req.headers['user-agent']),
      browserType: getBrowserType(req.headers['user-agent']),
      ipCountry: req.headers['cf-ipcountry'] || 'unknown' // Cloudflare country code
    };

    // Create anonymous session
    const result = await createAnonymousSession(quizData, deviceInfo);
    // If user is authenticated, store recommendations in user database
    if (userId) {
      try {
        const Recommendations = createRecommendationsModel();
        
        // Check if results exist and have the expected structure
        if (!result.results || !result.results.services) {
          console.error('Quiz results structure is invalid:', result);
          throw new Error('Invalid quiz results structure');
        }
        
        // Convert ObjectIds to strings for storage
        const services = (result.results.services || []).map(service => ({
          serviceId: service._id?.toString() || service._id,
          name: service.name,
          price: service.price,
          description: service.description,
          practitionerType: service.practitionerType,
          image: service.image
        }));
        
        const products = (result.results.products || []).map(product => ({
          productId: product._id?.toString() || product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          image: product.image
        }));
        
        const podcasts = (result.results.podcast || []).map(podcast => ({
          podcastId: podcast.podcastId || podcast._id?.toString() || 'unknown',
          title: podcast.title,
          episode: podcast.episode,
          description: podcast.description,
          link: podcast.link,
          image: podcast.image
        }));
        
        // Create recommendations entry
        const recommendations = new Recommendations({
          userId: userId,
          recommendations: {
            services,
            products,
            podcasts
          },
        });
        
        await recommendations.save();
      } catch (recommendationError) {
        console.error('Error storing recommendations:', recommendationError);
        // Don't fail the quiz submission if recommendation storage fails
      }
    }

    res.status(201).json({
      message: 'Quiz completed successfully',
      sessionId: result.sessionId,
      results: result.results,
      success: true,
      recommendationsStored: !!userId
    });

  } catch (error) {
    console.log('Quiz submission error:', error);
    res.status(500).json({ 
      message: 'Failed to process quiz',
      error: error.message 
    });
  }
});

// Get quiz results by session ID (no authentication required)
router.get('/results/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const results = await getAnonymousResults(sessionId);
    
    if (!results) {
      return res.status(404).json({ 
        message: 'Quiz results not found or expired' 
      });
    }

    res.json({
      results: results.results,
      sessionId: results.sessionId,
      timestamp: results.timestamp,
      success: true
    });

  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve quiz results',
      error: error.message 
    });
  }
});

// Get analytics (completely anonymous - admin only)
router.get('/analytics', async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analytics = await getAnalytics(filters);

    res.json({
      analytics,
      success: true
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve analytics',
      error: error.message 
    });
  }
});

// Health check for quiz service
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Anonymous quiz service is running',
    timestamp: new Date().toISOString()
  });
});

// Helper functions
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
};

const getBrowserType = (userAgent) => {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari')) return 'safari';
  if (ua.includes('edge')) return 'edge';
  if (ua.includes('opera')) return 'opera';
  return 'unknown';
};

module.exports = router;
