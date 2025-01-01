const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    default: null,
  },

  address: {
    type: String,
    default: null,
  },

  image: {
    type: String,
    default: 'default.jpg',
  },

  otp: {
    type: Number,
    default: null,
  },

  otpExpires: {
    type: Date,
    default: null,
  },

  verifyStatus: {
    type: Boolean,
    default: false,
  },

  loginAttempts: {
    type: Number,
    default: 0,
  },

  lockUntil: {
    type: Date,
    default: null,
  },

  lockCount: {
    type: Number,
    default: 0,
  },

  resetPasswordOTP: {
    type: Number,
    default: null,
  },

  resetPasswordExpires: {
    type: Date,
    default: null,
  },
});

const User = mongoose.model('users', userSchema);

module.exports = User;
