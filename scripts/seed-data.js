const mongoose = require('mongoose');
const { connectDatabase, closeConnections } = require('../config/database');
require('dotenv').config();

// Import models
const createServiceModel = require('../models/services');
const createProductModel = require('../models/products');
const createPodcastModel = require('../models/podcast');

// Seed data for services (20 services)
const servicesData = [
  {
    name: "Personal Astrology Reading",
    description: "Comprehensive birth chart analysis with personalized insights into your personality, life path, and future opportunities. Includes detailed interpretation of planetary positions and aspects.",
    serviceProviderName: "Luna Astrology",
    serviceProviderEmail: "luna@mapmysoul.com",
    price: 150.00,
    serviceType: "astrology",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop"
  },
  {
    name: "Tarot Card Reading",
    description: "Intuitive tarot reading session to gain clarity on life decisions, relationships, and spiritual growth. Includes 3-card spread with detailed interpretation.",
    serviceProviderName: "Mystic Tarot",
    serviceProviderEmail: "mystic@mapmysoul.com",
    price: 75.00,
    serviceType: "tarot",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"
  },
  {
    name: "Crystal Healing Session",
    description: "Therapeutic crystal healing session using carefully selected crystals to balance your energy centers and promote emotional and physical well-being.",
    serviceProviderName: "Crystal Harmony",
    serviceProviderEmail: "crystal@mapmysoul.com",
    price: 120.00,
    serviceType: "crystal_healing",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
  },
  {
    name: "Aura Cleansing",
    description: "Deep energetic cleansing to remove negative energy and restore your natural aura. Includes chakra balancing and energy field protection.",
    serviceProviderName: "Aura Wellness",
    serviceProviderEmail: "aura@mapmysoul.com",
    price: 95.00,
    serviceType: "aura_cleansing",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop"
  },
  {
    name: "Spiritual Life Coaching",
    description: "One-on-one spiritual guidance to help you align with your higher purpose, overcome obstacles, and create a more meaningful life path.",
    serviceProviderName: "Soul Guidance",
    serviceProviderEmail: "soul@mapmysoul.com",
    price: 180.00,
    serviceType: "life_coaching",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
  },
  {
    name: "Meditation & Mindfulness Training",
    description: "Personalized meditation instruction and mindfulness practices tailored to your spiritual journey and daily life challenges.",
    serviceProviderName: "Mindful Spirit",
    serviceProviderEmail: "mindful@mapmysoul.com",
    price: 85.00,
    serviceType: "meditation",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
  },
  {
    name: "Reiki Energy Healing",
    description: "Traditional Reiki healing session to promote relaxation, stress reduction, and natural healing processes through gentle energy work.",
    serviceProviderName: "Reiki Harmony",
    serviceProviderEmail: "reiki@mapmysoul.com",
    price: 110.00,
    serviceType: "reiki",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
  },
  {
    name: "Numerology Reading",
    description: "Personal numerology analysis revealing your life path number, destiny number, and how numbers influence your life journey and decisions.",
    serviceProviderName: "Number Wisdom",
    serviceProviderEmail: "numbers@mapmysoul.com",
    price: 90.00,
    serviceType: "numerology",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"
  },
  {
    name: "Chakra Balancing Session",
    description: "Comprehensive chakra balancing to align your seven energy centers, promoting physical, emotional, and spiritual harmony.",
    serviceProviderName: "Chakra Flow",
    serviceProviderEmail: "chakra@mapmysoul.com",
    price: 130.00,
    serviceType: "chakra_healing",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
  },
  {
    name: "Past Life Regression",
    description: "Guided past life regression therapy to explore previous incarnations and resolve current life challenges through spiritual insight.",
    serviceProviderName: "Soul Memory",
    serviceProviderEmail: "regression@mapmysoul.com",
    price: 200.00,
    serviceType: "past_life",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
  },
  {
    name: "Sound Healing Therapy",
    description: "Therapeutic sound healing using Tibetan singing bowls, crystal bowls, and sacred instruments to restore vibrational harmony.",
    serviceProviderName: "Sound Sanctuary",
    serviceProviderEmail: "sound@mapmysoul.com",
    price: 140.00,
    serviceType: "sound_healing",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop"
  },
  {
    name: "Moon Phase Ritual",
    description: "Sacred moon phase ritual to harness lunar energy for manifestation, healing, and spiritual transformation aligned with cosmic cycles.",
    serviceProviderName: "Lunar Wisdom",
    serviceProviderEmail: "moon@mapmysoul.com",
    price: 95.00,
    serviceType: "moon_ritual",
    image: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=800&h=600&fit=crop"
  },
  {
    name: "Energy Clearing & Protection",
    description: "Comprehensive energy clearing to remove negative attachments and establish protective boundaries for your spiritual well-being.",
    serviceProviderName: "Energy Shield",
    serviceProviderEmail: "protection@mapmysoul.com",
    price: 125.00,
    serviceType: "energy_clearing",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
  },
  {
    name: "Spiritual Counseling",
    description: "Professional spiritual counseling to navigate life transitions, grief, and existential questions with compassionate guidance.",
    serviceProviderName: "Spirit Counsel",
    serviceProviderEmail: "counsel@mapmysoul.com",
    price: 160.00,
    serviceType: "spiritual_counseling",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
  },
  {
    name: "Sacred Space Clearing",
    description: "Professional clearing of your home or workspace to remove negative energy and create a harmonious, spiritually aligned environment.",
    serviceProviderName: "Sacred Space",
    serviceProviderEmail: "space@mapmysoul.com",
    price: 175.00,
    serviceType: "space_clearing",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop"
  },
  {
    name: "Divine Feminine Awakening",
    description: "Sacred feminine energy work to awaken your inner goddess, embrace your power, and connect with divine feminine wisdom.",
    serviceProviderName: "Goddess Rising",
    serviceProviderEmail: "goddess@mapmysoul.com",
    price: 145.00,
    serviceType: "feminine_awakening",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop"
  },
  {
    name: "Ancestral Healing",
    description: "Deep ancestral healing work to resolve generational patterns, honor your lineage, and create positive change for future generations.",
    serviceProviderName: "Ancestral Wisdom",
    serviceProviderEmail: "ancestors@mapmysoul.com",
    price: 190.00,
    serviceType: "ancestral_healing",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
  },
  {
    name: "Sacred Geometry Healing",
    description: "Healing through sacred geometry patterns to activate your DNA, enhance consciousness, and align with universal harmony.",
    serviceProviderName: "Geometric Light",
    serviceProviderEmail: "geometry@mapmysoul.com",
    price: 155.00,
    serviceType: "sacred_geometry",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
  },
  {
    name: "Spiritual Mentorship",
    description: "Long-term spiritual mentorship program to guide your awakening journey, develop your gifts, and integrate spiritual wisdom into daily life.",
    serviceProviderName: "Spirit Mentor",
    serviceProviderEmail: "mentor@mapmysoul.com",
    price: 250.00,
    serviceType: "spiritual_mentorship",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"
  },
  {
    name: "Quantum Healing Session",
    description: "Advanced quantum healing to access the quantum field for rapid transformation, healing, and manifestation of your highest potential.",
    serviceProviderName: "Quantum Spirit",
    serviceProviderEmail: "quantum@mapmysoul.com",
    price: 220.00,
    serviceType: "quantum_healing",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop"
  }
];

