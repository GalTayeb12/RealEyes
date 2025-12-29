import React, { useState } from 'react';
import { Eye, User, Lock, History, ArrowLeft, X, LogOut, ChevronRight } from 'lucide-react';
import './Profile.css';

const Profile = ({ setAuth, onBack }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // נתונים מדומים
  const [uploadHistory] = useState([
    { id: 1, date: '2024-12-25', result: 'Real', confidence: '92.3%', thumbnail: 'https://via.placeholder.com/60' },
    { id: 2, date: '2024-12-24', result: 'Fake', confidence: '87.1%', thumbnail: 'https://via.placeholder.com/60' },
    { id: 3, date: '2024-12-23', result: 'Real', confidence: '95.8%', thumbnail: 'https://via.placeholder.com/60' },
    { id: 4, date: '2024-12-22', result: 'Fake', confidence: '89.4%', thumbnail: 'https://via.placeholder.com/60' },
    { id: 5, date: '2024-12-20', result: 'Real', confidence: '99.1%', thumbnail: 'https://via.placeholder.com/60' },
  ]);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('הסיסמאות החדשות אינן תואמות');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }
    alert('הסיסמה שונתה בהצלחה!');
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    setAuth(false);
  };

  return (
    <div className="profile-page">
      {/* ===== TOP BAR ===== */}
      <header className="profile-page-topbar">
        <div className="profile-page-logo">
          <div className="profile-page-logo-icon">
            <Eye size={18} />
          </div>
          <span className="profile-page-logo-text">RealEyes</span>
        </div>
        <button className="profile-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="profile-layout">
        <div className="profile-main-card">

          {/* Header של הכרטיס: תמונה ופרטים */}
          <div className="profile-header-section">
            <div className="profile-avatar-large">
              <User size={40} />
            </div>
            <div className="profile-info-text">
              <h1 className="profile-name">User Name</h1>
              <p className="profile-email">user@example.com</p>
            </div>
          </div>

          <div className="profile-divider"></div>

          {/* גריד פעולות */}
          <div className="profile-actions-grid">
            <button className="action-tile" onClick={() => setShowPasswordModal(true)}>
              <div className="tile-icon icon-purple">
                <Lock size={24} />
              </div>
              <div className="tile-content">
                <h3>Change Password</h3>
                <p>Security Settings</p>
              </div>
              <ChevronRight size={18} className="tile-arrow" />
            </button>

            <button className="action-tile" onClick={() => setShowHistoryModal(true)}>
              <div className="tile-icon icon-blue">
                <History size={24} />
              </div>
              <div className="tile-content">
                <h3>Upload History</h3>
                <p>View Past Scans</p>
              </div>
              <ChevronRight size={18} className="tile-arrow" />
            </button>
          </div>

          {/* כפתור התנתקות למטה */}
          <div className="profile-footer">
            <button className="logout-link" onClick={handleLogout}>
              <LogOut size={16} />
              Logout from Account
            </button>
          </div>
        </div>
      </main>

      {/* ===== MODAL: Change Password ===== */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Password</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="input-group">
                <label>Current Password</label>
                <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                />
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                />
              </div>
              <button type="submit" className="primary-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: History ===== */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content fade-up history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Scan History</h2>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}><X size={20}/></button>
            </div>
            <div className="history-scroll-area">
              {uploadHistory.map((item) => (
                <div key={item.id} className="history-row">
                   <div className="row-left">
                      <div className={`status-dot ${item.result.toLowerCase()}`}></div>
                      <div>
                        <div className="row-title">{item.result === 'Fake' ? 'Deepfake Detected' : 'Real Image'}</div>
                        <div className="row-date">{item.date}</div>
                      </div>
                   </div>
                   <div className="row-right">
                     <span className="confidence-tag">{item.confidence}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;