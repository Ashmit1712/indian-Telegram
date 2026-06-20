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

  // Socket connection effects
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
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

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handle joining a chat
  const handleJoinChat = (chatId) => {
    setCurrentChat(chatId);
    setMessages([]);
    socket.emit('join-chat', chatId);
  };

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentChat) {
      return;
    }

    socket.emit('send-message', {
      chatId: currentChat,
      message: inputMessage,
      timestamp: new Date().toISOString()
    });

    setInputMessage('');
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    socket.emit('user-typing', {
      chatId: currentChat,
      isTyping: e.target.value.length > 0
    });
  };

  // Handle leaving a chat
  const handleLeaveChat = () => {
    if (currentChat) {
      socket.emit('leave-chat', currentChat);
      setCurrentChat(null);
      setMessages([]);
      setUsers([]);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🇮🇳 Indian Telegram</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
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
          </div>
        </aside>

        {/* Main chat area */}
        <main className="chat-area">
          {currentChat ? (
            <>
              <div className="chat-header">
                <h2>#{currentChat}</h2>
                <div className="chat-info">
                  <span>{users.length} Online</span>
                  <button onClick={handleLeaveChat} className="leave-btn">Leave</button>
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages yet. Start the conversation! 💬</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className="message">
                      <div className="message-header">
                        <span className="message-user">{msg.userId.substring(0, 8)}...</span>
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="message-content">{msg.message}</div>
                    </div>
                  ))
                )}
                {isTyping && <div className="typing-indicator">Someone is typing...</div>}
              </div>

              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="message-input"
                />
                <button type="submit" className="send-btn">Send</button>
              </form>
            </>
          ) : (
            <div className="empty-state">
              <h2>Welcome to Indian Telegram! 👋</h2>
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;