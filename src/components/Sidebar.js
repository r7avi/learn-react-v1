// components/Sidebar.js
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

  return (
    <div className="sidebar">
      <h4>Contacts</h4>
      <ul className="list-group">
        {users.map((user, index) => (
          <li
            key={index}
            className={`list-group-item ${user.online ? 'online' : ''}`}
            onClick={() => onSelectUser(user)}
            title={user.lastLogin ? `Last login: ${new Date(user.lastLogin).toLocaleString()}` : ''}
          >
            <a href="#" onClick={(e) => e.preventDefault()}>{user.fullName}</a>
          </li>
        ))}
      </ul>
      <button className="btn btn-link">Show Contacts</button>
    </div>
  );
};

export default Sidebar;
