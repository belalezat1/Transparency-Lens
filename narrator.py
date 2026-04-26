"""
narrator.py — mitmproxy addon (regular proxy mode)
Run: mitmdump --mode regular --listen-port 8080 -s narrator.py

Demo device proxy config:
  HTTP Proxy:  10.139.24.64  port 8080
  HTTPS Proxy: 10.139.24.64  port 8080

No certificate installation needed — hostnames are captured from the
CONNECT request before the TLS handshake starts.
"""

import re
import threading
import requests
from concurrent.futures import ThreadPoolExecutor
from mitmproxy import http

BACKEND_URL = "http://localhost:3001"
_pool = ThreadPoolExecutor(max_workers=4)

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

SEEN      = set()
SEEN_LOCK = threading.Lock()


def detect_category(hostname: str) -> str | None:
    for category, pattern in CATEGORY_PATTERNS.items():
        if pattern.search(hostname):
            return category
    return None


def get_geoip(host: str) -> dict:
    # ip-api.com accepts both IPs and hostnames
    try:
        data = requests.get(f"http://ip-api.com/json/{host}", timeout=3).json()
        return {
            "lat": data.get("lat", 0),
            "lng": data.get("lon", 0),
            "city": data.get("city", "Unknown"),
        }
    except Exception:
        return {"lat": 0, "lng": 0, "city": "Unknown"}


def get_summary(hostname: str) -> str:
    try:
        r = requests.get(
            f"{BACKEND_URL}/api/educational-summary",
            params={"hostname": hostname},
            timeout=10,
        )
        return r.json().get("summary", "")
    except Exception:
        return f"{hostname} collects user behavioral metadata for advertising and analytics pipelines."


def process_tracker(hostname: str, server_ip: str | None):
    category = detect_category(hostname)
    if not category:
        return

    with SEEN_LOCK:
        if hostname in SEEN:
            return
        SEEN.add(hostname)

    # Use hostname for GeoIP if no IP available
    geo_target = server_ip if server_ip else hostname
    location = get_geoip(geo_target)
    # Don't skip on GeoIP failure — still show in feed and pie chart, map just skips the arc

    summary = get_summary(hostname)

    payload = {
        "hostname": hostname,
        "ip": server_ip or "0.0.0.0",
        "location": location,
        "educational_summary": summary,
        "category": category,
    }

    try:
        requests.post(f"{BACKEND_URL}/ingest", json=payload, timeout=5)
        print(f"[narrator] ✓  {hostname:40s} {category:15s} {location['city']}")
    except Exception as e:
        print(f"[narrator] ✗  {hostname}: {e}")


class TrackerInterceptor:

    def http_connect(self, flow: http.HTTPFlow) -> None:
        """
        HTTPS path — fires when client sends CONNECT, before TLS handshake.
        We capture the hostname here so no certificate installation is needed.
        """
        hostname = flow.request.host
        print(f"[http_connect] {hostname}")
        server_ip = (
            flow.server_conn.peername[0]
            if flow.server_conn and flow.server_conn.peername
            else None
        )
        _pool.submit(process_tracker, hostname, server_ip)

    def request(self, flow: http.HTTPFlow) -> None:
        """HTTP plain-text path only — HTTPS is handled by http_connect above."""
        if flow.request.method == "CONNECT":
            return  # already handled in http_connect
        hostname = flow.request.pretty_host
        if not hostname:
            return
        server_ip = (
            flow.server_conn.peername[0]
            if flow.server_conn and flow.server_conn.peername
            else None
        )
        _pool.submit(process_tracker, hostname, server_ip)


addons = [TrackerInterceptor()]
