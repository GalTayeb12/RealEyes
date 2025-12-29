import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import './Auth.css';
import api from "../api";

const Auth = ({ setAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  /* 🔄 HANDLE INPUT CHANGE */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /* 📩 SUBMIT (LOGIN / SIGNUP) */
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // ולידציה קטנה לפני
    if (!formData.email || !formData.password) {
      alert("Email and password are required");
      return;
    }

    if (!isLogin) {
      // signup
      if (formData.password.length < 8) {
        alert("Password must be at least 8 characters");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      await api.post("/auth/register", {
        email: formData.email,
        password: formData.password,
      });

      // אחרי הרשמה – נעביר למצב login (בלי לשנות UI)
      setIsLogin(true);
      alert("Registered successfully. Please sign in.");
      return;
    }

    // login
    const res = await api.post("/auth/login", {
      email: formData.email,
      password: formData.password,
    });

    const token = res.data?.access_token;
    if (!token) {
      alert("Login succeeded but no token received");
      return;
    }

    localStorage.setItem("access_token", token);
    localStorage.setItem(
      "currentUser",
      JSON.stringify({ email: formData.email })
    );

    setAuth(true);
    navigate("/dashboard");
  } catch (err) {
    const msg = err?.response?.data?.error || err.message || "Request failed";
    alert(msg);
  } finally {
    setLoading(false);
  }
};


  /* 🔐 GOOGLE LOGIN */
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google access token:', tokenResponse);
      // tokenResponse.access_token → ל־backend
      setAuth(true);
      navigate('/dashboard');
    },
    onError: () => {
      console.log('Google Login Failed');
    }
  });

  return (
    <div className="auth-container">
      {/* 🌌 Background */}
      <div className="auth-background">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />
      </div>

      <div className={`auth-card ${isLogin ? 'login-mode' : 'signup-mode'}`}>
        {/* 🧠 HEADER */}
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo-icon">
              <Eye size={22} />
            </div>
            <h1 className="auth-logo-text">RealEyes</h1>
          </div>

          <p className="auth-subtitle">
            {isLogin
              ? 'Deepfake Detection System'
              : 'Create a new account to get started'}
          </p>
        </div>

        {/* 📜 FORM WRAPPER (scroll only on signup) */}
        <div className={`auth-form-wrapper ${!isLogin ? 'signup-scroll' : ''}`}>
          <form onSubmit={handleSubmit} className="auth-form">

            {/* 👤 FULL NAME – SIGN UP ONLY */}
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* 👤 USERNAME – SIGN UP ONLY */}
            {!isLogin && (
              <div className="form-group">
                <label>Username</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="john_doe"
                    required
                  />
                </div>
              </div>
            )}

            {/* 📧 EMAIL */}
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {/* 🔑 PASSWORD */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                {formData.password.length === 0 && (
                  <Lock className="input-icon" size={20} />
                )}

                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />

                {formData.password.length > 0 && (
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
              </div>
            </div>

            {/* 🔁 CONFIRM PASSWORD – SIGN UP ONLY */}
            {!isLogin && (
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {/* 🚀 SUBMIT */}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span className="loading-spinner" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>

            {/* 🔵 GOOGLE LOGIN – LOGIN ONLY */}
            {isLogin && (
              <>
                <div className="divider">
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className="btn-google-custom"
                  onClick={() => googleLogin()}
                >
                  <img src="/google-icon.svg" alt="Google" width="20" height="20" />
                  Continue with Google
                </button>
              </>
            )}
          </form>
        </div>

        {/* 🔁 FOOTER */}
        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="link-text"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
