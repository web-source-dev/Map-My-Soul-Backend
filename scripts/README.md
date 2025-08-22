# Backend Scripts

This directory contains utility scripts for the Map My Soul backend.

## Scripts Overview

### Database Seeding

#### `seed-data.js`
Populates the database with sample services, products, and podcasts for the spiritual wellness website.

**Usage:**
```bash
# Seed all data (services, products, and podcasts)
node seed-data.js all

# Seed specific data types
node seed-data.js services
node seed-data.js products
node seed-data.js podcasts

# Show help
node seed-data.js
```

**What it seeds:**

**Services (8 items):**
- Personal Astrology Reading
- Tarot Card Reading
- Crystal Healing Session
- Aura Cleansing
- Spiritual Life Coaching
- Meditation & Mindfulness Training
- Reiki Energy Healing
- Numerology Reading

**Products (8 items):**
- Amethyst Crystal Set
- Sage Smudging Bundle
- Tarot Deck - Rider Waite
- Meditation Cushion Set
- Essential Oil Set - Spiritual
- Moon Phase Calendar
- Crystal Grid Kit
- Spiritual Journal

**Podcasts (8 items):**
- Understanding Your Birth Chart
- Crystal Healing Fundamentals
- Daily Meditation Guide
- Tarot Wisdom for Life
- Energy Healing Techniques
- Spiritual Growth Journey
- Moon Magic & Rituals
- Numerology for Beginners

### Security Scripts

#### `generate-secret.js`
Generates secure random secrets for JWT tokens and other cryptographic purposes.

**Usage:**
```bash
node generate-secret.js
```

#### `generate-encryption-key.js`
Generates encryption keys for data encryption/decryption operations.

**Usage:**
```bash
node generate-encryption-key.js
```

## Database Structure

The seeding script works with the following database structure:

### Database 1 (User Data)
- UserAuth
- UserProfile
- AnonymousQuizData
- AuditLog

### Database 2 (Business Data)
- **Service** - Spiritual services offered
- **Product** - Physical products for sale
- **Podcast** - Audio content for spiritual growth

## Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```env
# Database connections
MONGODB_URI_1=mongodb://localhost:27017/mapmysoul_users
MONGODB_URI_2=mongodb://localhost:27017/mapmysoul_business

# Node environment
NODE_ENV=development
```

## Running Scripts

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Run the desired script:
   ```bash
   node scripts/seed-data.js all
   ```

## Notes

- The seed script will clear existing data before inserting new data
- All services are assigned unique ObjectIds for the `uniqueId` field
- Product image URLs reference existing assets in the frontend
- Podcast audio URLs are placeholder examples and should be updated with real URLs
- The script automatically handles database connections and cleanup

## Customization

To add more data or modify existing data:

1. Edit the arrays in `seed-data.js`:
   - `servicesData` for services
   - `productsData` for products
   - `podcastsData` for podcasts

2. Run the script again to update the database

3. For production, consider creating separate seed files for different environments
