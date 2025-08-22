const createUserAuthModel = require('../models/userAuth');
const createAnonymousQuizDataModel = require('../models/anonymousQuizData');
const createAuditLogModel = require('../models/auditLog');

// HIPAA requires retention for 6 years from last activity
const RETENTION_PERIOD_DAYS = 6 * 365; // 6 years

const cleanupExpiredData = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_PERIOD_DAYS);

    const UserAuth = createUserAuthModel();
    const AnonymousQuizData = createAnonymousQuizDataModel();
    const AuditLog = createAuditLogModel();

    // Find inactive users (no activity in 6 years)
    const inactiveUsers = await UserAuth.find({
      updatedAt: { $lt: cutoffDate },
      lastActivityAt: { $lt: cutoffDate }
    });

    console.log(`Found ${inactiveUsers.length} inactive users for cleanup`);

    for (const user of inactiveUsers) {
      // Delete associated quiz data
      await AnonymousQuizData.deleteMany({ userId: user._id });
      
      // Delete audit logs
      await AuditLog.deleteMany({ userId: user._id });
      
      // Anonymize user data instead of deleting (HIPAA requirement)
      user.firstName = 'ANONYMIZED';
      user.lastName = 'ANONYMIZED';
      user.email = `anonymized_${user._id}@deleted.com`;
      user.dateOfBirth = null;
      user.birthPlace = null;
      user.isDeleted = true;
      user.deletedAt = new Date();
      
      await user.save();
    }

    console.log(`Successfully cleaned up ${inactiveUsers.length} inactive users`);
  } catch (error) {
    console.error('Data retention cleanup error:', error);
  }
};

// Mark user as active
const markUserActive = async (userId) => {
  try {
    const UserAuth = createUserAuthModel();
    await UserAuth.findByIdAndUpdate(userId, {
      lastActivityAt: new Date()
    });
  } catch (error) {
    console.error('Error marking user as active:', error);
  }
};

// Get data retention statistics
const getRetentionStats = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_PERIOD_DAYS);

    const UserAuth = createUserAuthModel();
    const AnonymousQuizData = createAnonymousQuizDataModel();
    const AuditLog = createAuditLogModel();

    const stats = {
      totalUsers: await UserAuth.countDocuments(),
      activeUsers: await UserAuth.countDocuments({ updatedAt: { $gte: cutoffDate } }),
      inactiveUsers: await UserAuth.countDocuments({ updatedAt: { $lt: cutoffDate } }),
      totalQuizData: await AnonymousQuizData.countDocuments(),
      totalAuditLogs: await AuditLog.countDocuments(),
      retentionPeriodDays: RETENTION_PERIOD_DAYS
    };

    return stats;
  } catch (error) {
    console.error('Error getting retention stats:', error);
    return null;
  }
};

module.exports = {
  cleanupExpiredData,
  markUserActive,
  getRetentionStats,
  RETENTION_PERIOD_DAYS
};
