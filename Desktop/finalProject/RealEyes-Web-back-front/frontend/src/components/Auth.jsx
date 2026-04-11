import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Check, X, ArrowLeft } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './Auth.css';
import api from "../api";

const Auth = ({ setAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const passReqs = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password)
  };

  /* 🛡️ VALIDATION LOGIC */
  const validateField = (name, value, currentFormData = formData) => {
    if (!value) return "This field is required";

    switch (name) {
      case "name":
        const words = value.trim().split(/\s+/);
        const validWords = words.filter(w => w.length >= 2);
        if (validWords.length < 2) return "Must contain at least 2 words (min 2 letters each)";
        break;
      case "username":
        if (value.length < 3) return "Username must be at least 3 characters";
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address";
        break;
      case "password":
        const isStrong = Object.values({
            len: value.length >= 8,
            up: /[A-Z]/.test(value),
            low: /[a-z]/.test(value),
            num: /[0-9]/.test(value),
            spec: /[^A-Za-z0-9]/.test(value)
        }).every(Boolean);

        if (!isStrong) {
           return isLogin ? "Invalid password format" : "Password does not meet all requirements";
        }
        break;
      case "confirmPassword":
        if (value !== currentFormData.password) return "Passwords do not match";
        break;
      default:
        break;
    }
    return "";
  };

  const handleChange = (e) => { 
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    if (touched[name] || value.length > 0) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value, newFormData) }));
    }
  };

  /* 👆 HANDLE BLUR + DATABASE CHECK */
/* 👆 HANDLE BLUR + DATABASE CHECK */
  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const localError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: localError }));

    // בדיקה בשרת האם שם המשתמש כבר תפוס
    if (name === "username" && !localError && !isLogin) {
        try {
            const res = await api.get(`/auth/check-username?username=${value}`);
            if (res.data.exists) {
                setErrors(prev => ({ ...prev, username: "This username is already taken" }));
            }
        } catch (err) {
            console.error("Username check failed", err);
        }
    }

    // בדיקה בשרת האם המייל כבר תפוס (חדש!)
    if (name === "email" && !localError && !isLogin) {
        try {
            const res = await api.get(`/auth/check-email?email=${value}`);
            if (res.data.exists) {
                setErrors(prev => ({ ...prev, email: "This email is already registered" }));
            }
        } catch (err) {
            console.error("Email check failed", err);
        }
    }
  };

const handleForgotSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // השרת יבדוק אם המייל קיים וישלח לינק לאיפוס
    await api.post("/auth/forgot-password", { email: formData.email });
    toast.success("If an account exists, a reset link has been sent!");
    setShowForgot(false);
  } catch (err) {
    toast.error(err.response?.data?.error || "Failed to send reset link");
  } finally {
    setLoading(false);
  }
};

  /* 📩 SUBMIT */
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let newErrors = {};
    let newTouched = {};
    const fieldsToValidate = isLogin ? ['email', 'password'] : ['name', 'username', 'email', 'password', 'confirmPassword'];
    
    let isValid = true;
    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
      const fieldError = validateField(field, formData[field], formData);
      if (fieldError) {
        newErrors[field] = fieldError;
        isValid = false;
      }
    });

    // אם אנחנו בהרשמה ויש כבר שגיאה מהשרת, לא נדרוס אותה
    if (!isLogin) {
        if (errors.username === "This username is already taken") {
            newErrors.username = errors.username;
            isValid = false;
        }
        if (errors.email === "This email is already registered") {
            newErrors.email = errors.email;
            isValid = false;
        }
    }

    setTouched(prev => ({ ...prev, ...newTouched }));
    setErrors(newErrors);

    if (!isValid) {
      toast.error("Please fix the errors in the form");
      setLoading(false);
      return;
    }

    try {
      if (!isLogin) {
        await api.post("/auth/register", {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          username: formData.username
        });

        const res = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        const token = res.data?.access_token;
        if (token) {
          localStorage.setItem("access_token", token);
          localStorage.setItem("currentUser", JSON.stringify(res.data.user));
          
          toast.success("Account created successfully! Redirecting...", { duration: 2000, icon: '🎉' });
          setTimeout(() => { setAuth(true); navigate("/dashboard"); }, 2000);
        }
        return;
      }

      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const token = res.data?.access_token;
      if (!token) {
        toast.error("Login succeeded but no token received");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("currentUser", JSON.stringify(res.data.user));

      toast.success(`Welcome back, ${res.data.user.name}!`);
      setTimeout(() => { setAuth(true); navigate("/dashboard"); }, 1500);

    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Request failed";
      
      if (msg.includes("email already exists")) {
        setErrors(prev => ({ ...prev, email: "This email is already registered" }));
      } else if (msg.includes("invalid credentials")) {
        toast.error("Incorrect email or password");
      } else {
        toast.error(msg);
      }
      setLoading(false);
    }
  };

  /* 🔐 GOOGLE LOGIN */
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 1. שולפים את המידע האמיתי מהשרתים של גוגל בעזרת הטוקן שגוגל נתן לנו
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();

        // 2. שולחים את המידע ל-Backend שלנו כדי שייצור משתמש (אם לא קיים) ויחזיר טוקן של המערכת שלנו
        const res = await api.post("/auth/google", {
            email: userInfo.email,
            name: userInfo.name
        });

        // 3. שומרים בזיכרון את הטוקן ואת השם מהשרת שלנו
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("currentUser", JSON.stringify(res.data.user));

        toast.success(`Welcome, ${res.data.user.name}!`);
        setAuth(true);
        navigate('/dashboard');
        
      } catch (err) {
        console.error("Google Login Error:", err);
        toast.error('Failed to communicate with server for Google Login');
      }
    },
    onError: () => {
      toast.error('Google Login Failed');
    }
  });

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setTouched({});
  };

  if (showForgot) {
    return (
      <div className="auth-container">
        <div className="auth-card fade-up">
          <div className="auth-header">
            <button 
              className="link-text" 
              onClick={() => setShowForgot(false)} 
              style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
            <div className="logo-container">
               <div className="logo-icon"><Lock size={22} /></div>
               <h1 className="auth-logo-text">Reset Password</h1>
            </div>
            <p className="auth-subtitle">Enter your email and we'll send you a recovery link</p>
          </div>

          <form onSubmit={handleForgotSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  name="email" 
                  type="email" 
                  placeholder="example@email.com" 
                  value={formData.email} 
                  onChange={handleChange} 
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
  }

return (
    <div className="auth-container">
      {/* רקע עם האפקטים הויזואליים */}
      <div className="auth-background">
        <div className="glow-orb orb-1" />
        <div className="glow-orb orb-2" />
        <div className="glow-orb orb-3" />
      </div>

      {showForgot ? (
        /* ===== מסך חדש: איפוס סיסמה ===== */
        <div className="auth-card fade-up">
          <div className="auth-header">
            <button 
              className="link-text" 
              onClick={() => setShowForgot(false)} 
              style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
            <div className="logo-container">
              <div className="logo-icon"><Lock size={22} /></div>
              <h1 className="auth-logo-text">Reset Access</h1>
            </div>
            <p className="auth-subtitle">Enter your email and we'll send you a recovery link</p>
          </div>

          <form onSubmit={handleForgotSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  name="email" 
                  type="email" 
                  placeholder="example@email.com" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        </div>
      ) : (
        /* ===== מסך מקורי: כניסה / הרשמה ===== */
        <div className={`auth-card ${isLogin ? 'login-mode' : 'signup-mode'}`}>
          <div className="auth-header">
            <div className="logo-container">
              <div className="logo-icon"><Eye size={22} /></div>
              <h1 className="auth-logo-text">RealEyes</h1>
            </div>
            <p className="auth-subtitle">
              {isLogin ? 'Deepfake Detection System' : 'Create a new account to get started'}
            </p>
          </div>

          <div className={`auth-form-wrapper ${!isLogin ? 'signup-scroll' : ''}`}>
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              
              {!isLogin && (
                <div className="form-group">
                  <label>Full Name</label>
                  <div className={`input-wrapper ${errors.name ? 'input-error' : ''}`}>
                    <User className="input-icon" size={20} />
                    <input name="name" type="text" value={formData.name} onChange={handleChange} onBlur={handleBlur} placeholder="John Doe" />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="form-group">
                  <label>Username</label>
                  <div className={`input-wrapper ${errors.username ? 'input-error' : ''}`}>
                    <User className="input-icon" size={20} />
                    <input name="username" type="text" value={formData.username} onChange={handleChange} onBlur={handleBlur} placeholder="john_doe" />
                    {errors.username && <span className="field-error">{errors.username}</span>}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <div className={`input-wrapper ${errors.email ? 'input-error' : ''}`}>
                  <Mail className="input-icon" size={20} />
                  <input name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="example@email.com" />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Password</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      className="link-text" 
                      onClick={() => setShowForgot(true)}
                      style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className={`input-wrapper ${errors.password ? 'input-error' : ''}`}>
                  {formData.password.length === 0 && <Lock className="input-icon" size={20} />}
                  <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} onBlur={handleBlur} placeholder="••••••••" />
                  {formData.password.length > 0 && (
                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  )}
                </div>

              {!isLogin && (
                <div className="password-requirements">
                  <p>Password requirements:</p>
                  {[
                    { label: "8+ Characters", met: passReqs.length },
                    { label: "Uppercase (A-Z)", met: passReqs.upper },
                    { label: "Lowercase (a-z)", met: passReqs.lower },
                    { label: "Number (0-9)", met: passReqs.number },
                    { label: "Special character", met: passReqs.special }
                  ].map((req, i) => (
                    <div key={i} className={`req-item ${req.met ? "req-met" : "req-unmet"}`}>
                      {req.met ? <Check size={14} /> : <X size={14} />} {req.label}
                    </div>
                  ))}
                </div>
              )}
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className={`input-wrapper ${errors.confirmPassword ? 'input-error' : ''}`}>
                    <Lock className="input-icon" size={20} />
                    <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} placeholder="••••••••" />
                    <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                  </div>
                </div>
              )}

              {!isLogin && (
              <div className="terms-container">
                <label className="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                  />
                  <span className="checkbox-custom"></span>
                  <span className="terms-text">
                    I agree to the <button type="button" className="link-text" onClick={() => setShowTermsModal(true)}>Terms of Service</button>
                  </span>
                </label>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || (!isLogin && !agreed)}
            >
              {loading ? <span className="loading-spinner" /> : isLogin ? 'Sign In' : 'Sign Up'}
            </button>

              {isLogin && (
                <>
                  <div className="divider"><span>or</span></div>
                  <button type="button" className="btn-google-custom" onClick={() => googleLogin()}>
                    <img src="/google-icon.svg" alt="Google" width="20" height="20" /> Continue with Google
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" className="link-text" onClick={toggleMode}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      )}
      {showTermsModal && (
      <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
        <div className="terms-modal fade-up" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>RealEyes Regulation</h2>
            <button className="close-btn" onClick={() => setShowTermsModal(false)}><X size={20}/></button>
          </div>
          <div className="terms-content">
            <h4>1. Privacy & Data Handling</h4>
            <p>Uploaded images are processed for analysis only. We do not store original images permanently. Minimal technical logs (IP, timestamp) are kept for 30 days for security traceability[cite: 431, 433, 1087].</p>
            
            <h4>2. Technological Limitation</h4>
            <p>RealEyes provides a technological assessment based on AI models. This result is not a substitute for official legal or forensic expert opinions.</p>
            
            <h4>3. Ethical Use</h4>
            <p>Users are prohibited from using this system to facilitate harassment, identity theft, or the distribution of harmful content[cite: 446, 451].</p>
            
            <h4>4. Security Compliance</h4>
            <p>All uploads are scanned via VirusTotal to prevent malware injection. Any attempt to bypass security measures will result in immediate access restriction[cite: 664, 1085].</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setAgreed(true); setShowTermsModal(false); }}>
            I Understand & Agree
          </button>
        </div>
      </div>
    )}
    </div>
  );
};

export default Auth;