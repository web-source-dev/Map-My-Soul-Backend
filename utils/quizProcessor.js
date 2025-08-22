// Quiz data processing utilities
const createServiceModel = require('../models/services');
const createProductModel = require('../models/products');
const createPodcastModel = require('../models/podcast');

// Mock astrology calculation
const calculateAstrology = (birthDate, birthTime) => {
  const date = new Date(birthDate + 'T' + birthTime);
  const month = date.getMonth() + 1;
  
  const sunSigns = [
    'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini',
    'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'
  ];
  
  const sunSign = sunSigns[month - 1];
  
  return {
    sunSign,
    moonSign: 'Cancer', // Mock calculation
    risingSign: 'Libra' // Mock calculation
  };
};

// Mock Human Design calculation
const calculateHumanDesign = () => {
  const energyTypes = ['Generator', 'Manifestor', 'Manifesting Generator', 'Projector', 'Reflector'];
  const randomType = energyTypes[Math.floor(Math.random() * energyTypes.length)];
  
  return {
    energyType: randomType,
    strategy: 'Wait to respond',
    authority: 'Sacral'
  };
};

// Generate service recommendations from database
const getServiceRecommendations = async (quizData) => {
  const { currentChallenge, budget, practitionerType } = quizData;
  
  try {
    // Get the actual model
    const Service = createServiceModel();
    
    // Get all services from database
    const allServices = await Service.find({});
    
    if (allServices.length === 0) {
      throw new Error('No services found in database');
    }
    
    // Filter services based on challenge
    let filteredServices = allServices;
    
    if (currentChallenge?.includes('Anxiety') || currentChallenge?.includes('Stress')) {
      filteredServices = allServices.filter(service => 
        service.serviceType === 'aura_cleansing' || 
        service.serviceType === 'reiki' ||
        service.serviceType === 'meditation'
      );
    } else if (currentChallenge?.includes('Trauma')) {
      filteredServices = allServices.filter(service => 
        service.serviceType === 'life_coaching' || 
        service.serviceType === 'reiki' ||
        service.serviceType === 'crystal_healing'
      );
    } else if (currentChallenge?.includes('Spiritual')) {
      filteredServices = allServices.filter(service => 
        service.serviceType === 'astrology' || 
        service.serviceType === 'tarot' ||
        service.serviceType === 'numerology'
      );
    }
    
    // Filter by practitioner type if specified
    if (practitionerType) {
      if (practitionerType.includes('Energy healer')) {
        filteredServices = filteredServices.filter(service => 
          service.serviceType === 'reiki' || 
          service.serviceType === 'crystal_healing' ||
          service.serviceType === 'aura_cleansing'
        );
      } else if (practitionerType.includes('Mind-body')) {
        filteredServices = filteredServices.filter(service => 
          service.serviceType === 'meditation'
        );
      } else if (practitionerType.includes('Talk-based')) {
        filteredServices = filteredServices.filter(service => 
          service.serviceType === 'life_coaching'
        );
      } else if (practitionerType.includes('Spiritual guide')) {
        filteredServices = filteredServices.filter(service => 
          service.serviceType === 'astrology' || 
          service.serviceType === 'tarot' ||
          service.serviceType === 'numerology'
        );
      }
    }
    
    // If no specific matches, use all services
    if (filteredServices.length === 0) {
      filteredServices = allServices;
    }
    
    // Adjust prices based on budget
    const adjustedServices = filteredServices.map(service => {
      let adjustedPrice = service.price;
      
      if (budget?.includes('Under $50')) {
        adjustedPrice = Math.min(service.price, 45);
      } else if (budget?.includes('$50–$100')) {
        adjustedPrice = Math.min(service.price, 85);
      } else if (budget?.includes('$100–$200')) {
        adjustedPrice = Math.min(service.price, 175);
      }
      
      return {
        _id: service._id,
        name: service.name,
        price: adjustedPrice,
        bookingUrl: service.bookingUrl,
        description: service.description,
        practitionerType: service.serviceProviderName,
        image: service.image,
        duration: service.duration,
        rating: service.rating,
        reviewCount: service.reviewCount
      };
    });
    
    // Return all filtered services instead of limiting to 3
    return adjustedServices;
    
  } catch (error) {
    console.error('Error fetching service recommendations:', error);
    throw new Error('Failed to fetch service recommendations from database');
  }
};

