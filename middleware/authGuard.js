const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const authGuard = async (req, res, next) => {
  // Check incoming data
  console.log(req.headers);

  // get authorization data from headers
  const authHeader = req.headers.authorization;

  // check or validate
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: 'Authorization header not found',
    });
  }

  // split the data (Format: 'Bearer token) - only token
  const token = authHeader.split(' ')[1];
  // if token not found: stop the process (send res)
  if (!token || token === '') {
    return res.status(400).json({
      success: false,
      message: 'Token not found',
    });
  }
  // verify
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // check if user exists
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }
    next();
    // if verified : next(function in controller)
    // not verified : not authorized
  } catch (error) {
    console.log(error);
    res.status(401).json({
      success: false,
      message: 'Not authorized',
      error: error,
    });
  }
};

// Admin guard
const adminGuard = (req, res, next) => {
  // Check incoming data
  console.log(req.headers);

  // get authorization data from headers
  const authHeader = req.headers.authorization;

  // check or validate
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: 'Authorization header not found',
    });
  }

  // split the data (Format: 'Bearer token) - only token
  const token = authHeader.split(' ')[1];
  // if token not found: stop the process (send res)
  if (!token || token === '') {
    return res.status(400).json({
      success: false,
      message: 'Token not found',
    });
  }
  // verify
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (!req.user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Not admin',
      });
    }
    // if verified : next(function in controller)
    next();
    // not verified : not authorized
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Not authorized',
      error: error,
    });
  }
};

module.exports = {
  authGuard,
  adminGuard,
};
