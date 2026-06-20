const express = require('express');
const {
  register,
  login,
  verifyEmail,
  getMe,
  updateProfile,
  blockUser,
  unblockUser,
  getBlockedUsers
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);

module.exports = router;