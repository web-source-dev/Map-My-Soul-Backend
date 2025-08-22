const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAuth, requireAdmin } = require('../middleware/auth');
const createNewsletterModel = require('../models/newsletter');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Helper function to get models
const getModels = () => {
    return {
        Newsletter: createNewsletterModel()
    };
};

// Validation rules for newsletter subscription
const newsletterValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    
    body('source')
        .optional()
        .isIn(['popup', 'footer', 'homepage', 'manual', 'other'])
        .withMessage('Invalid source'),
    
    body('preferences')
        .optional()
        .isObject()
        .withMessage('Preferences must be an object')
];

// Subscribe to newsletter (public endpoint)
router.post('/subscribe', newsletterValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { Newsletter } = getModels();
        const { email, source = 'popup', preferences = {} } = req.body;

        // Check if email is already subscribed
        const existingSubscriber = await Newsletter.findOne({ 
            email: email.toLowerCase() 
        });

        if (existingSubscriber) {
            if (existingSubscriber.isSubscribed) {
                return res.status(400).json({
                    message: 'This email is already subscribed to our newsletter'
                });
            } else {
                // Resubscribe existing user
                await existingSubscriber.resubscribe();
                existingSubscriber.source = source;
                if (Object.keys(preferences).length > 0) {
                    await existingSubscriber.updatePreferences(preferences);
                }
                await existingSubscriber.save();
            }
        } else {
            // Create new subscriber
            const subscriber = new Newsletter({
                email: email.toLowerCase(),
                source,
                preferences,
                // Add user ID if authenticated
                userId: req.user?.userId || null,
                // Add request information
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            });

            await subscriber.save();
        }

        // Send welcome email
        try {
            const welcomeSubject = 'Welcome to Map My Soul Daily!';
            const welcomeMessage = `
                <h2>Welcome to Map My Soul Daily! 🌟</h2>
                <p>Dear ${email.split('@')[0]},</p>
                <p>Thank you for subscribing to our spiritual wellness newsletter! You're now part of our community of soul-seekers and wellness enthusiasts.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3>What you'll receive:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>✨ Daily spiritual insights and wisdom</li>
                        <li>🧘‍♀️ Mindfulness and meditation tips</li>
                        <li>💎 Crystal healing guidance</li>
                        <li>🌟 Exclusive offers on spiritual products</li>
                        <li>🎯 Personalized wellness recommendations</li>
                    </ul>
                </div>
                
                <p>Your first newsletter will arrive in your inbox soon. We're excited to be part of your spiritual journey!</p>
                
                <p>With love and light,<br>The Map My Soul Team</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    You can unsubscribe anytime by clicking the link at the bottom of our emails.
                </p>
            `;
            
            await sendEmail(email, welcomeSubject, welcomeMessage);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't fail the subscription if email fails
        }

        res.status(201).json({
            message: 'Successfully subscribed to newsletter',
            email: email.toLowerCase()
        });

    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(500).json({
            message: 'Failed to subscribe to newsletter',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Unsubscribe from newsletter (public endpoint)
router.post('/unsubscribe', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { Newsletter } = getModels();
        const { email } = req.body;

        const subscriber = await Newsletter.findOne({ 
            email: email.toLowerCase() 
        });

        if (!subscriber) {
            return res.status(404).json({
                message: 'Email not found in our newsletter list'
            });
        }

        if (!subscriber.isSubscribed) {
            return res.status(400).json({
                message: 'This email is already unsubscribed'
            });
        }

        await subscriber.unsubscribe();

        // Send confirmation email
        try {
            const confirmationSubject = 'You have been unsubscribed from Map My Soul Daily';
            const confirmationMessage = `
                <h2>Unsubscription Confirmed</h2>
                <p>Dear ${email.split('@')[0]},</p>
                <p>You have been successfully unsubscribed from Map My Soul Daily newsletter.</p>
                <p>We're sorry to see you go! If you change your mind, you can always resubscribe by visiting our website.</p>
                <p>Thank you for being part of our community.</p>
                <p>With love and light,<br>The Map My Soul Team</p>
            `;
            
            await sendEmail(email, confirmationSubject, confirmationMessage);
        } catch (emailError) {
            console.error('Error sending unsubscription email:', emailError);
        }

        res.json({
            message: 'Successfully unsubscribed from newsletter'
        });

    } catch (error) {
        console.error('Error unsubscribing from newsletter:', error);
        res.status(500).json({
            message: 'Failed to unsubscribe from newsletter',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
