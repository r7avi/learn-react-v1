// components/ChatWindow.js
import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const ChatWindow = ({ user, currentUser }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user && socket) {
      socket.emit('fetchMessages', { from: currentUser.email, to: user.email });

      socket.on('receiveMessage', (msg) => {
        setMessages(prevMessages => [...prevMessages, msg]);
      });

      socket.on('messageHistory', (history) => {
        setMessages(history);
      });

      return () => {
        socket.off('receiveMessage');
        socket.off('messageHistory');
      };
    }
  }, [user, socket]);

  const handleSend = () => {
    if (message.trim()) {
      socket.emit('sendMessage', { from: currentUser.email, to: user.email, content: message });
      setMessages(prevMessages => [...prevMessages, { from: currentUser.email, content: message }]);
      setMessage('');
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div key={index} className={msg.from === currentUser.email ? 'sent' : 'received'}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;
