// src/components/PrivateRoute.js
import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ element, user, ...rest }) => {
  return (
    <Route
      {...rest}
      element={user ? element : <Navigate to="/login" />}
    />
  );
};

export default PrivateRoute;