// Generate product recommendations from database
const getProductRecommendations = async (quizData) => {
  const { productInterest, balanceActivities, dateOfBirth, birthTime } = quizData;
  const products = [];
  
  if (productInterest !== 'Yes, please') {
    return products;
  }
  
  try {
    // Get the actual model
    const Product = createProductModel();
    
    // Get all products from database
    const allProducts = await Product.find({});
    
    if (allProducts.length === 0) {
      throw new Error('No products found in database');
    }
    
    // If birth info is available, prioritize crystal products
    if (dateOfBirth && birthTime) {
      const astrology = calculateAstrology(dateOfBirth, birthTime);
      
      // Find all crystal products
      const crystalProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes('crystal') ||
        product.name.toLowerCase().includes('amethyst')
      );
      
      // Add all crystal products
      crystalProducts.forEach(crystalProduct => {
        products.push({
          _id: crystalProduct._id,
          name: crystalProduct.name,
          price: crystalProduct.price,
          productUrl: `/shop/${crystalProduct.name.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Perfect for ${astrology.sunSign} energy - ${crystalProduct.description}`,
          image: crystalProduct.imageUrl
        });
      });
    }
    
    // Add all products based on balance activities
    if (balanceActivities?.includes('Meditation')) {
      const meditationProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes('meditation') ||
        product.name.toLowerCase().includes('cushion')
      );
      
      // Add all meditation products
      meditationProducts.forEach(product => {
        if (!products.some(p => p._id.toString() === product._id.toString())) {
          products.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            productUrl: `/shop/${product.name.toLowerCase().replace(/\s+/g, '-')}`,
            description: product.description,
            image: product.imageUrl
          });
        }
      });
    }
    
    if (balanceActivities?.includes('Nature')) {
      const natureProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes('essential') ||
        product.name.toLowerCase().includes('oil')
      );
      
      // Add all nature products
      natureProducts.forEach(product => {
        if (!products.some(p => p._id.toString() === product._id.toString())) {
          products.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            productUrl: `/shop/${product.name.toLowerCase().replace(/\s+/g, '-')}`,
            description: product.description,
            image: product.imageUrl
          });
        }
      });
    }
    
    // If we don't have enough products, add all remaining ones
    if (products.length === 0) {
      const allProductRecommendations = allProducts.map(product => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        productUrl: `/shop/${product.name.toLowerCase().replace(/\s+/g, '-')}`,
        description: product.description,
        image: product.imageUrl
      }));
      
      products.push(...allProductRecommendations);
    }
    
    // Return all products instead of limiting to 3
    return products;
    
  } catch (error) {
    console.error('Error fetching product recommendations:', error);
    throw new Error('Failed to fetch product recommendations from database');
  }
};

// Get podcast recommendations from database
const getPodcastRecommendations = async (currentChallenge) => {
  try {
    // Get the actual model
    const Podcast = createPodcastModel();
    
    // Get all podcasts from database
    const allPodcasts = await Podcast.find({});
    
    if (allPodcasts.length === 0) {
      throw new Error('No podcasts found in database');
    }
    
    // Map challenges to podcast types
    const challengeToPodcastType = {
      'anxiety': 'meditation',
      'stress_management': 'meditation',
      'trauma_recovery': 'energy_healing',
      'emotional_balance': 'crystal_healing',
      'spiritual_growth': 'spiritual_growth',
      'physical_health': 'energy_healing'
    };
    
    const podcastType = challengeToPodcastType[currentChallenge?.toLowerCase()] || 'spiritual_growth';
    
    // Find all matching podcasts
    let matchingPodcasts = allPodcasts.filter(podcast => 
      podcast.podcastType === podcastType
    );
    
    // If no specific matches found, return all podcasts
    if (matchingPodcasts.length === 0) {
      matchingPodcasts = allPodcasts;
    }
    
    // Convert all matching podcasts to the expected format
    const podcastRecommendations = matchingPodcasts.map(podcast => ({
      title: podcast.title,
      episode: "Featured Episode",
      description: podcast.description,
      link: podcast.podcastUrl,
      image: podcast.podcastImageUrl,
      podcastId: podcast._id
    }));
    
    return podcastRecommendations;
    
  } catch (error) {
    console.error('Error fetching podcast recommendations:', error);
    throw new Error('Failed to fetch podcast recommendations from database');
  }
};

// Process quiz data and generate comprehensive results
const processQuizData = async (quizData) => {
  const { dateOfBirth, birthTime, energyType, calculateEnergyType, currentChallenge, eligibleNonprofit } = quizData;

  // Calculate astrology
  const astrology = dateOfBirth && birthTime ? calculateAstrology(dateOfBirth, birthTime) : { sunSign: "Unknown", moonSign: "Unknown", risingSign: "Unknown" };
  
  // Calculate Human Design
  let humanDesign = { energyType: energyType || "Unknown", strategy: "", authority: "" };
  if (energyType === "I'm not sure" && calculateEnergyType === "Yes" && dateOfBirth && birthTime) {
    humanDesign = calculateHumanDesign();
  }
  
  // Get recommendations from database
  const recommendedServices = await getServiceRecommendations(quizData);
  const recommendedProducts = await getProductRecommendations(quizData);
  const podcastRecommendations = await getPodcastRecommendations(currentChallenge);
  
  // Check nonprofit eligibility
  const nonprofit = {
    eligible: eligibleNonprofit === "Yes",
    applyUrl: "/apply/nonprofit-support",
    message: "You may qualify for free or subsidized wellness services. Apply now to learn more."
  };
  
  return {
    astrology,
    humanDesign,
    recommendedServices,
    recommendedProducts,
    nonprofit,
    podcastRecommendations
  };
};

module.exports = {
  processQuizData,
  calculateAstrology,
  calculateHumanDesign,
  getServiceRecommendations,
  getProductRecommendations,
  getPodcastRecommendations
};
