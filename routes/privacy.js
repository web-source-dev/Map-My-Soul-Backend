const express = require('express');
const createUserAuthModel = require('../models/userAuth');
const createAnonymousQuizDataModel = require('../models/anonymousQuizData');
const { authenticateToken, requireAuth } = require('../middleware/auth');
const { auditPHIUpdate } = require('../middleware/audit');

const router = express.Router();

// Get privacy policy
router.get('/policy', (req, res) => {
  res.json({
    policy: {
      version: '1.0',
      lastUpdated: '2024-01-01',
      title: 'Privacy Policy & HIPAA Compliance',
      sections: [
        {
          title: 'Data Collection',
          content: 'We collect only necessary information for providing wellness services including birth information and wellness preferences.'
        },
        {
          title: 'Data Use',
          content: 'Your data is used solely for providing personalized wellness recommendations and services.'
        },
        {
          title: 'Data Protection',
          content: 'All data is encrypted in transit and at rest. We maintain comprehensive audit logs of all data access.'
        },
        {
          title: 'Data Retention',
          content: 'Data is retained for 6 years as required by HIPAA, then automatically anonymized.'
        },
        {
          title: 'Your Rights',
          content: 'You have the right to access, correct, or delete your data at any time.'
        }
      ]
    }
  });
});

// Give consent
router.post('/consent', authenticateToken, requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { consentGiven, consentVersion } = req.body;

    const UserAuth = createUserAuthModel();
    const user = await UserAuth.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.consentGiven = consentGiven;
    user.consentDate = new Date();
    user.consentVersion = consentVersion || '1.0';
    
    await user.save();

    // Audit log the consent
    await auditPHIUpdate(req, 'USER_PROFILE', user._id, {
      consentGiven,
      consentVersion,
      consentDate: user.consentDate
    });

    res.json({
      message: 'Consent updated successfully',
      success: true
    });

  } catch (error) {
    console.error('Consent update error:', error);
    res.status(500).json({ 
      message: 'Failed to update consent',
      error: error.message 
    });
  }
});

// Request data export (GDPR/HIPAA right)
router.post('/export', authenticateToken, requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const UserAuth = createUserAuthModel();
    const AnonymousQuizData = createAnonymousQuizDataModel();
    
    const user = await UserAuth.findById(userId);
    const quizData = await AnonymousQuizData.findOne({ userId });

    const exportData = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        birthPlace: user.birthPlace,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      quizData: quizData ? {
        dateOfBirth: quizData.dateOfBirth,
        birthTime: quizData.birthTime,
        birthPlace: quizData.birthPlace,
        currentChallenge: quizData.currentChallenge,
        balanceActivities: quizData.balanceActivities,
        budget: quizData.budget,
        timeCommitment: quizData.timeCommitment,
        sessionPreference: quizData.sessionPreference,
        practitionerType: quizData.practitionerType,
        eligibleNonprofit: quizData.eligibleNonprofit,
        productInterest: quizData.productInterest,
        createdAt: quizData.createdAt,
        updatedAt: quizData.updatedAt
      } : null,
      exportDate: new Date(),
      exportRequestedBy: userId
    };

    // Audit log the export
    await auditPHIUpdate(req, 'USER_PROFILE', user._id, {
      action: 'DATA_EXPORT',
      exportDate: exportData.exportDate
    });

    res.json({
      message: 'Data export generated successfully',
      data: exportData,
      success: true
    });

  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ 
      message: 'Failed to export data',
      error: error.message 
    });
  }
});

// Request data deletion (GDPR right)
router.post('/delete', authenticateToken, requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const UserAuth = createUserAuthModel();
    const AnonymousQuizData = createAnonymousQuizDataModel();
    
    const user = await UserAuth.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Anonymize user data instead of deleting (HIPAA requirement)
    user.firstName = 'DELETED';
    user.lastName = 'DELETED';
    user.email = `deleted_${user._id}@deleted.com`;
    user.dateOfBirth = null;
    user.birthPlace = null;
    user.isDeleted = true;
    user.deletedAt = new Date();
    
    await user.save();

    // Delete associated quiz data
    await AnonymousQuizData.deleteMany({ userId });

    // Audit log the deletion
    await auditPHIUpdate(req, 'USER_PROFILE', user._id, {
      action: 'DATA_DELETION',
      deletionDate: user.deletedAt
    });

    res.json({
      message: 'Data deletion request processed successfully',
      success: true
    });

  } catch (error) {
    console.error('Data deletion error:', error);
    res.status(500).json({ 
      message: 'Failed to process deletion request',
      error: error.message 
    });
  }
});

module.exports = router;
