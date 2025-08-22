const AuditLog = require('../models/auditLog');

const createAuditLog = async (req, action, resource, resourceId = null, details = {}) => {
  try {
    const auditEntry = new AuditLog({
      userId: req.user?.userId || null,
      action,
      resource,
      resourceId,
      ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      details,
      timestamp: new Date()
    });

    await auditEntry.save();
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't fail the request if audit logging fails
  }
};

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const success = res.statusCode >= 200 && res.statusCode < 300;
      const details = {
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
        success
      };

      if (!success) {
        details.errorMessage = data;
      }

      createAuditLog(req, action, resource, req.params.id || null, details);
      originalSend.call(this, data);
    };

    next();
  };
};

// Specific audit functions for different operations
const auditPHIAccess = (req, resource, resourceId = null) => {
  return createAuditLog(req, 'ACCESS', resource, resourceId, {
    method: req.method,
    path: req.path,
    timestamp: new Date()
  });
};

const auditPHIRead = (req, resource, resourceId = null) => {
  return createAuditLog(req, 'READ', resource, resourceId, {
    method: req.method,
    path: req.path,
    timestamp: new Date()
  });
};

const auditPHIUpdate = (req, resource, resourceId = null, changes = {}) => {
  return createAuditLog(req, 'UPDATE', resource, resourceId, {
    method: req.method,
    path: req.path,
    changes,
    timestamp: new Date()
  });
};

const auditPHICreate = (req, resource, resourceId = null, data = {}) => {
  return createAuditLog(req, 'CREATE', resource, resourceId, {
    method: req.method,
    path: req.path,
    data,
    timestamp: new Date()
  });
};

module.exports = {
  auditMiddleware,
  auditPHIAccess,
  auditPHIRead,
  auditPHIUpdate,
  auditPHICreate,
  createAuditLog
};
