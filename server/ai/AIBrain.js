const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

/**
 * AI Brain System for Indian Telegram
 * Handles intelligent responses, sentiment analysis, and chatbot functionality
 */

class AIBrain {
  constructor() {
    this.name = 'ARIA'; // Artificial Reasoning Intelligence Assistant
    this.personality = 'friendly and helpful';
    this.language = 'Hindi/English'; // Bilingual support for Indian users
    this.memory = new Map(); // Store conversation context
    this.learningData = {
      commonQuestions: [],
      userPreferences: {},
      conversationHistory: []
    };
    this.initialized = false;
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Initialize the AI Brain
   */
  async initialize() {
    try {
      console.log('🧠 Initializing AI Brain (ARIA)...');
      this.initialized = true;
      console.log('✅ AI Brain initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Brain:', error);
      return false;
    }
  }

  /**
   * Process user message and generate intelligent response
   */
  async processMessage(userId, message, chatId) {
    try {
      if (!this.initialized) await this.initialize();

      // Store message in memory
      this.storeMessage(userId, message, chatId);

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(message);

      // Detect intent
      const intent = this.detectIntent(message);

      // Generate response based on intent
      let response = await this.generateResponse(message, intent, sentiment, userId);

      // Learn from interaction
      this.learn(userId, message, response, intent);

      return {
        response,
        intent,
        sentiment,
        confidence: this.calculateConfidence(message),
        suggestions: this.generateSuggestions(intent),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return this.getDefaultResponse(error);
    }
  }

  /**
   * Analyze sentiment of the message
   */
  analyzeSentiment(message) {
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'happy', 'love', 'bahut', 'accha', 'badiya'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'disappointed', 'zyada', 'bura'];
    const neutralWords = ['ok', 'fine', 'normal', 'average', 'theek', 'sahi'];

    const lowerMessage = message.toLowerCase();
    
    let positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    let negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    let neutralCount = neutralWords.filter(word => lowerMessage.includes(word)).length;

    if (positiveCount > negativeCount) {
      return { type: 'positive', score: 0.7 + (positiveCount * 0.1) };
    } else if (negativeCount > positiveCount) {
      return { type: 'negative', score: -(0.7 + (negativeCount * 0.1)) };
    } else {
      return { type: 'neutral', score: 0 };
    }
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    const lowerMessage = message.toLowerCase();

    const intents = {
      greeting: {
        keywords: ['hi', 'hello', 'hey', 'namaste', 'salam', 'namaskar'],
        confidence: 0
      },
      goodbye: {
        keywords: ['bye', 'goodbye', 'see you', 'bye bye', 'ta', 'farewell'],
        confidence: 0
      },
      help: {
        keywords: ['help', 'assist', 'guide', 'how to', 'how do i', 'madad', 'sahayta'],
        confidence: 0
      },
      information: {
        keywords: ['what is', 'who is', 'when', 'where', 'why', 'kya hai', 'kaun hai'],
        confidence: 0
      },
      emotion: {
        keywords: ['feel', 'feeling', 'emotion', 'mood', 'stressed', 'happy', 'mahsus'],
        confidence: 0
      },
      joke: {
        keywords: ['joke', 'funny', 'laugh', 'meme', 'hasao', 'mazak'],
        confidence: 0
      },
      settings: {
        keywords: ['settings', 'change', 'update', 'modify', 'preference', 'badlo', 'settings'],
        confidence: 0
      }
    };

    // Calculate confidence for each intent
    for (const [intent, data] of Object.entries(intents)) {
      const matchCount = data.keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      intents[intent].confidence = matchCount / data.keywords.length;
    }

    // Find intent with highest confidence
    const detectedIntent = Object.entries(intents).reduce((a, b) => 
      b[1].confidence > a[1].confidence ? b : a
    );

    return {
      type: detectedIntent[0],
      confidence: detectedIntent[1].confidence,
      allIntents: intents
    };
  }

  /**
   * Generate intelligent response
   */
  async generateResponse(message, intent, sentiment, userId) {
    const responses = {
      greeting: [
        "नमस्ते! 👋 कैसे हो? मैं ARIA हूँ। मैं आपकी मदद कर सकती हूँ। Hello! How can I assist you today?",
        "Hey there! 😊 Welcome to Indian Telegram. What can I do for you?",
        "नमस्कार! 🙏 बहुत खुशी हुई। क्या मैं कुछ मदद कर सकती हूँ?"
      ],
      goodbye: [
        "अलविदा! 👋 फिर मिलेंगे। Goodbye, see you soon!",
        "Bye! Take care! 😊",
        "आपसे बात करके खुशी हुई। फिर आना। Catch you later!"
      ],
      help: [
        "मैं आपकी मदद के लिए यहाँ हूँ! 💪 आप क्या जानना चाहते हो?",
        "I'm here to help! What do you need assistance with?",
        "कोई समस्या है? बताओ, मैं सहायता करूँगी।"
      ],
      information: [
        "बहुत अच्छा सवाल! Let me think about that...",
        "That's a great question! Let me provide you with information.",
        "मुझे लगता है मैं इसमें मदद कर सकती हूँ।"
      ],
      emotion: [
        "मुझे आपकी भावनाओं की चिंता है। 💙 क्या सब ठीक है?",
        "I'm here for you. Do you want to talk about it?",
        "तुम्हारी भावनाएं महत्वपूर्ण हैं। मैं सुनने के लिए यहाँ हूँ।"
      ],
      joke: [
        "हाहा! 😄 यहाँ एक जोक है: क्यों कंप्यूटर गर्म है? क्योंकि उसका फैन टूट गया! Why did the AI go to school? To improve its neural networks! 🤖",
        "हा हा! 😂 मुझे एक मजेदार बात बताऊँ: भारत में इंटरनेट इतना धीमा क्यों है? क्योंकि सभी डेटा भारी है! 📱",
        "Here's a funny one for you: What did the programmer say to the computer? 'You've got issues!' 😄"
      ],
      settings: [
        "आपकी प्राथमिकताएं बदलने के लिए, कृपया सेटिंग्स मेनू खोलें।",
        "You can update your preferences in the settings section.",
        "सेटिंग्स में जाकर अपनी पसंद बदल सकते हो।"
      ]
    };

    const intentResponses = responses[intent.type] || responses.information;
    
    // Adjust response based on sentiment
    let selectedResponse = intentResponses[Math.floor(Math.random() * intentResponses.length)];
    
    if (sentiment.type === 'negative') {
      selectedResponse = this.adaptToNegativeSentiment(selectedResponse);
    } else if (sentiment.type === 'positive') {
      selectedResponse = this.adaptToPositiveSentiment(selectedResponse);
    }

    return selectedResponse;
  }

  /**
   * Adapt response to negative sentiment
   */
  adaptToNegativeSentiment(response) {
    return `मुझे लगता है आप चिंतित हो सकते हैं। 💙 ${response}`;
  }

  /**
   * Adapt response to positive sentiment
   */
  adaptToPositiveSentiment(response) {
    return `शानदार! 🌟 ${response}`;
  }

  /**
   * Generate helpful suggestions
   */
  generateSuggestions(intent) {
    const suggestions = {
      greeting: ['Ask me anything', 'बता अपनी समस्या', 'Need help?'],
      goodbye: ['See you later!', 'फिर बात करेंगे', 'Take care!'],
      help: ['How can I assist?', 'क्या और मदद चाहिए?', 'I\'m here for you'],
      information: ['Tell me more', 'और बताओ', 'Anything else?'],
      emotion: ['Share your feelings', 'अपनी भावनाएं साझा करो', 'I understand'],
      joke: ['Tell another', 'एक और जोक', 'That was funny!'],
      settings: ['View preferences', 'प्राथमिकताएं देखें', 'Customize now']
    };

    return suggestions[intent.type] || ['Tell me more', 'Continue...'];
  }

  /**
   * Calculate response confidence
   */
  calculateConfidence(message) {
    // Confidence based on message clarity
    const wordCount = message.split(' ').length;
    const hasQuestionMark = message.includes('?');
    const isPunctuated = /[.!?]$/.test(message);

    let confidence = 0.5; // Base confidence
    if (wordCount > 3) confidence += 0.2;
    if (hasQuestionMark) confidence += 0.15;
    if (isPunctuated) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  /**
   * Store message in memory for learning
   */
  storeMessage(userId, message, chatId) {
    if (!this.memory.has(userId)) {
      this.memory.set(userId, []);
    }
    
    const userHistory = this.memory.get(userId);
    userHistory.push({
      message,
      chatId,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages per user
    if (userHistory.length > 50) {
      userHistory.shift();
    }
  }

  /**
   * Learn from user interactions
   */
  learn(userId, message, response, intent) {
    if (!this.learningData.userPreferences[userId]) {
      this.learningData.userPreferences[userId] = {
        preferredIntent: {},
        language: 'mixed'
      };
    }

    const prefs = this.learningData.userPreferences[userId];
    prefs.preferredIntent[intent.type] = (prefs.preferredIntent[intent.type] || 0) + 1;

    // Detect language preference
    const hindiChars = /[\u0900-\u097F]/.test(message);
    if (hindiChars) prefs.language = 'hindi';
  }

  /**
   * Get user preference
   */
  getUserPreference(userId) {
    return this.learningData.userPreferences[userId] || {
      preferredIntent: {},
      language: 'english'
    };
  }

  /**
   * Default response for errors
   */
  getDefaultResponse(error) {
    return {
      response: "क्षमा करें! मुझे एक समस्या आई। Sorry for the inconvenience. Please try again.",
      intent: { type: 'error', confidence: 0 },
      sentiment: { type: 'neutral', score: 0 },
      confidence: 0.3,
      suggestions: ['Try again', 'फिर से कोशिश करें'],
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }

  /**
   * Get AI brain stats
   */
  getStats() {
    return {
      name: this.name,
      status: this.initialized ? 'active' : 'inactive',
      totalUsers: this.memory.size,
      totalLearnings: Object.keys(this.learningData.userPreferences).length,
      memory: {
        users: this.memory.size,
        preferences: Object.keys(this.learningData.userPreferences).length
      },
      uptime: new Date().toISOString()
    };
  }

  /**
   * Predict user mood based on history
   */
  predictUserMood(userId) {
    const prefs = this.learningData.userPreferences[userId];
    if (!prefs) return 'unknown';

    const history = this.memory.get(userId) || [];
    if (history.length === 0) return 'neutral';

    // Simple mood prediction based on recent messages
    const recentMessages = history.slice(-5);
    const moods = recentMessages.map(msg => this.analyzeSentiment(msg.message));
    
    const avgScore = moods.reduce((sum, mood) => sum + mood.score, 0) / moods.length;
    
    if (avgScore > 0.3) return 'happy';
    if (avgScore < -0.3) return 'sad';
    return 'neutral';
  }
}

module.exports = AIBrain;