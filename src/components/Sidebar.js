// components/Sidebar.js
import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const Sidebar = ({ onSelectUser, currentUser }) => {
  const socket = useSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('userList', ({ online = [], all = [] }) => {
        setOnlineUsers(online);
        setAllUsers(all);
      });

      return () => {
        socket.off('userList');
      };
    }
  }, [socket]);

  // Ensure onlineUsers and allUsers are initialized as arrays
  const offlineUsers = (allUsers || []).filter(user => !onlineUsers.find(onlineUser => onlineUser.email === user.email));

  return (
    <div className="sidebar">
      <h4>Online Users</h4>
      <ul>
        {(onlineUsers || []).map((user, index) => (
          <li key={index} onClick={() => onSelectUser(user)}>
            {user.fullName}
          </li>
        ))}
      </ul>
      <h4>Offline Users</h4>
      <ul>
        {(offlineUsers || []).map((user, index) => (
          <li key={index} onClick={() => onSelectUser(user)}>
            {user.fullName}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
