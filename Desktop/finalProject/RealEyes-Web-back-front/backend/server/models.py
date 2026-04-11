from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    
    username = db.Column(db.String(100), unique=True, nullable=True) 
    full_name = db.Column(db.String(100), nullable=True)
    
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_google_user = db.Column(db.Boolean, default=False)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class ScanLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    ip = db.Column(db.String(64), nullable=True)

    filename = db.Column(db.String(512), nullable=True)
    original_name = db.Column(db.String(512), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    mimetype = db.Column(db.String(128), nullable=True)

    status = db.Column(db.String(32), nullable=False, default="received")
    result = db.Column(db.String(16), nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    
    file_hash = db.Column(db.String(128), nullable=True)
    vt_message = db.Column(db.String(255), nullable=True)

    error = db.Column(db.String(1024), nullable=True)