// Seed data for products (20 products)
const productsData = [
  {
    name: "Amethyst Crystal Set",
    description: "Premium amethyst crystals for meditation and spiritual protection. Includes 5 hand-selected pieces with cleansing instructions.",
    price: 45.00,
    imageUrl: "/assets/crystal-therapy.jpg",
    stock: 25
  },
  {
    name: "Sage Smudging Bundle",
    description: "Traditional white sage smudging bundle with abalone shell and feather for spiritual cleansing and purification rituals.",
    price: 28.00,
    imageUrl: "/assets/spiritual-products.jpg",
    stock: 40
  },
  {
    name: "Tarot Deck - Rider Waite",
    description: "Classic Rider Waite tarot deck with guidebook for beginners and experienced readers. High-quality card stock with beautiful artwork.",
    price: 35.00,
    imageUrl: "/assets/tarot-reading.jpg",
    stock: 30
  },
  {
    name: "Meditation Cushion Set",
    description: "Comfortable meditation cushion with mat and carrying bag. Perfect for daily meditation practice and spiritual grounding.",
    price: 65.00,
    imageUrl: "/assets/hero-crystals.jpg",
    stock: 20
  },
  {
    name: "Essential Oil Set - Spiritual",
    description: "Curated essential oil set including frankincense, myrrh, lavender, and sandalwood for spiritual practices and energy work.",
    price: 55.00,
    imageUrl: "/assets/aura-cleansing.jpg",
    stock: 35
  },
  {
    name: "Moon Phase Calendar",
    description: "Beautiful moon phase calendar with spiritual insights and ritual suggestions for each lunar phase throughout the year.",
    price: 22.00,
    imageUrl: "/assets/spiritual-products.jpg",
    stock: 50
  },
  {
    name: "Crystal Grid Kit",
    description: "Complete crystal grid kit with sacred geometry template, 7 healing crystals, and detailed instructions for manifestation work.",
    price: 78.00,
    imageUrl: "/assets/crystal-therapy.jpg",
    stock: 15
  },
  {
    name: "Spiritual Journal",
    description: "Premium spiritual journal with guided prompts for self-reflection, dream recording, and spiritual growth tracking.",
    price: 18.00,
    imageUrl: "/assets/hero-crystals.jpg",
    stock: 60
  },
  {
    name: "Tibetan Singing Bowl",
    description: "Authentic Tibetan singing bowl for sound healing, meditation, and chakra balancing. Includes mallet and cushion.",
    price: 85.00,
    imageUrl: "/assets/aura-cleansing.jpg",
    stock: 12
  },
  {
    name: "Chakra Crystals Set",
    description: "Complete set of 7 chakra crystals with healing properties for each energy center. Includes detailed guidebook.",
    price: 95.00,
    imageUrl: "/assets/crystal-therapy.jpg",
    stock: 18
  },
  {
    name: "Sacred Geometry Mandala",
    description: "Hand-painted sacred geometry mandala for meditation, energy work, and spiritual contemplation. 18-inch diameter.",
    price: 42.00,
    imageUrl: "/assets/spiritual-products.jpg",
    stock: 25
  },
  {
    name: "Palo Santo Sticks",
    description: "Sacred Palo Santo wood sticks for spiritual cleansing and purification. Pack of 10 sustainably sourced sticks.",
    price: 15.00,
    imageUrl: "/assets/hero-crystals.jpg",
    stock: 45
  },
  {
    name: "Crystal Healing Wand",
    description: "Clear quartz healing wand for energy work, chakra clearing, and spiritual healing practices. 6-inch length.",
    price: 38.00,
    imageUrl: "/assets/crystal-therapy.jpg",
    stock: 22
  },
  {
    name: "Meditation Timer",
    description: "Beautiful wooden meditation timer with gentle chime sounds. Perfect for timed meditation sessions and spiritual practice.",
    price: 32.00,
    imageUrl: "/assets/aura-cleansing.jpg",
    stock: 30
  },
  {
    name: "Sacred Incense Set",
    description: "Premium incense set with frankincense, myrrh, sandalwood, and sage for spiritual rituals and energy cleansing.",
    price: 25.00,
    imageUrl: "/assets/spiritual-products.jpg",
    stock: 40
  },
  {
    name: "Crystal Pendant Necklace",
    description: "Handcrafted crystal pendant necklace with your choice of healing stone. Includes cleansing instructions and meaning guide.",
    price: 48.00,
    imageUrl: "/assets/hero-crystals.jpg",
    stock: 28
  },
  {
    name: "Spiritual Bath Salts",
    description: "Sacred bath salts infused with essential oils and healing crystals for spiritual cleansing and energy renewal.",
    price: 28.00,
    imageUrl: "/assets/crystal-therapy.jpg",
    stock: 35
  },
  {
    name: "Oracle Card Deck",
    description: "Beautiful oracle card deck for daily guidance and spiritual insights. Includes guidebook with card meanings and spreads.",
    price: 38.00,
    imageUrl: "/assets/tarot-reading.jpg",
    stock: 20
  },
  {
    name: "Energy Clearing Spray",
    description: "Sacred space clearing spray with essential oils and crystal-infused water for removing negative energy and protection.",
    price: 22.00,
    imageUrl: "/assets/aura-cleansing.jpg",
    stock: 50
  },
  {
    name: "Chakra Balancing Stones",
    description: "Set of 7 chakra balancing stones with specific crystals for each energy center. Perfect for daily chakra work.",
    price: 52.00,
    imageUrl: "/assets/crystal-therapy.jpg",
    stock: 15
  }
];

