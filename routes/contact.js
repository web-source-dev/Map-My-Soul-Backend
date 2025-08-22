const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAuth, requireAdmin } = require('../middleware/auth');
const createContactModel = require('../models/contact');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Helper function to get models
const getModels = () => {
    return {
        Contact: createContactModel()
    };
};

// Validation rules for contact form
const contactValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    
    body('subject')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Subject must be between 5 and 200 characters'),
    
    body('message')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Message must be between 10 and 2000 characters'),
    
    body('contactType')
        .optional()
        .isIn(['general', 'support', 'feedback', 'partnership', 'other'])
        .withMessage('Invalid contact type'),
    
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority level')
];

// Submit contact form (public endpoint)
router.post('/submit', contactValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { Contact } = getModels();
        const {
            name,
            email,
            subject,
            message,
            contactType = 'general',
            priority = 'medium'
        } = req.body;

        // Create new contact record
        const contact = new Contact({
            name,
            email,
            subject,
            message,
            contactType,
            priority,
            // Add user ID if authenticated
            userId: req.user?.userId || null,
            // Add request information
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });

        await contact.save();

        // Send confirmation email to user
        try {
            const confirmationSubject = `Thank you for contacting Map My Soul - ${subject}`;
            const confirmationMessage = `
                <h2>Thank you for contacting Map My Soul!</h2>
                <p>Dear ${name},</p>
                <p>We have received your message and will get back to you as soon as possible.</p>
                <p><strong>Your message:</strong></p>
                <p>${message}</p>
                <p>Reference ID: ${contact._id}</p>
                <p>We typically respond within 24-48 hours.</p>
                <p>Best regards,<br>The Map My Soul Team</p>
            `;
            
            await sendEmail(email, confirmationSubject, confirmationMessage);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the contact submission if email fails
        }

        // Send notification to admin (if configured)
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
            if (adminEmail) {
                const notificationSubject = `New Contact Form Submission - ${contactType}`;
                const notificationMessage = `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>From:</strong> ${name} (${email})</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Type:</strong> ${contactType}</p>
                    <p><strong>Priority:</strong> ${priority}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                    <p><strong>Reference ID:</strong> ${contact._id}</p>
                `;
                
                await sendEmail(adminEmail, notificationSubject, notificationMessage);
            }
        } catch (adminEmailError) {
            console.error('Error sending admin notification:', adminEmailError);
        }

        res.status(201).json({
            message: 'Contact form submitted successfully',
            contactId: contact._id,
            referenceId: contact._id
        });

    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({
            message: 'Failed to submit contact form',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
