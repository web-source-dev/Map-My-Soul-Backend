const { verifyToken } = require('../utils/token');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid token' });
  }

  req.user = decoded;
  next();
};

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  console.log ("user is authenticating", req.user);
  if (!req.user) {
    console.log ("user is not authenticating");
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// Middleware to check if user has user role
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'User access required' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireAuth,
  requireAdmin,
  requireUser
};