// Seed data for podcasts (20 podcasts)
const podcastsData = [
  {
    title: "Understanding Your Birth Chart",
    description: "Learn how to read and interpret your astrological birth chart to understand your personality, strengths, and life purpose. Discover the meaning behind planetary positions and how they shape your destiny.",
    podcastImageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/4iV5W9uYEdYUVa79Axb7R9",
    podcastType: "astrology"
  },
  {
    title: "Crystal Healing Fundamentals",
    description: "Discover the healing properties of crystals and how to use them for emotional balance, protection, and spiritual growth. Learn which crystals work best for different intentions.",
    podcastImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/7cQnB5XmC8K9L2N1R4T6Y8",
    podcastType: "crystal_healing"
  },
  {
    title: "Daily Meditation Guide",
    description: "Guided meditation sessions for beginners and advanced practitioners to cultivate mindfulness and inner peace. Start your spiritual journey with these transformative practices.",
    podcastImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/2mK9L3N5P7Q1R8T4W6Y9Z2",
    podcastType: "meditation"
  },
  {
    title: "Tarot Wisdom for Life",
    description: "Weekly tarot insights and guidance to help you navigate life's challenges and make empowered decisions. Learn to trust your intuition through the wisdom of the cards.",
    podcastImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/5nR8T2W4L6Y9Z1M3K7Q5X8",
    podcastType: "tarot"
  },
  {
    title: "Energy Healing Techniques",
    description: "Learn practical energy healing methods including Reiki, chakra balancing, and aura cleansing for self-healing. Master the art of energy work for personal transformation.",
    podcastImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/8tK4L6N2W5Y7Z1M9Q3R6X4",
    podcastType: "energy_healing"
  },
  {
    title: "Spiritual Growth Journey",
    description: "Personal stories and insights from spiritual practitioners sharing their path to enlightenment and self-discovery. Find inspiration for your own spiritual awakening.",
    podcastImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/1mK7L4N8T2W6Y9Z5Q3R7X1",
    podcastType: "spiritual_growth"
  },
  {
    title: "Moon Magic & Rituals",
    description: "Explore lunar cycles and learn how to harness the moon's energy for manifestation, healing, and spiritual transformation. Connect with the divine feminine energy.",
    podcastImageUrl: "https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/3nK8L5T1W7Y2Z4M6Q9R8X5",
    podcastType: "moon_magic"
  },
  {
    title: "Numerology for Beginners",
    description: "Introduction to numerology and how numbers influence your life path, relationships, and personal development. Discover your life path number and its significance.",
    podcastImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/6mK9L7N4T3W8Y1Z5Q2R9X6",
    podcastType: "numerology"
  },
  {
    title: "Chakra Balancing & Alignment",
    description: "Deep dive into the seven chakras and learn powerful techniques to balance and align your energy centers for optimal health and spiritual well-being.",
    podcastImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/7nK1L8N5T4W9Y2Z6Q3R0X7",
    podcastType: "chakra_healing"
  },
  {
    title: "Sacred Sound Healing",
    description: "Experience the transformative power of sound healing through sacred mantras, singing bowls, and vibrational frequencies that restore harmony to mind, body, and spirit.",
    podcastImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/8mK2L9N6T5W0Y3Z7Q4R1X8",
    podcastType: "sound_healing"
  },
  {
    title: "Past Life Regression Stories",
    description: "Fascinating accounts of past life regression sessions and how understanding previous incarnations can heal current life challenges and relationships.",
    podcastImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/9mK3L0N7T6W1Y4Z8Q5R2X9",
    podcastType: "past_life"
  },
  {
    title: "Sacred Geometry & Consciousness",
    description: "Explore the ancient wisdom of sacred geometry and how geometric patterns can activate higher consciousness and spiritual awakening.",
    podcastImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/1nK4L1N8T7W2Y5Z9Q6R3X0",
    podcastType: "sacred_geometry"
  },
  {
    title: "Divine Feminine Awakening",
    description: "Sacred teachings on awakening the divine feminine within, embracing your power, and connecting with the wisdom of the goddess archetype.",
    podcastImageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/2nK5L2N9T8W3Y6Z0Q7R4X1",
    podcastType: "feminine_awakening"
  },
  {
    title: "Ancestral Healing & Lineage",
    description: "Learn how to heal ancestral wounds, honor your lineage, and create positive change for future generations through spiritual practices.",
    podcastImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/3nK6L3N0T9W4Y7Z1Q8R5X2",
    podcastType: "ancestral_healing"
  },
  {
    title: "Quantum Healing & Manifestation",
    description: "Advanced techniques for quantum healing and manifestation using the power of consciousness to create rapid transformation and healing.",
    podcastImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/4nK7L4N1T0W5Y8Z2Q9R6X3",
    podcastType: "quantum_healing"
  },
  {
    title: "Spiritual Mentorship & Guidance",
    description: "Wisdom from spiritual mentors and guides sharing their journey, lessons learned, and practical advice for your spiritual development.",
    podcastImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/5nK8L5N2T1W6Y9Z3Q0R7X4",
    podcastType: "spiritual_mentorship"
  },
  {
    title: "Energy Clearing & Protection",
    description: "Essential techniques for clearing negative energy, protecting your aura, and creating sacred boundaries for spiritual well-being.",
    podcastImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/6nK9L6N3T2W7Y0Z4Q1R8X5",
    podcastType: "energy_clearing"
  },
  {
    title: "Sacred Space & Environment",
    description: "Learn how to create and maintain sacred spaces in your home and environment for spiritual practice, healing, and energy work.",
    podcastImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/7nK0L7N4T3W8Y1Z5Q2R9X6",
    podcastType: "sacred_space"
  },
  {
    title: "Spiritual Counseling & Support",
    description: "Professional insights on spiritual counseling, navigating life transitions, and finding meaning and purpose through spiritual guidance.",
    podcastImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/8nK1L8N5T4W9Y2Z6Q3R0X7",
    podcastType: "spiritual_counseling"
  },
  {
    title: "Life Coaching & Transformation",
    description: "Transformative life coaching techniques and strategies for personal growth, goal achievement, and creating lasting positive change.",
    podcastImageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=600&fit=crop",
    podcastUrl: "https://open.spotify.com/episode/9nK2L9N6T5W0Y3Z7Q4R1X8",
    podcastType: "life_coaching"
  }
];

