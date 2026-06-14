import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .config import Config
from .extensions import db, migrate, jwt, mail 

def create_app():
    load_dotenv()

    flask_app = Flask(__name__)
    flask_app.config.from_object(Config)

    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    jwt.init_app(flask_app)
    mail.init_app(flask_app) 
    
    os.makedirs(flask_app.config["UPLOAD_DIR"], exist_ok=True)
    from .routes.auth import auth_bp
    from .routes.upload import upload_bp
    from .routes.health import health_bp

    flask_app.register_blueprint(auth_bp, url_prefix="/api/auth")
    flask_app.register_blueprint(upload_bp, url_prefix="/api/upload")
    flask_app.register_blueprint(health_bp)

    @flask_app.get("/api/health")
    def health_check():
        return {"status": "ok"}

    CORS(flask_app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}})

    return flask_app