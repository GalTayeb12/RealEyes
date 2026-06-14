import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import './Auth.css'; 

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            toast.success("If an account exists, a reset link has been sent to your email!");
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card fade-up">
                <div className="auth-header">
                    <button 
                    className="profile-back-btn" 
                    onClick={() => navigate('/login')}
                    style={{ marginBottom: '1.5rem', border: 'none', background: 'none', cursor: 'pointer', color: 'white', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                    <ArrowLeft size={16} /> Back to Login
                    </button>
                    <div className="logo-container">
                        <div className="logo-icon"><Lock size={22} /></div>
                        <h1 className="auth-logo-text">Reset Access</h1>
                    </div>
                    <p className="auth-subtitle">Enter your email to receive a password reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input 
                                type="email" 
                                placeholder="example@email.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="loading-spinner" /> : 'Send Reset Link'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;