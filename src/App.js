import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Socket connection
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentChat, setCurrentChat] = useState(null);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [aiStats, setAiStats] = useState(null);
  const [userMood, setUserMood] = useState(null);
  const [aiMode, setAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Socket connection effects
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
      // Request AI stats on connection
      socket.emit('request-ai-stats');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('receive-message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on('user-joined', (data) => {
      console.log('User joined:', data.userId);
      setUsers(prev => [...prev, data.userId]);
    });

    socket.on('user-left', (data) => {
      console.log('User left:', data.userId);
      setUsers(prev => prev.filter(id => id !== data.userId));
    });

    socket.on('typing', (data) => {
      setIsTyping(data.isTyping);
    });

    socket.on('ai-response', (data) => {
      setAiResponse(data);
      // Add AI response to messages
      setMessages(prev => [...prev, {
        userId: 'ARIA_AI',
        message: data.response,
        timestamp: data.timestamp,
        type: 'ai',
        metadata: {
          intent: data.intent,
          sentiment: data.sentiment
        }
      }]);
    });

    socket.on('ai-stats', (stats) => {
      setAiStats(stats);
    });

    socket.on('mood-prediction', (data) => {
      setUserMood(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handle joining a chat
  const handleJoinChat = (chatId) => {
    setCurrentChat(chatId);
    setMessages([]);
    setAiMode(false);
    socket.emit('join-chat', chatId);
  };

  // Handle joining AI chat
  const handleJoinAIChat = () => {
    setCurrentChat('ai-chat');
    setMessages([{
      userId: 'ARIA_AI',
      message: '👋 नमस्ते! मैं ARIA हूँ। आपका AI सहायक। Hello! I\'m ARIA, your AI Assistant. कैसे मैं आपकी मदद कर सकती हूँ?',
      timestamp: new Date().toISOString(),
      type: 'ai'
    }]);
    setAiMode(true);
  };

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentChat) {
      return;
    }

    if (aiMode) {
      // Send to AI
      socket.emit('ai-chat', {
        message: inputMessage,
        userId: socket.id
      });
    } else {
      // Send to chat
      socket.emit('send-message', {
        chatId: currentChat,
        message: inputMessage,
        timestamp: new Date().toISOString()
      });
    }

    setInputMessage('');
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (currentChat && !aiMode) {
      socket.emit('user-typing', {
        chatId: currentChat,
        isTyping: e.target.value.length > 0
      });
    }
  };

  // Handle leaving a chat
  const handleLeaveChat = () => {
    if (currentChat && !aiMode) {
      socket.emit('leave-chat', currentChat);
    }
    setCurrentChat(null);
    setMessages([]);
    setUsers([]);
    setAiMode(false);
  };

  // Request mood prediction
  const handleGetMood = () => {
    socket.emit('request-mood', socket.id);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🇮🇳 Indian Telegram</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
          {aiStats && <span className="ai-status">🤖 {aiStats.status}</span>}
        </div>
      </header>

      <div className="app-container">
        {/* Sidebar with chats */}
        <aside className="sidebar">
          <div className="chats-header">
            <h2>Chats</h2>
          </div>
          <div className="chats-list">
            <button 
              onClick={() => handleJoinChat('general')}
              className={`chat-item ${currentChat === 'general' ? 'active' : ''}`}
            >
              # General
            </button>
            <button 
              onClick={() => handleJoinChat('random')}
              className={`chat-item ${currentChat === 'random' ? 'active' : ''}`}
            >
              # Random
            </button>
            <button 
              onClick={() => handleJoinChat('announcements')}
              className={`chat-item ${currentChat === 'announcements' ? 'active' : ''}`}
            >
              📢 Announcements
            </button>
            <button 
              onClick={handleJoinAIChat}
              className={`chat-item ${currentChat === 'ai-chat' ? 'active' : ''}`}
            >
              🤖 Chat with ARIA
            </button>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="chat-area">
          {currentChat ? (
            <>
              <div className="chat-header">
                <h2>{aiMode ? '🤖 ARIA AI Assistant' : `#${currentChat}`}</h2>
                <div className="chat-info">
                  {!aiMode && <span>{users.length} Online</span>}
                  {userMood && <span className="mood-badge">Mood: {userMood.mood} 😊</span>}
                  <button onClick={handleLeaveChat} className="leave-btn">Leave</button>
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>{aiMode ? 'मुझसे कुछ पूछें! / Ask me something!' : 'No messages yet. Start the conversation! 💬'}</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.type === 'ai' ? 'ai-message' : ''}`}>
                      <div className="message-header">
                        <span className="message-user">
                          {msg.userId === 'ARIA_AI' ? '🤖 ARIA' : msg.userId.substring(0, 8) + '...'}
                        </span>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="message-content">{msg.message}</div>
                      {msg.metadata && (
                        <div className="message-metadata">
                          <span className={`intent-badge ${msg.metadata.intent?.type}`}>
                            {msg.metadata.intent?.type}
                          </span>
                          <span className={`sentiment-badge ${msg.metadata.sentiment?.type}`}>
                            {msg.metadata.sentiment?.type}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isTyping && <div className="typing-indicator">Someone is typing...</div>}
              </div>

              <div className="message-actions">
                {aiMode && (
                  <button onClick={handleGetMood} className="action-btn">
                    😊 Check My Mood
                  </button>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  placeholder={aiMode ? 'Chat with ARIA...' : 'Type your message...'}
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="message-input"
                />
                <button type="submit" className="send-btn">Send</button>
              </form>

              {aiResponse && (
                <div className="ai-suggestions">
                  <strong>Suggestions:</strong>
                  {aiResponse.suggestions && aiResponse.suggestions.map((suggestion, idx) => (
                    <button 
                      key={idx}
                      className="suggestion-btn"
                      onClick={() => setInputMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h2>Welcome to Indian Telegram! 👋</h2>
              <p>Select a chat to start messaging or chat with ARIA AI</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;