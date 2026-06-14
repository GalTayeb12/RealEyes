import os
import uuid
import hashlib
import requests
from PIL import Image
from PIL.ExifTags import TAGS
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="RealEyes_Forensics")

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

def calculate_file_hash(file_storage):
    sha256_hash = hashlib.sha256()
    for byte_block in iter(lambda: file_storage.read(4096), b""):
        sha256_hash.update(byte_block)
    file_storage.seek(0)
    return sha256_hash.hexdigest()

def check_virustotal(file_hash, api_key):
    if not api_key:
        return True, "No API key"
    url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
    headers = {"accept": "application/json", "x-apikey": api_key}
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            malicious_votes = data['data']['attributes']['last_analysis_stats']['malicious']
            if malicious_votes > 0:
                return False, f"Malicious ({malicious_votes} engines)"
            return True, "Clean"
        return True, "Not found in VT (Safe)"
    except:
        return True, "Connection Error"

def get_image_metadata(file_path):
    metadata = {
        'Format': 'Missing',
        'Resizing': 'Unknown', 
        'Model': 'Missing',
        'Software': 'Missing',
        'Timestamp': 'Missing',
        'Location': 'Missing'
    }
    
    try:
        img = Image.open(file_path)
        actual_w, actual_h = img.size
        metadata['Format'] = str(img.format)
        
        info = img._getexif()
        if info:
            exif_w = info.get(40962) 
            exif_h = info.get(40963) 
            if exif_w and exif_h:
                try:
                    if int(exif_w) != actual_w or int(exif_h) != actual_h:
                        metadata['Resizing'] = 'Modified'
                    else:
                        metadata['Resizing'] = 'Original'
                except: pass

            for tag, value in info.items():
                decoded = TAGS.get(tag, tag)
                
                if decoded == 'Model':
                    metadata['Model'] = str(value).strip()
                elif decoded == 'Software':
                    metadata['Software'] = str(value).strip()
                elif decoded == 'DateTimeOriginal' or decoded == 'DateTime':
                    metadata['Timestamp'] = str(value).strip()
                
                elif decoded == 'GPSInfo':
                    try:
                        lat = value.get(2)
                        lon = value.get(4)
                        if lat and lon:
                            lat_deg = float(lat[0] + lat[1]/60 + lat[2]/3600)
                            lon_deg = float(lon[0] + lon[1]/60 + lon[2]/3600)
                            
                            location_str = f"{lat_deg}, {lon_deg}"
                            try:
                                location_data = geolocator.reverse(location_str, language='en').raw.get('address', {})
                                city = location_data.get('city') or location_data.get('town') or location_data.get('village', 'Unknown City')
                                country = location_data.get('country', 'Unknown Country')
                                metadata['Location'] = f"{city}, {country}"
                            except:
                                metadata['Location'] = location_str
                    except:
                        metadata['Location'] = "Available"
        
        if metadata['Software'] == 'Missing' and img.info.get('software'):
            metadata['Software'] = str(img.info['software'])

        soft = metadata['Software']
        model = metadata['Model']
        if soft != 'Missing':
            is_apple_ver = soft.replace('.', '').isdigit()
            if "iPhone" in model or is_apple_ver:
                metadata['Software'] = f"iOS {soft}"

    except Exception as e:
        print(f"Metadata extraction error: {e}")
    
    return metadata