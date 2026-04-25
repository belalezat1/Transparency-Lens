# The Transparency Lens — Setup Guide

## 1. Environment Variables

### Server (`server/.env`)
Copy `server/.env.example` to `server/.env` and fill in:

```
MONGO_URI=          # MongoDB Atlas connection string
GEMINI_API_KEY=     # Google AI Studio key (aistudio.google.com)
GEMMA_MODEL=        # e.g. gemma-3-4b-it  (check ai.google.dev/gemma for Gemma 4 ID)
SNOWFLAKE_ACCOUNT=  # format: orgname-accountname
SNOWFLAKE_USER=
SNOWFLAKE_PASSWORD=
SNOWFLAKE_DATABASE= TRANSPARENCY_LENS
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
```

### Client (`client/.env`)
```
VITE_MAPBOX_TOKEN=  # Free token at account.mapbox.com
```

## 2. Snowflake Table (run once in Snowflake worksheet)

```sql
CREATE DATABASE IF NOT EXISTS TRANSPARENCY_LENS;
CREATE SCHEMA IF NOT EXISTS TRANSPARENCY_LENS.PUBLIC;
CREATE TABLE IF NOT EXISTS TRANSPARENCY_LENS.PUBLIC.TRACKER_EVENTS (
  ID VARCHAR,
  HOSTNAME VARCHAR,
  IP VARCHAR,
  CITY VARCHAR,
  LAT FLOAT,
  LNG FLOAT,
  CATEGORY VARCHAR,
  EDUCATIONAL_SUMMARY VARCHAR,
  TS TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
```

## 3. Run the project

```bash
# Terminal 1 — Backend
cd server
node --watch server.js

# Terminal 2 — Frontend
cd client
npm run dev
```

Open http://localhost:5173

## 4. Simulate trackers (no Pi needed)
Click the **"Simulate Tracker"** button on the dashboard — it calls `POST /demo` which uses Gemma 4 to generate a live educational summary and streams it to all clients.

## 5. Raspberry Pi (optional)
```bash
pip install mitmproxy requests ollama
ollama pull gemma3:4b   # or gemma4:... when available
mitmproxy --mode transparent -s narrator.py
```
Update `BACKEND_URL` in `narrator.py` to your dashboard machine's IP.
