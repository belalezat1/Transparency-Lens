"""
narrator.py — Raspberry Pi transparent proxy addon for The Transparency Lens
Run: mitmproxy --mode transparent -s narrator.py

Dependencies (pip):
  mitmproxy, requests, ollama

Ollama model:
  Pull the Gemma 4 model: ollama pull gemma3:4b
  (Update GEMMA_MODEL below when Gemma 4 releases under a new tag)
"""

import re
import threading
import requests
from mitmproxy import http

BACKEND_URL = "http://YOUR_DASHBOARD_IP:3001/ingest"
GEMMA_MODEL = "gemma3:4b"  # update to gemma4:... when available

CATEGORY_PATTERNS = {
    "Advertising": re.compile(
        r"(doubleclick|googlesyndication|adnxs|rubiconproject|openx|pubmatic|"
        r"criteo|moatads|taboola|outbrain|adsystem|adtech|adzerk|adsrvr|adform|"
        r"advertising\.com|ads\.twitter|ads\.linkedin|ads\.yahoo|tribalfusion|"
        r"casalemedia|appnexus|mediaplex|smartadserver|sizmek)",
        re.IGNORECASE,
    ),
    "Fingerprinting": re.compile(
        r"(fingerprintjs|iovation|threatmetrix|kaptcha|botd|augur\.io|"
        r"deviceidentification|clearsale|forter|signifyd|liveramp)",
        re.IGNORECASE,
    ),
    "Social": re.compile(
        r"(connect\.facebook|platform\.twitter|platform\.linkedin|"
        r"api\.pinterest|accounts\.google|oauth|login\.live|"
        r"staticxx\.facebook|graph\.facebook)",
        re.IGNORECASE,
    ),
    "Analytics": re.compile(
        r"(google-analytics|googletagmanager|analytics|hotjar|"
        r"mixpanel|amplitude|segment\.io|heap\.io|fullstory|"
        r"scorecardresearch|quantserve|chartbeat|parsely|"
        r"mouseflow|crazyegg|luckyorange|newrelic|datadog|dynatrace)",
        re.IGNORECASE,
    ),
}

SEEN = set()
SEEN_LOCK = threading.Lock()


def detect_category(hostname: str) -> str | None:
    for category, pattern in CATEGORY_PATTERNS.items():
        if pattern.search(hostname):
            return category
    return None


def get_educational_summary(hostname: str) -> str:
    try:
        import ollama
        prompt = (
            f"Act as a privacy educator. In one professional sentence, explain what a data tracker "
            f"at {hostname} is and how its data collection contributes to a user's digital profile. "
            f"Be objective and factual."
        )
        response = ollama.chat(
            model=GEMMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        return response["message"]["content"].strip()
    except Exception as e:
        return f"{hostname} collects user behavioral metadata to support advertising and analytics pipelines."


def get_geoip(ip: str) -> dict:
    try:
        data = requests.get(f"http://ip-api.com/json/{ip}", timeout=3).json()
        return {
            "lat": data.get("lat", 0),
            "lng": data.get("lon", 0),
            "city": data.get("city", "Unknown"),
        }
    except Exception:
        return {"lat": 0, "lng": 0, "city": "Unknown"}


def process_tracker(hostname: str, server_ip: str):
    category = detect_category(hostname)
    if not category:
        return

    with SEEN_LOCK:
        if hostname in SEEN:
            return
        SEEN.add(hostname)

    location = get_geoip(server_ip)
    summary = get_educational_summary(hostname)

    payload = {
        "hostname": hostname,
        "ip": server_ip,
        "location": location,
        "educational_summary": summary,
        "category": category,
    }

    try:
        requests.post(BACKEND_URL, json=payload, timeout=5)
        print(f"[narrator] Sent: {hostname} ({category}) · {location['city']}")
    except Exception as e:
        print(f"[narrator] POST failed for {hostname}: {e}")


class TrackerInterceptor:
    def request(self, flow: http.HTTPFlow) -> None:
        hostname = flow.request.pretty_host
        if not hostname:
            return
        server_ip = (
            flow.server_conn.peername[0]
            if flow.server_conn and flow.server_conn.peername
            else "0.0.0.0"
        )
        # Run in background thread so mitmproxy isn't blocked by ollama inference
        threading.Thread(
            target=process_tracker, args=(hostname, server_ip), daemon=True
        ).start()


addons = [TrackerInterceptor()]
