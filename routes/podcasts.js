const express = require('express');
const createPodcastModel = require('../models/podcast');

const router = express.Router();

// GET /api/podcasts - list all podcasts
router.get('/', async (req, res) => {
  try {
    const Podcast = createPodcastModel();
    const podcasts = await Podcast.find({}).sort({ createdAt: -1 });

    res.json({
      podcasts,
      count: podcasts.length,
      success: true
    });
  } catch (error) {
    console.error('Get podcasts error:', error);
    res.status(500).json({ message: 'Failed to fetch podcasts' });
  }
});

// Optional: GET /api/podcasts/:id - get a single podcast by id
router.get('/:id', async (req, res) => {
  try {
    const Podcast = createPodcastModel();
    const podcast = await Podcast.findById(req.params.id);
    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }
    res.json({ podcast, success: true });
  } catch (error) {
    console.error('Get podcast by id error:', error);
    res.status(500).json({ message: 'Failed to fetch podcast' });
  }
});

module.exports = router;
