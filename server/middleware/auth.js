const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Not authorized to access this route' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Not authorized', error: error.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to access this resource' });
    }
    next();
  };
};

module.exports = { protect, authorize };