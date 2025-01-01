const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendVerificationEmail = require('../services/sentVerficationEmail');
const userSchema = require('../models/userModel');

const createUser = async (req, res) => {
  // 1. Check incoming data
  console.log(req.body);

  // destructuring
  const { full_name, email, password } = req.body;

  //  Validate data
  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  // Email format
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email is invalid',
    });
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  try {
    // 2. Check if user exists
    const user = await userModel.findOne({ email });

    if (user) {
      if (user.verifyStatus) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'User already exists. Please verify your account.',
        });
      }
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Destructuring the full_name
    const nameArray = full_name.split(' ');
    if (nameArray.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 words',
      });
    }

    console.log(nameArray);
    const first_name = nameArray[0];
    const middle_name = nameArray.length > 2 ? nameArray[1] : null;
    const last_name = nameArray[nameArray.length - 1];

    // Create a user
    const newUser = new userModel({
      firstName: first_name,
      middleName: middle_name,
      lastName: last_name,
      email: email,
      password: hashedPassword,
    });

    // Save user
    await newUser.save();

    return res.status(200).json({
      success: true,
      message: 'User created successfully',
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const sentVerificationEmail = async (req, res) => {
  // 1. Check incoming data
  console.log(req.body);

  // destructuring
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  // Email format
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email is invalid',
    });
  }

  try {
    // Check if user exists
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 2. Generate OTP
    const otp = generateOTP();

    // 3. Send email
    const emailSent = await sendVerificationEmail(req.body.email, otp);

    if (emailSent) {
      // 4. Save OTP and expiry date
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 3600000); // 60 minutes
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Email could not be sent',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// verify otp
const verifyOTP = async (req, res) => {
  // 1. Check incoming data
  console.log(req.body);

  // destructuring
  const { email, otp } = req.body;

  // Validate email
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required',
    });
  }

  // Email format
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email is invalid',
    });
  }

  try {
    // Check if user exists
    const user = await userModel.findOne({ email }).select('otp otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    console.log(user);
    // 2. Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // 3. Check OTP expiry
    if (user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    // 4. Update user
    user.verifyStatus = true;
    user.otp = 0;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// login user
const loginUser = async (req, res) => {
  // 1. Check incoming data
  console.log(req.body);

  // destructuring
  const { email, password } = req.body;

  // Validate email
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  // Email format
  const emailRegex = /\S+@\S+\.\S+/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email is invalid',
    });
  }

  try {
    // Check if user exists
    const user = await userModel.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    // Check if user is verified
    if (!user.verifyStatus) {
      return res.status(400).json({
        success: false,
        message: 'User is not verified',
        isVerified: false,
      });
    }

    if (user.lockUntil > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Account is locked',
        isLocked: true,
      });
    }

    if (user.lockCount >= 3) {
      // You are required to reset the password
      return res.status(400).json({
        success: false,
        message: 'Please reset your password',
      });
    }

    // 2. Compare passwords
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 3) {
        if ((user.lockCount = 1)) {
          // lock for 1min
          user.lockUntil = new Date(Date.now() + 60000);

          user.lockCount += 1;
          user.loginAttempts = 0;
        } else if ((user.lockCount = 2)) {
          // lock for 30min
          user.lockUntil = new Date(Date.now() + 1800000);
          user.lockCount += 1;
          user.loginAttempts = 0;
        } else if ((user.lockCount = 3)) {
          // lock for 1hr
          user.lockUntil = new Date(Date.now() + 3600000);
          user.lockCount += 1;
          user.loginAttempts = 0;
        }
      }

      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lockCount = 0;
    await user.save();

    // 3. Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// generate otp
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

// Exporting
module.exports = {
  createUser,
  sentVerificationEmail,
  verifyOTP,
  loginUser,
};
