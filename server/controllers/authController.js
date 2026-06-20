const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const sendEmail = async (email, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    // Create user
    user = await User.create({
      username,
      email,
      password,
      phone,
      verificationToken: crypto.randomBytes(32).toString('hex'),
      verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${user.verificationToken}`;
    await sendEmail(email, 'Email Verification', `Please verify your email: ${verificationUrl}`);

    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ status: 'error', message: `User banned: ${user.banReason}` });
    }

    user.lastSeen = Date.now();
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ status: 'success', message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ status: 'success', user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, avatar, statusMessage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, bio, avatar, statusMessage, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({ status: 'success', user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Block user
// @route   POST /api/auth/block/:userId
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { blockedUsers: req.params.userId } },
      { new: true }
    );

    res.status(200).json({ status: 'success', message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Unblock user
// @route   POST /api/auth/unblock/:userId
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { blockedUsers: req.params.userId } },
      { new: true }
    );

    res.status(200).json({ status: 'success', message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Get blocked users
// @route   GET /api/auth/blocked
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', '-password');
    res.status(200).json({ status: 'success', blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};