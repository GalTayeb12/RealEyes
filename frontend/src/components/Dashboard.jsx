import React, { useState, useRef } from 'react';
import { Eye, Upload, User, LogOut, Zap } from 'lucide-react';
import Profile from './Profile';
import './Dashboard.css';
import api from "../api";

const Dashboard = ({ setAuth }) => {
  const [preview, setPreview] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const inputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadToServer = async (file) => {
    const fd = new FormData();
    fd.append("file", file);

    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // הבאק מחזיר scan_id/status/filename
    setResult({
      scanId: res.data.scan_id,
      status: res.data.status,
      filename: res.data.filename,
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowMenu(false);
    setResult(null);
    setSelectedFile(file);

    // Preview מקומי
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload מיידי לשרת
    try {
      setIsUploading(true);
      await uploadToServer(file);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Upload failed";
      alert(msg);
      // אם נכשל - מנקים כדי שלא תיתקע עם preview בלי לוג
      setPreview(null);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setSelectedFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("currentUser");
    setAuth(false);
  };

  if (showProfile) {
    return <Profile setAuth={setAuth} onBack={() => setShowProfile(false)} />;
  }

  return (
    <div className="dashboard">

      {/* ===== TOP BAR ===== */}
      <header className="topbar">
        <div className="logo">
          <div className="logo-icon">
            <Eye size={18} />
          </div>
          <span className="logo-text">RealEyes</span>
        </div>

        <div className="profile">
          <button className="profile-btn" onClick={() => setShowMenu(!showMenu)}>
            <User size={18} />
          </button>

          {showMenu && (
            <div className="profile-menu">
              <button onClick={() => {
                setShowProfile(true);  // 👈 פתח פרופיל
                setShowMenu(false);
              }}>
              <User size={16} />
                My Profile
              </button>

              <button onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="content">
        <h1 className="title">Deepfake Image Analysis</h1>
        <p className="subtitle">
         מערכת לזיהוי תמונות מזויפות
        </p>

<div className={`upload-card ${preview ? 'expanded' : ''}`}>

  {/* אזור תמונה */}
  <div className={`image-area ${result ? 'shrink' : ''}`}>    {!preview ? (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleUpload}
        />
        <button
          className="upload-btn"
          onClick={() => inputRef.current.click()}
        >
          <Upload size={18} />
          Upload Image
        </button>
      </>
    ) : (
      <img src={preview} alt="preview" className="image-preview" />
    )}
  </div>

  {/* כפתור Analyze – מופיע רק לפני ניתוח */}
  {preview && !result && (
    <div className="uploading-text">
          {isUploading ? "Uploading..." : "Waiting for server response..."}
    </div>
  )}

  {/* תוצאות */}
  {result && (
    <div className="results-container">
        <div className={`result-box ${result.isFake ? 'fake' : 'real'}`}>
        <h3>
            {result.isFake ? 'Fake Detected' : 'Image Appears Real'}
        </h3>
        <p>Confidence: {result.confidence}%</p>

        <div className="result-actions">
            <button className="secondary-btn">Download Report</button>
            <button className="secondary-btn">View Heatmap</button>
        </div>
        </div>

        {/* כפתור העלאה מחדש - קטן ומתחת לתוצאות */}
        <button className="reupload-link" onClick={handleReset}>
            <Upload size={14} />
            Upload Another Image
        </button>
    </div>
  )}

</div>

      </main>
    </div>
  );
};

export default Dashboard;
