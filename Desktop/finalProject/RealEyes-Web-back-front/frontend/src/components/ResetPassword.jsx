import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import './Auth.css'; // משתמשים ב-CSS הקיים והמעולה שלך

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const passReqs = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    const isStrong = Object.values(passReqs).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error("Passwords don't match");
        
        setLoading(true);
        try {
            await api.post("/auth/reset-password-final", { token, password });
            toast.success("Password reset successfully! You can now login.", { icon: '🔐' });
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            toast.error(err.response?.data?.error || "Link expired or invalid");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* הרקע עם ה-Orbs שכבר קיים לך ב-Auth.css */}
            <div className="auth-background">
                <div className="glow-orb orb-1" />
                <div className="glow-orb orb-2" />
                <div className="glow-orb orb-3" />
            </div>

            <div className="auth-card fade-up">
                <div className="auth-header">
                    <div className="logo-container">
                        <div className="logo-icon"><Lock size={22} /></div>
                        <h1 className="auth-logo-text">Secure Reset</h1>
                    </div>
                    <p className="auth-subtitle">Set your new account password</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    
                    {/* שדה סיסמה חדשה */}
                    <div className="form-group">
                        <label>New Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* תיבת דרישות סיסמה מעוצבת כמו ב-Profile */}
                        <div className="password-requirements" style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
                                Password requirements:
                            </p>
                            {[
                                { label: "8+ Characters", met: passReqs.length },
                                { label: "Uppercase (A-Z)", met: passReqs.upper },
                                { label: "Lowercase (a-z)", met: passReqs.lower },
                                { label: "Number (0-9)", met: passReqs.number },
                                { label: "Special symbol", met: passReqs.special }
                            ].map((req, i) => (
                                <div key={i} className={`req-item ${req.met ? "req-met" : "req-unmet"}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', marginBottom: '4px' }}>
                                    {req.met ? <Check size={12} /> : <X size={12} />} {req.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* שדה אישור סיסמה */}
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <span className="field-error">Passwords do not match</span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={!isStrong || password !== confirmPassword || loading}
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? <span className="loading-spinner" /> : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;