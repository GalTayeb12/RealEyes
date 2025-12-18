import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .config import Config
from .extensions import db, migrate, jwt

def create_app():
    load_dotenv()

    flask_app = Flask(__name__)
    flask_app.config.from_object(Config)

    CORS(flask_app)

    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    jwt.init_app(flask_app)

    os.makedirs(flask_app.config["UPLOAD_DIR"], exist_ok=True)

    from .routes.auth import auth_bp
    from .routes.upload import upload_bp

    flask_app.register_blueprint(auth_bp, url_prefix="/api/auth")
    flask_app.register_blueprint(upload_bp, url_prefix="/api")

    @flask_app.get("/api/health")
    def health():
        return {"status": "ok"}

    return flask_app