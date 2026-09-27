import requests
import random

# Curated list of countries from the frontend mapping
COUNTRIES = [
    {"code": "RU", "name": "Russia", "lat": 61.0, "lng": 105.0, "weight": 0.15},
    {"code": "CN", "name": "China", "lat": 35.0, "lng": 105.0, "weight": 0.15},
    {"code": "US", "name": "United States", "lat": 38.0, "lng": -97.0, "weight": 0.12},
    {"code": "BR", "name": "Brazil", "lat": -14.0, "lng": -51.0, "weight": 0.08},
    {"code": "IN", "name": "India", "lat": 22.0, "lng": 78.0, "weight": 0.1},
    {"code": "DE", "name": "Germany", "lat": 51.0, "lng": 10.0, "weight": 0.08},
    {"code": "KP", "name": "N. Korea", "lat": 40.0, "lng": 127.0, "weight": 0.12},
    {"code": "IR", "name": "Iran", "lat": 32.0, "lng": 53.0, "weight": 0.08},
    {"code": "NG", "name": "Nigeria", "lat": 9.0, "lng": 8.0, "weight": 0.06},
    {"code": "UA", "name": "Ukraine", "lat": 48.0, "lng": 31.0, "weight": 0.06},
]

def get_random_country():
    # Weighted choice based on typical threat vectors in cybersecurity-mlops dataset
    choices = [c for c in COUNTRIES]
    weights = [c["weight"] for c in COUNTRIES]
    return random.choices(choices, weights=weights, k=1)[0]

def is_private_ip(ip):
    if not ip:
        return True
    parts = ip.split('.')
    if len(parts) != 4:
        return True
    try:
        p1, p2 = int(parts[0]), int(parts[1])
        if p1 == 10:
            return True
        if p1 == 172 and 16 <= p2 <= 31:
            return True
        if p1 == 192 and p2 == 168:
            return True
        if p1 == 127:
            return True
    except ValueError:
        return True
    return False

def resolve_ip(ip):
    """
    Resolves an IP to its geo-location (country code, name, latitude, longitude).
    If it is a private IP, it assigns a realistic attack vector location mock-style
    for simulation and demo purposes, ensuring that all detections are mapped.
    If it is a public IP, it tries to fetch from ip-api.com.
    """
    if is_private_ip(ip):
        # Local or simulated IPs: Assign a realistic threat actor country randomly
        country_info = get_random_country()
        return {
            "country_code": country_info["code"],
            "country_name": country_info["name"],
            "latitude": country_info["lat"],
            "longitude": country_info["lng"]
        }
    
    # Public IP: Attempt real GeoIP resolution
    try:
        response = requests.get(f"http://ip-api.com/json/{ip}", timeout=1.2)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "country_code": data.get("countryCode", "US"),
                    "country_name": data.get("country", "United States"),
                    "latitude": data.get("lat", 38.0),
                    "longitude": data.get("lon", -97.0)
                }
    except Exception as e:
        print(f"[GeoIP] Resolution failed for {ip}: {e}")
    
    # Fallback if request fails
    country_info = get_random_country()
    return {
        "country_code": country_info["code"],
        "country_name": country_info["name"],
        "latitude": country_info["lat"],
        "longitude": country_info["lng"]
    }
