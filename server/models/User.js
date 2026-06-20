const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User'
  },
  bio: {
    type: String,
    maxlength: 150,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'dnd'],
    default: 'offline'
  },
  statusMessage: {
    type: String,
    default: ''
  },
  statusExpiry: Date,
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiry: Date,
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi', 'ta', 'te', 'mr', 'gu'],
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      enabled: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true },
      dndStart: String,
      dndEnd: String
    },
    privacy: {
      lastSeenVisible: { type: Boolean, default: true },
      statusVisible: { type: Boolean, default: true },
      profileVisible: { type: Boolean, default: true }
    }
  },
  stats: {
    totalChats: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalGroupsCreated: { type: Number, default: 0 },
    joinedDate: { type: Date, default: Date.now }
  },
  rating: {
    avgRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    reviews: [{
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: Number,
      review: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  badges: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    avatar: this.avatar,
    bio: this.bio,
    status: this.status,
    statusMessage: this.statusMessage,
    lastSeen: this.lastSeen,
    rating: this.rating.avgRating,
    badges: this.badges,
    isVerified: this.isVerified
  };
};

module.exports = mongoose.model('User', userSchema);