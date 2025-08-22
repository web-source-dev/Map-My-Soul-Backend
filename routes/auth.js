const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const createUserAuth = require('../models/userAuth');
const createUserProfile = require('../models/userProfile');
const { generateToken } = require('../utils/token');
const { authenticateToken } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

const router = express.Router();

// Helper function to get models
const getModels = () => {
  const UserAuth = createUserAuth();
  const UserProfile = createUserProfile();
  return { UserAuth, UserProfile };
};

// Helper function to format user response with computed properties
const formatUserResponse = (userAuth, userProfile = null) => {
  const isAuthenticated = true;
  const isUser = userAuth.role === 'user';
  const isAdmin = userAuth.role === 'admin';
  
  // Extract firstName and lastName from displayName if available
  let firstName = '';
  let lastName = '';
  if (userProfile && userProfile.displayName) {
    const nameParts = userProfile.displayName.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  return {
    id: userAuth._id,
    email: userAuth.email,
    role: userAuth.role,
    firstName,
    lastName,
    isAuthenticated,
    isUser,
    isAdmin,
    // Profile data if available
    ...(userProfile && {
      displayName: userProfile.displayName,
      avatar: userProfile.avatar,
      preferences: userProfile.preferences,
      wellnessGoals: userProfile.wellnessGoals
    })
  };
};

// Register/Signup
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth, birthPlace } = req.body;

    // Get models
    const { UserAuth, UserProfile } = getModels();
    
    // Check if user already exists
    const emailExists = await UserAuth.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user authentication record
    const userAuth = new UserAuth({
      email,
      password, // Will be hashed by pre-save middleware
      role: 'user'
    });

    await userAuth.save();

    // Create user profile record
    const userProfile = new UserProfile({
      userId: userAuth._id,
      displayName: `${firstName} ${lastName}`.trim(),
      // Store birth info in profile if needed (non-PHI)
      wellnessGoals: [],
      preferences: {
        theme: 'auto',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        language: 'en',
        timezone: 'UTC'
      }
    });

    await userProfile.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(userAuth.email, firstName);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT token
    const token = generateToken({
      userId: userAuth._id,
      email: userAuth.email,
      role: userAuth.role
    });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: formatUserResponse(userAuth, userProfile)
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { UserAuth, UserProfile } = getModels();

    // Find user by email
    const userAuth = await UserAuth.findByEmail(email);
    if (!userAuth) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password using the model method
    const isValidPassword = await userAuth.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId: userAuth._id });

    // Update last login
    userAuth.lastLoginAt = new Date();
    await userAuth.save();

    // Generate JWT token
    const token = generateToken({
      userId: userAuth._id,
      email: userAuth.email,
      role: userAuth.role
    });

    const userResponse = formatUserResponse(userAuth, userProfile);
    console.log('Login response - User data:', userResponse);
    console.log('Login response - Avatar:', userResponse.avatar);
    
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const { UserAuth } = getModels();

    const userAuth = await UserAuth.findByEmail(email);
    if (!userAuth) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour


    userAuth.resetToken = resetToken;
    userAuth.resetTokenExpires = resetTokenExpires;
    await userAuth.save();


    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    try {
      await sendPasswordResetEmail(userAuth.email, resetToken, resetUrl);
      res.json({
        message: 'Password reset email sent successfully',
        emailSent: true
      });
    } catch (emailError) {
      console.error('Password reset email error:', emailError);
      // Fallback: return token in response if email fails
      res.json({
        message: 'Password reset token generated (email failed)',
        resetToken,
        expiresAt: resetTokenExpires,
        emailSent: false
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const { UserAuth } = getModels();

    // Find all users with non-expired reset tokens and check each one
    const users = await UserAuth.find({
      resetTokenExpires: { $gt: Date.now() }
    });

    let userAuth = null;
    for (const user of users) {
      // Compare the plain resetToken with the decrypted token from database
      if (user.resetToken === resetToken) {
        userAuth = user;
        break;
      }
    }

    if (!userAuth) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Clear the reset token after successful use
    userAuth.resetToken = null;
    userAuth.resetTokenExpires = null;

    
    // Update password using the model method
    await userAuth.updatePassword(newPassword);
    

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify Token (for frontend to check if token is valid)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const { UserAuth, UserProfile } = getModels();
    const userAuth = await UserAuth.findById(req.user.userId);
    if (!userAuth) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ userId: userAuth._id });
    
    res.json({
      isValid: true,
      user: formatUserResponse(userAuth, userProfile)
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { UserProfile } = getModels();
    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json({
      profile: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, avatar, preferences, wellnessGoals } = req.body;
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Track what fields were actually updated
    const updatedFields = {};
    const originalProfile = userProfile.toObject();

    // Update only the fields that are provided and have changed
    if (displayName !== undefined && displayName !== userProfile.displayName) {
      userProfile.displayName = displayName;
      updatedFields.displayName = displayName;
    }
    
    if (avatar !== undefined && avatar !== userProfile.avatar) {
      userProfile.avatar = avatar;
      updatedFields.avatar = avatar;
    }
    
    if (preferences !== undefined) {
      userProfile.preferences = { ...userProfile.preferences, ...preferences };
      updatedFields.preferences = preferences;
    }
    
    if (wellnessGoals !== undefined) {
      userProfile.wellnessGoals = wellnessGoals;
      updatedFields.wellnessGoals = wellnessGoals;
    }

    // Only save if there are actual changes
    if (Object.keys(updatedFields).length > 0) {
      // Add activity log with only the changed fields
      userProfile.activityHistory.push({
        action: 'profile_updated',
        timestamp: new Date(),
        details: updatedFields
      });

      await userProfile.save();
      
      console.log('Profile updated with fields:', updatedFields);
    } else {
      console.log('No profile changes detected');
    }

    res.json({
      message: 'Profile updated successfully',
      profile: userProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { UserAuth } = getModels();

    const userAuth = await UserAuth.findById(req.user.userId);
    if (!userAuth) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await userAuth.verifyPassword(currentPassword);
    if (!isValidPassword) { 
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Clear any existing reset tokens when password is changed
    userAuth.resetToken = null;
    userAuth.resetTokenExpires = null;

    // Update password using the model method
    await userAuth.updatePassword(newPassword);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload image to Cloudinary
router.post('/upload-image', authenticateToken, async (req, res) => {
  try {
    const { imageData } = req.body; // Base64 image data
    
    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' });
    }

    // Cloudinary configuration
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageData, {
      folder: 'user-avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Cart Management Routes
router.post('/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1, productDetails } = req.body;
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Check if product already in cart
    const existingItem = userProfile.cart.find(item => item.productId === productId);
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      existingItem.addedAt = new Date();
    } else {
      // Add new item with product details
      const cartItem = { 
        productId, 
        quantity, 
        addedAt: new Date(),
        name: productDetails?.name || 'Unknown Product',
        price: productDetails?.price || 0,
        imageUrl: productDetails?.imageUrl || null
      };
      
      userProfile.cart.push(cartItem);
    }

    // Add activity log
    userProfile.activityHistory.push({
      action: 'cart_added',
      timestamp: new Date(),
      details: { productId, quantity }
    });

    await userProfile.save();

    res.json({
      message: 'Product added to cart successfully',
      cart: userProfile.cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const { UserProfile } = getModels();
    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json({
      cart: userProfile.cart || []
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/cart/update', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const cartItem = userProfile.cart.find(item => item.productId === productId);
    if (!cartItem) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      userProfile.cart = userProfile.cart.filter(item => item.productId !== productId);
    } else {
      cartItem.quantity = quantity;
    }

    await userProfile.save();

    res.json({
      message: 'Cart updated successfully',
      cart: userProfile.cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/cart/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    userProfile.cart = userProfile.cart.filter(item => item.productId !== productId);
    await userProfile.save();

    res.json({
      message: 'Product removed from cart successfully',
      cart: userProfile.cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear entire cart
router.delete('/cart/clear', authenticateToken, async (req, res) => {
  try {
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    userProfile.cart = [];
    await userProfile.save();

    res.json({
      message: 'Cart cleared successfully',
      cart: []
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Wishlist Management Routes
router.post('/wishlist/add', authenticateToken, async (req, res) => {
  try {
    const { productId, productDetails } = req.body;
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Check if product already in wishlist
    const existingItem = userProfile.wishlist.find(item => item.productId === productId);
    
    if (!existingItem) {
      // Add new item with product details
      const wishlistItem = { 
        productId, 
        addedAt: new Date(),
        name: productDetails?.name || 'Unknown Product',
        price: productDetails?.price || 0,
        imageUrl: productDetails?.imageUrl || null
      };
      
      userProfile.wishlist.push(wishlistItem);
      
      // Add activity log
      userProfile.activityHistory.push({
        action: 'wishlist_added',
        timestamp: new Date(),
        details: { productId }
      });

      await userProfile.save();
    }

    res.json({
      message: 'Product added to wishlist successfully',
      wishlist: userProfile.wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const { UserProfile } = getModels();
    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json({
      wishlist: userProfile.wishlist || []
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/wishlist/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    userProfile.wishlist = userProfile.wishlist.filter(item => item.productId !== productId);
    await userProfile.save();

    res.json({
      message: 'Product removed from wishlist successfully',
      wishlist: userProfile.wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Clear entire wishlist
router.delete('/wishlist/clear', authenticateToken, async (req, res) => {
  try {
    const { UserProfile } = getModels();

    const userProfile = await UserProfile.findOne({ userId: req.user.userId });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    userProfile.wishlist = [];
    await userProfile.save();

    res.json({
      message: 'Wishlist cleared successfully',
      wishlist: []
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
