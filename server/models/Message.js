const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() { return !this.media; }
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file', 'document']
    },
    url: String,
    filename: String,
    size: Number,
    duration: Number,
    thumbnail: String
  }],
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'sticker', 'gif', 'location', 'contact', 'system'],
    default: 'text'
  },
  reply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: String,
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  isSpam: {
    type: Boolean,
    default: false
  },
  encryptedContent: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);