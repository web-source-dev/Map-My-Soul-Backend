const crypto = require('crypto');
const createAnonymousQuizDataModel = require('../models/anonymousQuizData');
const { processQuizData } = require('./quizProcessor');

// Generate anonymous session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create anonymous quiz session
const createAnonymousSession = async (quizData, deviceInfo = {}) => {
  try {
    const sessionId = generateSessionId();
    
    // Process quiz data to generate recommendations using the real processor
    const processedResults = await processQuizData(quizData);
    
    // Create anonymous quiz data entry
    const AnonymousQuizData = createAnonymousQuizDataModel();
    const anonymousData = new AnonymousQuizData({
      sessionId,
      quizResponses: {
        energyType: mapEnergyType(quizData.energyType),
        balanceActivities: quizData.balanceActivities?.map(activity => mapBalanceActivity(activity)) || [],
        budgetPreference: mapBudgetPreference(quizData.budget),
        timeAvailability: mapTimeAvailability(quizData.timeCommitment),
        sessionPreference: mapSessionPreference(quizData.sessionPreference),
        practitionerInterest: mapPractitionerInterest(quizData.practitionerType),
        productInterest: quizData.productInterest === 'Yes, please',
        currentChallenge: mapCurrentChallenge(quizData.currentChallenge)
      },
      recommendations: {
        services: processedResults.recommendedServices || [],
        products: processedResults.recommendedProducts || [],
        podcast: processedResults.podcastRecommendations || []
      },
      insights: {
        wellnessProfile: determineWellnessProfile(quizData.currentChallenge),
        recommendedApproach: determineApproach(quizData.currentChallenge),
        priorityAreas: generatePriorityAreas(quizData)
      },
      sessionMetadata: {
        deviceType: deviceInfo.deviceType || 'desktop',
        browserType: deviceInfo.browserType || 'unknown',
        ipCountry: deviceInfo.ipCountry || 'unknown',
        completionTime: quizData.completionTime || 0
      },
      analytics: {
        timeSpentOnEachQuestion: quizData.timeSpentOnQuestions || [],
        questionsSkipped: quizData.skippedQuestions || [],
        totalQuestionsAnswered: quizData.totalQuestions || 0
      }
    });
    
    await anonymousData.save();
    
    return {
      sessionId,
      results: {
        services: processedResults.recommendedServices || [],
        products: processedResults.recommendedProducts || [],
        podcast: processedResults.podcastRecommendations || [],
        astrology: processedResults.astrology || {},
        humanDesign: processedResults.humanDesign || {},
        nonprofit: processedResults.nonprofit || { eligible: false }
      },
      success: true
    };
    
  } catch (error) {
    console.error('Error creating anonymous session:', error);
    throw error;
  }
};

// Retrieve anonymous quiz results
const getAnonymousResults = async (sessionId) => {
  try {
    const AnonymousQuizData = createAnonymousQuizDataModel();
    const anonymousData = await AnonymousQuizData.findOne({ sessionId });
    
    if (!anonymousData) {
      return null;
    }
    
    return {
      results: {
        services: anonymousData.recommendations.services || [],
        products: anonymousData.recommendations.products || [],
        podcast: anonymousData.recommendations.podcast || [],
        insights: anonymousData.insights || {}
      },
      sessionId: anonymousData.sessionId,
      timestamp: anonymousData.sessionMetadata.timestamp
    };
    
  } catch (error) {
    console.error('Error retrieving anonymous results:', error);
    throw error;
  }
};

// Get analytics data (completely anonymous)
const getAnalytics = async (filters = {}) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgCompletionTime: { $avg: '$sessionMetadata.completionTime' },
          mostCommonChallenge: {
            $push: '$quizResponses.currentChallenge'
          },
          mostCommonProfile: {
            $push: '$insights.wellnessProfile'
          },
          deviceTypes: {
            $push: '$sessionMetadata.deviceType'
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSessions: 1,
          avgCompletionTime: 1,
          mostCommonChallenge: 1,
          mostCommonProfile: 1,
          deviceTypes: 1
        }
      }
    ];
    
    // Add date filters if provided
    if (filters.startDate || filters.endDate) {
      const matchStage = {};
      if (filters.startDate) {
        matchStage['sessionMetadata.timestamp'] = { $gte: new Date(filters.startDate) };
      }
      if (filters.endDate) {
        matchStage['sessionMetadata.timestamp'] = { 
          ...matchStage['sessionMetadata.timestamp'],
          $lte: new Date(filters.endDate)
        };
      }
      pipeline.unshift({ $match: matchStage });
    }
    
    const AnonymousQuizData = createAnonymousQuizDataModel();
    const analytics = await AnonymousQuizData.aggregate(pipeline);
    
    if (analytics.length === 0) {
      return {
        totalSessions: 0,
        avgCompletionTime: 0,
        mostCommonChallenge: [],
        mostCommonProfile: [],
        deviceTypes: []
      };
    }
    
    const result = analytics[0];
    
    // Calculate most common values
    const challengeCounts = {};
    result.mostCommonChallenge.forEach(challenge => {
      challengeCounts[challenge] = (challengeCounts[challenge] || 0) + 1;
    });
    
    const profileCounts = {};
    result.mostCommonProfile.forEach(profile => {
      profileCounts[profile] = (profileCounts[profile] || 0) + 1;
    });
    
    return {
      totalSessions: result.totalSessions,
      avgCompletionTime: Math.round(result.avgCompletionTime),
      mostCommonChallenge: Object.entries(challengeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([challenge, count]) => ({ challenge, count })),
      mostCommonProfile: Object.entries(profileCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([profile, count]) => ({ profile, count })),
      deviceTypes: [...new Set(result.deviceTypes)]
    };
    
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
};

