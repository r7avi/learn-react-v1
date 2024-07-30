// pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../Chat/Sidebar';
import ChatWindow from '../Chat/ChatWindow';
import { SocketProvider, useSocket } from '../../context/SocketContext';

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const socket = useSocket();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get('http://192.168.1.6:5000/api/users/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setCurrentUser(data);
      } catch (error) {
        console.error('Error fetching current user', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('userList', (users) => {
        console.log('Received user list:', users);
      });

      socket.on('receiveMessage', (message) => {
        console.log('Received message:', message);
      });

      return () => {
        socket.off('userList');
        socket.off('receiveMessage');
      };
    }
  }, [socket]);

  return (
    <SocketProvider>
      <div className="container-fluid dashboard">
        <div className="row">
          <div className="col-md-3">
            <Sidebar onSelectUser={setSelectedUser} currentUser={currentUser} />
          </div>
          <div className="col-md-9">
            {selectedUser && (
              <ChatWindow user={selectedUser} currentUser={currentUser} />
            )}
          </div>
        </div>
      </div>
    </SocketProvider>
  );
};

export default Dashboard;
