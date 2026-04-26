"""
narrator.py — mitmproxy addon (regular proxy mode)
Run: mitmdump --mode regular --listen-port 8080 -s narrator.py

Demo device proxy config:
  HTTP Proxy:  10.139.24.64  port 8080
  HTTPS Proxy: 10.139.24.64  port 8080
"""

import re
import threading
import requests
from concurrent.futures import ThreadPoolExecutor
from mitmproxy import http

BACKEND_URL = "http://localhost:3001"
_pool = ThreadPoolExecutor(max_workers=6)

CATEGORY_PATTERNS = {
    "Advertising": re.compile(
        r"(doubleclick|googlesyndication|adnxs|rubiconproject|openx|pubmatic|"
        r"criteo|moatads|taboola|outbrain|adsystem|adtech|adzerk|adsrvr|adform|"
        r"advertising\.com|ads\.twitter|ads\.linkedin|ads\.yahoo|tribalfusion|"
        r"casalemedia|appnexus|mediaplex|smartadserver|sizmek|"
        r"amazon-adsystem|adsafeprotected|sharethrough|bidswitch|"
        r"indexexchange|thetradedesk|mathtag|mediamath|krxd|"
        r"everesttech|demdex|bluekai|lotame|mopub|yieldmo|"
        r"undertone|conversantmedia|contextweb|lijit|sovrn|"
        r"turn\.com|w55c\.net|adadvisor|platform161|semasio|"
        r"yieldify|justpremium|ipredictive|eyereturn|"
        r"2mdn\.net|chartboost|applovin|unrulymedia|"
        r"adroll|retargeter|perfectaudience|sitescout|"
        r"brightroll|dataxu|bidsw\.com|rlcdn\.com|"
        r"pixel\.advertising|google\.com/pagead|pagead)",
        re.IGNORECASE,
    ),
    "Fingerprinting": re.compile(
        r"(fingerprintjs|iovation|threatmetrix|kaptcha|botd|augur\.io|"
        r"deviceidentification|clearsale|forter|signifyd|liveramp|"
        r"clarity\.ms|inspectlet|sessioncam|luckyorange|"
        r"mouseflow|fullstory|heap\.io|hotjar|sessionstack|"
        r"logrocket|smartlook|glassbox|contentsquare|"
        r"quantum\.metric|decibel\.com|userzoom)",
        re.IGNORECASE,
    ),
    "Social": re.compile(
        r"(connect\.facebook|platform\.twitter|platform\.linkedin|"
        r"api\.pinterest|accounts\.google|oauth|login\.live|"
        r"staticxx\.facebook|graph\.facebook|pixel\.facebook|"
        r"facebook\.net|instagram\.com/api|twitter\.com/i/|"
        r"linkedin\.com/li|snapchat\.com/p|tiktok\.com/api|"
        r"pinterest\.com/ct)",
        re.IGNORECASE,
    ),
    "Analytics": re.compile(
        r"(google-analytics|googletagmanager|analytics|"
        r"scorecardresearch|quantserve|chartbeat|parsely|"
        r"mixpanel|amplitude|segment\.io|"
        r"newrelic|datadog|dynatrace|nr-data\.net|"
        r"omtrdc|adobedtm|omniture|"
        r"permutive|piano\.io|"
        r"intercom\.io|intercom\.com|"
        r"branch\.io|appsflyer|adjust\.com|kochava|"
        r"mparticle|rudderstack|snowplowanalytics|"
        r"comscore|nielsen|conviva|"
        r"crazyegg|optimizely|vwo\.com|"
        r"kissmetrics|woopra|clicky|"
        r"statcounter|clicktale|"
        r"bugsnag|sentry\.io|rollbar|"
        r"tealiumiq|ensighten|qualtrics|surveymonkey)",
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
            timeout=8,
        )
        return r.json().get("summary", "")
    except Exception:
        return f"{hostname} collects behavioral and technical metadata to build advertising and analytics profiles."


def process_tracker(hostname: str, server_ip: str | None):
    category = detect_category(hostname)
    if not category:
        return

    with SEEN_LOCK:
        if hostname in SEEN:
            return
        SEEN.add(hostname)

    geo_target = server_ip if server_ip else hostname
    location = get_geoip(geo_target)
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
        print(f"[narrator] ✓  {hostname:45s} {category:15s} {location['city']}")
    except Exception as e:
        print(f"[narrator] ✗  {hostname}: {e}")


class TrackerInterceptor:

    def http_connect(self, flow: http.HTTPFlow) -> None:
        hostname = flow.request.host
        server_ip = (
            flow.server_conn.peername[0]
            if flow.server_conn and flow.server_conn.peername
            else None
        )
        if detect_category(hostname):
            print(f"[connect]  {hostname}")
        _pool.submit(process_tracker, hostname, server_ip)

    def request(self, flow: http.HTTPFlow) -> None:
        # Catch CONNECT as fallback and plain HTTP
        hostname = flow.request.pretty_host if flow.request.method != "CONNECT" else flow.request.host
        if not hostname:
            return
        server_ip = (
            flow.server_conn.peername[0]
            if flow.server_conn and flow.server_conn.peername
            else None
        )
        _pool.submit(process_tracker, hostname, server_ip)


addons = [TrackerInterceptor()]
