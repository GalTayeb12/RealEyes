import os
import uuid

ALLOWED_EXT = {"jpg", "jpeg", "png"}

def allowed_filename(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXT

def safe_save(file_storage, upload_dir: str):
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    new_name = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(upload_dir, new_name)
    file_storage.save(path)
    return new_name, path