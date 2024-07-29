import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import './Sidebar.css'; // Make sure to import the CSS

const Sidebar = ({ onSelectUser, currentUser }) => {
  const socket = useSocket();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('userList', ({ online = [], all = [] }) => {
        console.log('Received user list:', { online, all }); // Debugging statement
        if (Array.isArray(all)) {
          setUsers(all);
        } else {
          console.error('Received data is not an array:', all);
        }
      });

      return () => {
        socket.off('userList');
      };
    }
  }, [socket]);

  // Function to format last login time
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Offline';

    const now = new Date();
    const lastLoginTime = new Date(lastLogin);
    const diffInMs = now - lastLoginTime;
    const diffInMinutes = Math.floor(diffInMs / 1000 / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours <= 1) {
      return `Online ${diffInHours}hr ago`;
    } else if (diffInHours > 1 && diffInHours <= 24) {
      return `Online ${diffInHours}hr ago`;
    } else if (diffInHours > 24) {
      return `Offline`;
    } else {
      return 'Online just now';
    }
  };

  // Filter out the currentUser from the list of users
  const filteredUsers = users.filter(user => user.email !== currentUser?.email);

  return (
    <div className="sidebar">
      <h4>Contacts</h4>
      <ul className="list-group">
        {filteredUsers.map((user, index) => (
          <li
            key={index}
            className={`list-group-item ${user.online ? 'online' : ''}`}
            onClick={() => onSelectUser(user)}
            title={formatLastLogin(user.lastLogin)}
          >
            <a href="#" onClick={(e) => e.preventDefault()}>{user.fullName}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