// Function to seed services
const seedServices = async () => {
  try {
    console.log('🌱 Seeding services...');
    
    const Service = createServiceModel();
    
    // Clear existing services
    await Service.deleteMany({});
    console.log('✅ Cleared existing services');
    
    // Add uniqueId to each service
    const servicesWithIds = servicesData.map(service => ({
      ...service,
      uniqueId: new mongoose.Types.ObjectId()
    }));
    
    // Insert new services
    const result = await Service.insertMany(servicesWithIds);
    console.log(`✅ Successfully seeded ${result.length} services`);
    
    return result;
  } catch (error) {
    console.error('❌ Error seeding services:', error);
    throw error;
  }
};

// Function to seed products
const seedProducts = async () => {
  try {
    console.log('🌱 Seeding products...');
    
    const Product = createProductModel();
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('✅ Cleared existing products');
    
    // Insert new products
    const result = await Product.insertMany(productsData);
    console.log(`✅ Successfully seeded ${result.length} products`);
    
    return result;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
};

// Function to seed podcasts
const seedPodcasts = async () => {
  try {
    console.log('🌱 Seeding podcasts...');
    
    const Podcast = createPodcastModel();
    
    // Clear existing podcasts
    await Podcast.deleteMany({});
    console.log('✅ Cleared existing podcasts');
    
    // Insert new podcasts
    const result = await Podcast.insertMany(podcastsData);
    console.log(`✅ Successfully seeded ${result.length} podcasts`);
    
    return result;
  } catch (error) {
    console.error('❌ Error seeding podcasts:', error);
    throw error;
  }
};

// Main seeding function
const seedAll = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Connect to databases
    await connectDatabase();
    console.log('✅ Database connections established');
    
    // Seed all data
    await seedServices();
    await seedProducts();
    await seedPodcasts();
    
    console.log('🎉 All data seeded successfully!');
    
    // Display summary
    const Service = createServiceModel();
    const Product = createProductModel();
    const Podcast = createPodcastModel();
    
    const serviceCount = await Service.countDocuments();
    const productCount = await Product.countDocuments();
    const podcastCount = await Podcast.countDocuments();
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   Services: ${serviceCount}`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Podcasts: ${podcastCount}`);
    console.log(`   Total: ${serviceCount + productCount + podcastCount} items`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await closeConnections();
    console.log('✅ Database connections closed');
    process.exit(0);
  }
};

