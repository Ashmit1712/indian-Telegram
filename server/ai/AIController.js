/**
 * AI Controller
 * Handles AI Brain interactions and API endpoints
 */

const AIBrain = require('./AIBrain');

class AIController {
  constructor() {
    this.aiBrain = new AIBrain();
    this.initialized = false;
  }

  /**
   * Initialize AI Controller
   */
  async init() {
    try {
      await this.aiBrain.initialize();
      this.initialized = true;
      console.log('✅ AI Controller initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AI Controller:', error);
    }
  }

  /**
   * Handle AI message processing
   */
  async handleMessage(userId, message, chatId) {
    if (!this.initialized) await this.init();

    try {
      const result = await this.aiBrain.processMessage(userId, message, chatId);
      return result;
    } catch (error) {
      console.error('Error in handleMessage:', error);
      return this.aiBrain.getDefaultResponse(error);
    }
  }

  /**
   * Get AI stats
   */
  getStats() {
    return this.aiBrain.getStats();
  }

  /**
   * Get user AI preferences
   */
  getUserPreferences(userId) {
    return this.aiBrain.getUserPreference(userId);
  }

  /**
   * Predict user mood
   */
  predictUserMood(userId) {
    return this.aiBrain.predictUserMood(userId);
  }

  /**
   * Get user conversation history
   */
  getUserHistory(userId, limit = 10) {
    const history = this.aiBrain.memory.get(userId) || [];
    return history.slice(-limit);
  }
}

module.exports = AIController;