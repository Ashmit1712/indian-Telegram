const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const AIController = require('./ai/AIController');
const aiRoutes = require('./routes/aiRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize AI Controller
const aiController = new AIController();
aiController.init().catch(err => console.error('Failed to initialize AI:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Indian Telegram Server is running',
    timestamp: new Date().toISOString(),
    aiStatus: aiController.initialized ? 'active' : 'initializing'
  });
});

// AI Routes
app.use('/api/ai', aiRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  // User joins a chat
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
    socket.to(chatId).emit('user-joined', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // User sends a message
  socket.on('send-message', async (data) => {
    try {
      // Broadcast message to all users in chat
      io.to(data.chatId).emit('receive-message', {
        userId: socket.id,
        message: data.message,
        timestamp: new Date().toISOString(),
        type: 'user'
      });

      // Process message through AI Brain if AI is enabled
      if (process.env.AI_ENABLED !== 'false') {
        const aiResponse = await aiController.handleMessage(
          socket.id,
          data.message,
          data.chatId
        );

        // Send AI response after a small delay for natural conversation
        if (aiResponse && aiResponse.response) {
          setTimeout(() => {
            io.to(data.chatId).emit('receive-message', {
              userId: 'ARIA_AI',
              message: aiResponse.response,
              timestamp: new Date().toISOString(),
              type: 'ai',
              metadata: {
                intent: aiResponse.intent,
                sentiment: aiResponse.sentiment,
                confidence: aiResponse.confidence,
                suggestions: aiResponse.suggestions
              }
            });
          }, 500 + Math.random() * 1000); // Random delay 500-1500ms
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', {
        message: 'Failed to process message',
        error: error.message
      });
    }
  });

  // User typing
  socket.on('user-typing', (data) => {
    socket.to(data.chatId).emit('typing', {
      userId: socket.id,
      isTyping: data.isTyping
    });
  });

  // User leaves chat
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
    socket.to(chatId).emit('user-left', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Request AI chat (direct conversation with AI)
  socket.on('ai-chat', async (data) => {
    try {
      const aiResponse = await aiController.handleMessage(
        socket.id,
        data.message,
        'ai-chat'
      );

      socket.emit('ai-response', {
        response: aiResponse.response,
        intent: aiResponse.intent,
        sentiment: aiResponse.sentiment,
        confidence: aiResponse.confidence,
        suggestions: aiResponse.suggestions,
        timestamp: aiResponse.timestamp
      });
    } catch (error) {
      socket.emit('ai-error', {
        message: 'Failed to process AI request',
        error: error.message
      });
    }
  });

  // Request user mood prediction
  socket.on('request-mood', (userId) => {
    try {
      const mood = aiController.predictUserMood(userId);
      socket.emit('mood-prediction', {
        userId,
        mood,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error predicting mood:', error);
    }
  });

  // Request AI stats
  socket.on('request-ai-stats', () => {
    try {
      const stats = aiController.getStats();
      socket.emit('ai-stats', stats);
    } catch (error) {
      console.error('Error fetching AI stats:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Indian Telegram Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🤖 AI Brain (ARIA) is ${aiController.initialized ? '✅ ACTIVE' : '⏳ INITIALIZING'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});

module.exports = { app, server, io, aiController };