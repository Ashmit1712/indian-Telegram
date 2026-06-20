const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group', 'channel'],
    default: 'direct'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  name: {
    type: String,
    required: function() { return this.type !== 'direct'; }
  },
  description: String,
  avatar: String,
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageTime: Date,
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.type === 'group' || this.type === 'channel'; }
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isMuted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  settings: {
    allowFiles: { type: Boolean, default: true },
    allowVoice: { type: Boolean, default: true },
    allowVideo: { type: Boolean, default: true },
    messageRetention: Number
  },
  encryptionEnabled: {
    type: Boolean,
    default: false
  },
  encryptionKey: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);