// Helper functions
const determineWellnessProfile = (challenge) => {
  const profileMap = {
    'anxiety': 'stress_focused',
    'stress_management': 'stress_focused',
    'trauma_recovery': 'trauma_informed',
    'emotional_balance': 'energy_balanced',
    'spiritual_growth': 'spiritual_seeker',
    'physical_health': 'mind_body_integrated'
  };
  return profileMap[challenge] || 'energy_balanced';
};

const determineApproach = (challenge) => {
  const approachMap = {
    'anxiety': 'gentle_healing',
    'stress_management': 'mindful_practice',
    'trauma_recovery': 'gentle_healing',
    'emotional_balance': 'energy_work',
    'spiritual_growth': 'holistic_integration',
    'physical_health': 'active_engagement'
  };
  return approachMap[challenge] || 'holistic_integration';
};

const generatePriorityAreas = (quizData) => {
  const areas = [];
  
  if (quizData.currentChallenge) {
    areas.push({ area: quizData.currentChallenge.toLowerCase(), priority: 1 });
  }
  
  if (quizData.balanceActivities?.length > 0) {
    areas.push({ area: 'balance_activities', priority: 2 });
  }
  
  return areas;
};

// Data mapping functions to convert frontend values to schema enums
const mapEnergyType = (energyType) => {
  if (!energyType) return 'unknown';
  
  const energyTypeMap = {
    'generator': 'generator',
    'manifestor': 'manifestor',
    'manifesting generator': 'manifestor', // Map to manifestor for simplicity
    'projector': 'projector',
    'reflector': 'reflector',
    "i'm not sure": 'unknown'
  };
  
  return energyTypeMap[energyType.toLowerCase()] || 'unknown';
};

const mapBalanceActivity = (activity) => {
  if (!activity) return 'meditation';
  
  const activityMap = {
    'meditation & mindfulness': 'meditation',
    'physical exercise': 'exercise',
    'creative expression (art, music, writing)': 'creative',
    'social connection & community': 'social',
    'nature & outdoor activities': 'nature',
    'energy work & holistic therapies': 'energy_work'
  };
  
  return activityMap[activity.toLowerCase()] || 'meditation';
};

const mapBudgetPreference = (budget) => {
  if (!budget) return 'under_50';
  
  const budgetMap = {
    'under $50': 'under_50',
    '$50–$100': '50_100',
    '$100–$200': '100_200',
    '$200+': '200_plus'
  };
  
  return budgetMap[budget] || 'under_50';
};

const mapTimeAvailability = (timeCommitment) => {
  if (!timeCommitment) return 'less_1_hour';
  
  const timeMap = {
    'less than 1 hour': 'less_1_hour',
    '1–2 hours': '1_2_hours',
    '3–5 hours': '3_5_hours',
    '5+ hours': '5_plus_hours'
  };
  
  return timeMap[timeCommitment] || 'less_1_hour';
};

const mapSessionPreference = (sessionPreference) => {
  if (!sessionPreference) return 'either';
  
  const sessionMap = {
    'in-person': 'in_person',
    'online (zoom, video call)': 'online',
    'either is fine': 'either'
  };
  
  return sessionMap[sessionPreference.toLowerCase()] || 'either';
};

const mapPractitionerInterest = (practitionerType) => {
  if (!practitionerType) return 'energy_healer';
  
  const practitionerMap = {
    'energy healer (reiki, chakra balancing)': 'energy_healer',
    'mind-body practitioner (yoga, tai chi)': 'mind_body',
    'talk-based therapist/coach': 'talk_therapy',
    'bodywork therapist (massage, craniosacral)': 'bodywork',
    'spiritual guide (astrology, tarot, meditation)': 'spiritual_guide'
  };
  
  return practitionerMap[practitionerType.toLowerCase()] || 'energy_healer';
};

const mapCurrentChallenge = (currentChallenge) => {
  if (!currentChallenge) return 'anxiety';
  
  const challengeMap = {
    'anxiety & stress relief': 'anxiety',
    'trauma recovery & healing': 'trauma_recovery',
    'emotional balance & mental health': 'emotional_balance',
    'physical health & energy': 'physical_health',
    'spiritual growth & awakening': 'spiritual_growth',
    'overall life balance': 'stress_management'
  };
  
  return challengeMap[currentChallenge.toLowerCase()] || 'anxiety';
};

module.exports = {
  createAnonymousSession,
  getAnonymousResults,
  getAnalytics,
  generateSessionId
};
