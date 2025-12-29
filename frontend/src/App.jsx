import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
  !!localStorage.getItem("access_token")
);


  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Auth setAuth={setIsAuthenticated} />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard setAuth={setIsAuthenticated} /> : <Navigate to="/login" />
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;