from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from ..extensions import db
from ..models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return {"error": "email and password are required"}, 400
    if len(password) < 8:
        return {"error": "password must be at least 8 characters"}, 400

    if User.query.filter_by(email=email).first():
        return {"error": "email already exists"}, 409

    user = User(email=email)
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
    return {"access_token": token}