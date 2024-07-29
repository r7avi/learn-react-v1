// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Home from './components/Home'; // Assuming you have a Home component
import axios from 'axios';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to handle initial checks

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      axios.get('http://192.168.1.6:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        setUser(response.data);
      })
      .catch(() => {
        // Token might be expired or invalid
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false); // Set loading to false after the check
      });
    } else {
      setLoading(false); // Set loading to false if no token is present
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          {/* Add more routes here as needed */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
