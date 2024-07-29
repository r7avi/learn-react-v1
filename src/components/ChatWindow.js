import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import './ChatWindow.css'; // Import the CSS file

const ChatWindow = ({ user, currentUser }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingMore, setLoadingMore] = useState(false); // State to manage loading more messages
  const chatHistoryRef = useRef(null);
  const limit = 20; // Number of messages to load at a time
  const lastMessageIdRef = useRef(null); // Ref to keep track of the last message ID

  // Load initial messages when the component mounts
  useEffect(() => {
    if (user && socket) {
      socket.emit('loadInitialMessages', { from: currentUser.email, to: user.email, limit });

      const handleInitialMessages = (initialMessages) => {
        if (initialMessages.length > 0) {
          const lastMessage = initialMessages[initialMessages.length - 1];
          lastMessageIdRef.current = lastMessage._id; // Set the last message ID for pagination
        }
        setMessages(initialMessages);
      };

      socket.on('initialMessages', handleInitialMessages);

      return () => {
        socket.off('initialMessages', handleInitialMessages);
      };
    }
  }, [user, socket, currentUser.email]);

  // Handle receiving messages in real-time
  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      };

      socket.on('receiveMessage', handleReceiveMessage);

      return () => {
        socket.off('receiveMessage', handleReceiveMessage);
      };
    }
  }, [socket]);

  // Handle loading more messages when scrolled to the top
  const handleScroll = useCallback(() => {
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement && chatHistoryElement.scrollTop === 0 && !loadingMore) {
      setLoadingMore(true);
      socket.emit('loadMoreMessages', {
        from: currentUser.email,
        to: user.email,
        lastMessageId: lastMessageIdRef.current,
        limit,
      });
    }
  }, [loadingMore, socket, currentUser.email, user.email]);

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

  useEffect(() => {
    // Scroll to bottom when messages change
    const chatHistoryElement = chatHistoryRef.current;
    if (chatHistoryElement) {
      chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (message.trim()) {
      socket.emit('sendMessage', { from: currentUser.email, to: user.email, content: message });
      setMessages(prevMessages => [...prevMessages, { from: currentUser.email, content: message }]);
      setMessage('');
    }
  }, [message, currentUser.email, user.email, socket]);

  useEffect(() => {
    if (loadingMore) {
      const handleLoadMoreMessages = (moreMessages) => {
        setMessages((prevMessages) => [...moreMessages, ...prevMessages]);
        setLoadingMore(false);
        if (moreMessages.length > 0) {
          lastMessageIdRef.current = moreMessages[moreMessages.length - 1]._id;
        }
      };

      socket.on('moreMessages', handleLoadMoreMessages);

      return () => {
        socket.off('moreMessages', handleLoadMoreMessages);
      };
    }
  }, [loadingMore, socket]);

  // Function to format last login time
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Offline';

    const now = new Date();
    const lastLoginTime = new Date(lastLogin);
    const diffInMs = now - lastLoginTime;
    const diffInMinutes = Math.floor(diffInMs / 1000 / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours > 0) {
      return `Online ${diffInHours}hr ago`;
    } else if (diffInMinutes > 0) {
      return `Online ${diffInMinutes}min ago`;
    } else {
      return 'Online just now';
    }
  };

  return (
    <div className="chat-window d-flex flex-column h-100">
      <div className="chat-header d-flex align-items-center px-3 py-2 border-bottom">
        <strong>{user.fullName}</strong>
        <span className="ms-2 text-muted">{formatLastLogin(user.lastLogin)}</span>
      </div>
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
      <div className="chat-input d-flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="form-control me-2"
        />
        <button onClick={handleSend} className="btn btn-primary">Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
