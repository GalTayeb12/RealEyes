import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ResetPassword from './components/ResetPassword'; 
import ForgotPassword from './components/ForgotPassword';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
  !!localStorage.getItem("access_token")
);

  return (
    <Router>
      <div className="App">
        {/* הגדרות העיצוב של ההודעות הקופצות */}
        <Toaster 
          position="top-center" 
          // containerStyle={{
          //   top: '45vh', /* 👈 השורה הזו דוחפת את ההודעות לאמצע המסך */
          // }}
          toastOptions={{
            // עיצוב התיבה הכללית שיתאים ל-CSS שלך
            style: {
              background: '#1e293b', /* צבע הרקע של המודלים שלך */
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              borderRadius: '14px',
              padding: '12px 24px',
              fontSize: '0.95rem',
            },
            // צבעי אייקון ההצלחה
            success: {
              iconTheme: {
                primary: '#10b981', /* הירוק של המערכת שלך */
                secondary: '#ffffff',
              },
            },
            // צבעי אייקון השגיאה
            error: {
              iconTheme: {
                primary: '#ef4444', /* האדום של המערכת שלך */
                secondary: '#ffffff',
              },
            },
            // צבעי ספינר הטעינה
            loading: {
              iconTheme: {
                primary: '#667eea', /* הסגול/כחול שלך */
                secondary: 'rgba(255,255,255,0.1)',
              },
            },
          }}
        />

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;