// components/ChatWindow.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import './ChatWindow.css'; // Import the CSS file

const ChatWindow = ({ user, currentUser }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const chatHistoryRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const handleSend = useCallback(() => {
    if (message.trim()) {
      socket.emit('sendMessage', { from: currentUser.email, to: user.email, content: message });
      setMessages(prevMessages => [...prevMessages, { from: currentUser.email, content: message }]);
      setMessage('');
    }
  }, [message, currentUser.email, user.email, socket]);

  const loadMoreMessages = useCallback(() => {
    if (loadingMoreRef.current) return; // Prevent multiple loads
    loadingMoreRef.current = true;
    socket.emit('loadMoreMessages', { from: currentUser.email, to: user.email });
  }, [socket, currentUser.email, user.email]);

  const handleScroll = useCallback(() => {
    if (chatHistoryRef.current.scrollTop === 0) {
      loadMoreMessages();
    }
  }, [loadMoreMessages]);

  useEffect(() => {
    if (user && socket) {
      socket.emit('fetchMessages', { from: currentUser.email, to: user.email });

      const handleReceiveMessage = (msg) => {
        setMessages(prevMessages => [...prevMessages, msg]);
      };

      const handleMessageHistory = (history) => {
        setMessages(history);
      };

      const handleMoreMessages = (moreMessages) => {
        setMessages(prevMessages => [...moreMessages, ...prevMessages]);
        loadingMoreRef.current = false;
      };

      socket.on('receiveMessage', handleReceiveMessage);
      socket.on('messageHistory', handleMessageHistory);
      socket.on('moreMessages', handleMoreMessages);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('messageHistory', handleMessageHistory);
        socket.off('moreMessages', handleMoreMessages);
      };
    }
  }, [user, socket, currentUser.email]);

  useEffect(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      chatHistoryElement.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (chatHistoryElement) {
        chatHistoryElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-window d-flex flex-column h-100">
      <div
        className="chat-history flex-grow-1 overflow-auto"
        ref={chatHistoryRef}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`d-flex ${msg.from === currentUser.email ? 'justify-content-end' : 'justify-content-start'} mb-2`}
          >
            <div className={`message-bubble ${msg.from === currentUser.email ? 'sent' : 'received'}`}>
              <strong>{msg.from === currentUser.email ? 'Me' : user.fullName}:</strong>
              <p className="mb-0">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="form-control"
        />
        <button onClick={handleSend} className="btn btn-primary mt-2">Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
