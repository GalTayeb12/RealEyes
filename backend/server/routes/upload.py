import os
from flask import Blueprint, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import ScanLog
from ..utils import allowed_filename, safe_save

upload_bp = Blueprint("upload", __name__)

@upload_bp.post("/upload")
@jwt_required()
def upload_image():
    user_id = get_jwt_identity()
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    if "file" not in request.files:
        return {"error": "missing file field"}, 400

    f = request.files["file"]
    if not f or not f.filename:
        return {"error": "no file selected"}, 400

    if not allowed_filename(f.filename):
        return {"error": "unsupported file type (jpg/jpeg/png only)"}, 415

    upload_dir = current_app.config["UPLOAD_DIR"]
    new_name, path = safe_save(f, upload_dir)
    size = os.path.getsize(path)

    log = ScanLog(
        user_id=int(user_id),
        ip=ip,
        filename=new_name,
        original_name=f.filename,
        file_size=size,
        mimetype=f.mimetype,
        status="received",
    )
    db.session.add(log)
    db.session.commit()

    return {"scan_id": log.id, "status": log.status, "filename": new_name}, 201