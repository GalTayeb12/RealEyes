import os
from flask import Blueprint, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import ScanLog
from ..utils import allowed_filename, safe_save, calculate_file_hash, check_virustotal, get_image_metadata
from datetime import timedelta

upload_bp = Blueprint("upload", __name__)

@upload_bp.post("")
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

    file_hash = calculate_file_hash(f)
    vt_api_key = current_app.config.get("VIRUSTOTAL_API_KEY")
    is_safe, vt_message = check_virustotal(file_hash, vt_api_key)
    
    metadata = {}
    upload_dir = current_app.config["UPLOAD_DIR"]
    
    if is_safe:
        new_name, path = safe_save(f, upload_dir)
        size = os.path.getsize(path)
        status_val = "received"
        # חילוץ מטא-דאטה
        metadata = get_image_metadata(path)
    else:
        new_name = "BLOCKED"
        size = 0
        status_val = "blocked_malicious"

    log = ScanLog(
        user_id=int(user_id),
        ip=ip,
        filename=new_name,
        original_name=f.filename,
        file_size=size,
        mimetype=f.mimetype,
        status=status_val,
        file_hash=file_hash,
        vt_message=vt_message
    )
    db.session.add(log)
    db.session.commit()

    return {
        "scan_id": log.id, 
        "status": log.status, 
        "filename": new_name,
        "is_safe": is_safe,
        "vt_message": vt_message,
        "metadata": metadata,
        "confidence": log.confidence,
        "file_hash": file_hash 
    }, 201

@upload_bp.get("/history")
@jwt_required()
def get_history():
    try:
        user_id = int(get_jwt_identity())
        scans = ScanLog.query.filter_by(user_id=user_id).order_by(ScanLog.created_at.desc()).all()
        results = []
        for scan in scans:
            is_malicious = (scan.status == "blocked_malicious")
            
            # --- התיקון כאן: הוספת 3 שעות לזמן ישראל ---
            # בודקים שהתאריך קיים, מוסיפים 3 שעות, ואז מפרמטים לטקסט
            local_time = scan.created_at + timedelta(hours=3) if scan.created_at else None
            display_date = local_time.strftime("%d/%m/%Y %H:%M") if local_time else "N/A"
            
            results.append({
                "id": scan.id,
                "date": display_date,
                "filename": scan.original_name or "Unknown",
                "status": scan.status,
                "result_text": "Malicious" if is_malicious else "Clean (VT)",
                "is_safe": not is_malicious,
                "confidence": scan.confidence
            })
        return {"history": results}, 200
    except Exception as e:
        print(f"ERROR in get_history: {e}")
        return {"error": str(e)}, 500