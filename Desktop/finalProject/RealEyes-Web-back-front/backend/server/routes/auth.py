from flask import Blueprint, request, current_app
from flask_jwt_extended import create_access_token, decode_token
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db, mail
from flask_mail import Message
from ..models import User
import datetime

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = data.get("name") or ""
    username = data.get("username") or ""

    if not email or not password:
        return {"error": "email and password are required"}, 400
    if len(password) < 8:
        return {"error": "password must be at least 8 characters"}, 400

    if User.query.filter_by(email=email).first():
        return {"error": "email already exists"}, 409
        
    if username and User.query.filter_by(username=username).first():
        return {"error": "username already exists"}, 409

    # שמירת כל הנתונים במסד
    user = User(email=email, full_name=name, username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return {"message": "registered"}, 201

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "invalid credentials"}, 401

    token = create_access_token(identity=str(user.id))
    
    return {
        "access_token": token,
        "user": {
            "email": user.email,
            "name": user.full_name or "Unknown",
            "username": user.username or "user",
            "is_google_user": user.is_google_user 
        }
    }

@auth_bp.get("/check-username")
def check_username():
    username = request.args.get("username")
    if not username:
        return {"exists": False}, 200
    
    user = User.query.filter_by(username=username).first()
    return {"exists": user is not None}, 200

@auth_bp.post("/google")
def google_auth():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    name = data.get("name")
    
    if not email:
        return {"error": "Email is required from Google"}, 400
        
    user = User.query.filter_by(email=email).first()
    
    # אם זה משתמש חדש מגוגל, ניצור לו חשבון אוטומטית במערכת שלנו
    if not user:
        username = email.split('@')[0]
        user = User(email=email, full_name=name, username=username, is_google_user=True)
        # שמים סיסמה פיקטיבית אקראית כי הוא מתחבר דרך גוגל
        user.set_password("google_sso_" + email)
        db.session.add(user)
        db.session.commit()
        
    # מייצרים טוקן אמיתי של השרת שלך כדי שהוא יוכל לסרוק תמונות
    token = create_access_token(identity=str(user.id))
    
    return {
        "access_token": token,
        "user": {
            "email": user.email,
            "name": user.full_name or "Unknown",
            "username": user.username or "user",
            "is_google_user": user.is_google_user 
        }
    }

@auth_bp.get("/check-email")
def check_email():
    email = request.args.get("email")
    if not email:
        return {"exists": False}, 200
    
    # בודקים אם קיים משתמש עם המייל הזה
    user = User.query.filter_by(email=email.strip().lower()).first()
    return {"exists": user is not None}, 200

@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if user.is_google_user:
        return {"error": "Google accounts do not require a password change here."}, 403
    
    data = request.get_json(silent=True) or {}
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    if not current_password or not new_password:
        return {"error": "All fields are required"}, 400
    
    if len(new_password) < 8:
        return {"error": "New password must be at least 8 characters"}, 400

    # שליפת המשתמש המחובר מהמסד
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return {"error": "User not found"}, 404

    # בדיקה שהסיסמה הישנה נכונה
    if not user.check_password(current_password):
        return {"error": "Current password is incorrect"}, 401

    # עדכון הסיסמה החדשה 
    user.set_password(new_password)
    db.session.commit()

    return {"message": "Password updated successfully"}, 200

@auth_bp.post("/verify-password")
@jwt_required()
def verify_password():
    data = request.get_json(silent=True) or {}
    password = data.get("password")
    
    if not password:
        return {"valid": False}, 400

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    # מחזירים True אם הסיסמה נכונה, אחרת False
    is_valid = user.check_password(password)
    return {"valid": is_valid}, 200

@auth_bp.post("/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    user = User.query.filter_by(email=email).first()

    if user and not user.is_google_user:
        reset_token = create_access_token(
            identity=str(user.id), 
            expires_delta=datetime.timedelta(minutes=15)
        )
        reset_link = f"http://localhost:3000/reset-password/{reset_token}"
        
        sender_info = ("RealEyes System", current_app.config["MAIL_USERNAME"])
        msg = Message(
            subject="RealEyes - Password Reset Request",
            sender=sender_info,
            recipients=[email]
        )
        
        msg.html = f"""
        <div style="background-color: #0f172a; padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: white; text-align: center; border-radius: 20px;">
            <div style="margin-bottom: 20px;">
                <h1 style="background: linear-gradient(135deg, #667eea 0%, #ec4899 100%); -webkit-background-clip: text; color: transparent; font-size: 32px; font-weight: 900; margin: 0;">RealEyes</h1>
                <p style="color: #94a3b8; font-size: 14px;">Deepfake Detection System</p>
            </div>
            
            <div style="background-color: rgba(30, 41, 59, 0.7); padding: 30px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); display: inline-block; width: 100%; max-width: 400px;">
                <h2 style="color: white; margin-top: 0;">Reset Your Password</h2>
                <p style="color: #cbd5e1; line-height: 1.6;">Hi {user.full_name or 'User'},<br>We received a request to reset your password. Click the button below to secure your account.</p>
                
                <a href="{reset_link}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px; box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);">Reset Password</a>
                
                <p style="color: #64748b; font-size: 12px; margin-top: 30px;">This link will expire in 15 minutes.<br>If you didn't request this, please ignore this email.</p>
            </div>
            
            <div style="margin-top: 20px; color: #475569; font-size: 11px;">
                &copy; 2026 RealEyes Project - Sami Shamoon College of Engineering
            </div>
        </div>
        """
        
        try:
            mail.send(msg)
        except Exception as e:
            print(f"Detailed Error: {e}") 
            return {"error": "Failed to send email."}, 500

    return {"message": "If an account exists, a reset link has been sent."}, 200

# איפוס בפועל - מקבל טוקן וסיסמה חדשה
@auth_bp.post("/reset-password-final")
def reset_password_final():
    data = request.get_json()
    token = data.get("token")
    new_password = data.get("password")

    try:
        # אימות הטוקן
        identity = decode_token(token)['sub']
        user = User.query.get(int(identity))
        
        if not user:
            return {"error": "User not found"}, 404

        user.set_password(new_password)
        db.session.commit()
        return {"message": "Password updated successfully"}, 200
    except Exception as e:
        return {"error": "Invalid or expired token"}, 401