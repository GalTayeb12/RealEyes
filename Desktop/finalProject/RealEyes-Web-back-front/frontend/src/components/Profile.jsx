import React, { useState, useEffect } from 'react';
import { Eye, User, Lock, History, ArrowLeft, X, LogOut, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import './Profile.css';

const Profile = ({ setAuth, onBack }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState({
    currentPassword: '',
    confirmPassword: ''
  });

  const [uploadHistory, setUploadHistory] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { 
    email: 'user@example.com', 
    name: 'Unknown User', 
    username: 'user',
    is_google_user: false 
  };

  const passReqs = {
    length: passwordData.newPassword.length >= 8,
    upper: /[A-Z]/.test(passwordData.newPassword),
    lower: /[a-z]/.test(passwordData.newPassword),
    number: /[0-9]/.test(passwordData.newPassword),
    special: /[^A-Za-z0-9]/.test(passwordData.newPassword)
  };

  const isPasswordStrong = Object.values(passReqs).every(Boolean);

  const verifyCurrentPasswordLive = async (val) => {
    if (!val) {
      setFieldErrors(prev => ({ ...prev, currentPassword: '' }));
      return;
    }

    try {
      const res = await api.post("/auth/verify-password", { password: val });
      if (!res.data.valid) {
        setFieldErrors(prev => ({ ...prev, currentPassword: 'Incorrect password' }));
      } else {
        setFieldErrors(prev => ({ ...prev, currentPassword: '' }));
      }
    } catch (err) {
      console.error("Live verification error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === 'currentPassword') {
      verifyCurrentPasswordLive(value);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/upload/history");
        if (res.data && res.data.history) setUploadHistory(res.data.history);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    if (showHistoryModal) fetchHistory();
  }, [showHistoryModal]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.currentPassword === passwordData.newPassword) {
        toast.error('New password cannot be the same as current');
        return;
    }

    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Password updated successfully! 🔒');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFieldErrors({ currentPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("currentUser");
    setAuth(false);
    toast.success('Logged out successfully 👋');
  };

  return (
    <div className="profile-page">
      <header className="profile-page-topbar">
        <div className="profile-page-logo">
          <div className="profile-page-logo-icon"><Eye size={18} /></div>
          <span className="profile-page-logo-text">RealEyes</span>
        </div>
        <button className="profile-back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </header>

      <main className="profile-layout">
        <div className="profile-main-card">
          <div className="profile-header-section">
            <div className="profile-avatar-large"><User size={40} /></div>
            <div className="profile-info-text">
              <h1 className="profile-name">{currentUser.name}</h1>
              <p className="profile-email">@{currentUser.username}</p>
              <p className="profile-email" style={{fontSize: '0.85rem', opacity: 0.7}}>{currentUser.email}</p>
            </div>
          </div>

          <div className="profile-divider"></div>

          <div className="profile-actions-grid">
            <button className="action-tile" onClick={() => setShowPasswordModal(true)}>
              <div className="tile-icon icon-purple"><Lock size={24} /></div>
              <div className="tile-content"><h3>Change Password</h3><p>Security Settings</p></div>
              <ChevronRight size={18} className="tile-arrow" />
            </button>
            <button className="action-tile" onClick={() => setShowHistoryModal(true)}>
              <div className="tile-icon icon-blue"><History size={24} /></div>
              <div className="tile-content"><h3>Upload History</h3><p>View Past Scans</p></div>
              <ChevronRight size={18} className="tile-arrow" />
            </button>
          </div>

          <div className="profile-footer">
            <button className="logout-link" onClick={handleLogout}><LogOut size={16} /> Logout Account</button>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content fade-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}><X size={20}/></button>
            </div>

            {currentUser.is_google_user ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ background: 'rgba(66, 133, 244, 0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(66, 133, 244, 0.2)', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.95rem', color: '#60a5fa', lineHeight: '1.5', margin: 0 }}>
                    You are signed in with <strong>Google</strong>. <br/>
                    Password management is handled via Google.
                  </p>
                </div>
                <button className="primary-btn" onClick={() => setShowPasswordModal(false)}>Got it</button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange}>
                <div className="input-group">
                  <label>Current Password</label>
                  <input
                      type="password"
                      name="currentPassword"
                      placeholder="••••••••"
                      style={{ borderColor: fieldErrors.currentPassword ? '#ef4444' : '' }}
                      value={passwordData.currentPassword}
                      onChange={handleInputChange}
                      required
                  />
                  {fieldErrors.currentPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {fieldErrors.currentPassword}
                    </span>
                  )}
                </div>

                <div className="input-group">
                  <label>New Password</label>
                  <input
                      type="password"
                      name="newPassword"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={handleInputChange}
                      required
                  />
                  <div className="password-requirements" style={{ marginTop: '0.8rem' }}>
                    {[
                      { label: "8+ Characters", met: passReqs.length },
                      { label: "Uppercase (A-Z)", met: passReqs.upper },
                      { label: "Lowercase (a-z)", met: passReqs.lower },
                      { label: "Number (0-9)", met: passReqs.number },
                      { label: "Special character", met: passReqs.special }
                    ].map((req, i) => (
                      <div key={i} className={`req-item ${req.met ? "req-met" : "req-unmet"}`} 
                           style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                        {req.met ? <Check size={12} /> : <X size={12} />} {req.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm New Password</label>
                  <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={handleInputChange}
                      required
                  />
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                      Passwords do not match
                    </span>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={
                      !isPasswordStrong || 
                      passwordData.newPassword !== passwordData.confirmPassword ||
                      fieldErrors.currentPassword || 
                      !passwordData.currentPassword
                  }
                >
                  Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content fade-up history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Scan History</h2>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}><X size={20}/></button>
            </div>
            <div className="history-scroll-area">
              {uploadHistory.length === 0 ? (
                <p style={{textAlign: 'center', marginTop: '2rem', color: '#888'}}>No scans yet.</p>
              ) : (
                uploadHistory.map((item) => (
                  <div key={item.id} className="history-row">
                     <div className="row-left">
                        <div className={`status-dot ${item.is_safe ? 'real' : 'fake'}`}></div>
                        <div>
                          <div className="row-title">{item.filename || 'Unknown File'}</div>
                          <div className="row-date">{item.date}</div>
                        </div>
                     </div>
                     <div className="row-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                       <span className="confidence-tag" style={{ fontSize: '0.7rem' }}>{item.result_text}</span>
                       <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>Conf: {item.confidence === null ? 'NULL' : `${item.confidence}%`}</span>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;