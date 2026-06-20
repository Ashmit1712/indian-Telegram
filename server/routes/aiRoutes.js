/**
 * AI Routes
 * REST API endpoints for AI Brain functionality
 */

const express = require('express');
const AIController = require('./AIController');

const router = express.Router();
const aiController = new AIController();

// Initialize AI Controller
aiController.init();

/**
 * POST /api/ai/message
 * Process a message through AI Brain
 */
router.post('/message', async (req, res) => {
  try {
    const { userId, message, chatId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'userId and message are required'
      });
    }

    const result = await aiController.handleMessage(userId, message, chatId || 'general');

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process message',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/stats
 * Get AI Brain statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = aiController.getStats();
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/mood/:userId
 * Predict user mood
 */
router.get('/mood/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const mood = aiController.predictUserMood(userId);

    res.status(200).json({
      status: 'success',
      data: { userId, mood }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to predict mood',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/preferences/:userId
 * Get user AI preferences
 */
router.get('/preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = aiController.getUserPreferences(userId);

    res.status(200).json({
      status: 'success',
      data: { userId, preferences }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/history/:userId
 * Get user conversation history
 */
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const history = aiController.getUserHistory(userId, limit);

    res.status(200).json({
      status: 'success',
      data: { userId, history }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch history',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/chat
 * AI Chat endpoint for direct conversation
 */
router.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'userId and message are required'
      });
    }

    const response = await aiController.handleMessage(userId, message, 'ai-chat');

    res.status(200).json({
      status: 'success',
      data: response
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process chat',
      error: error.message
    });
  }
});

module.exports = router;