// Function to seed specific data type
const seedSpecific = async (type) => {
  try {
    console.log(`🚀 Starting ${type} seeding...`);
    
    // Connect to databases
    await connectDatabase();
    console.log('✅ Database connections established');
    
    switch (type.toLowerCase()) {
      case 'services':
        await seedServices();
        break;
      case 'products':
        await seedProducts();
        break;
      case 'podcasts':
        await seedPodcasts();
        break;
      default:
        console.error('❌ Invalid type. Use: services, products, or podcasts');
        process.exit(1);
    }
    
    console.log(`🎉 ${type} seeded successfully!`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await closeConnections();
    console.log('✅ Database connections closed');
    process.exit(0);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'all') {
  seedAll();
} else if (command === 'services' || command === 'products' || command === 'podcasts') {
  seedSpecific(command);
} else {
  console.log('🌱 Database Seeder');
  console.log('');
  console.log('Usage:');
  console.log('  node seed-data.js all                    - Seed all data');
  console.log('  node seed-data.js services               - Seed only services');
  console.log('  node seed-data.js products               - Seed only products');
  console.log('  node seed-data.js podcasts               - Seed only podcasts');
  console.log('');
  console.log('Examples:');
  console.log('  node seed-data.js all');
  console.log('  node seed-data.js services');
  console.log('');
  process.exit(0);
}
