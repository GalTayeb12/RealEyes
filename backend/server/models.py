from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        # זה התיקון: בודקים מול password_hash, לא מול self.password (שלא קיים)
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

    status = db.Column(db.String(32), nullable=False, default="received")  # received/processed/failed
    result = db.Column(db.String(16), nullable=True)  # real/fake
    confidence = db.Column(db.Float, nullable=True)

    error = db.Column(db.String(1024), nullable=True)