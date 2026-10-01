# Mini SOC (Security Operations Center)

A comprehensive mini Security Operations Center (SOC) monitoring system built with Next.js and FastAPI. The platform utilizes a machine learning model to evaluate network logs, classify threat levels in real time, map source IPs, and dispatch automated email alerts for high-risk activities.

## 🚀 Project Overview

The Mini SOC system provides real-time security monitoring by analyzing network logs, classifying them using a pre-trained Random Forest model, and alerting administrators of suspicious activities. It includes a frontend dashboard for data visualization, a backend API for log processing, and a traffic simulator to generate test data.

### Key Features
*   **Live Dashboard**: Real-time KPI metrics, streaming log updates, and top threats analysis.
*   **Threat Mapping**: Geographical visualization of source IPs using Leaflet and GeoIP2.
*   **ML-Powered Threat Detection**: Evaluates network features to calculate a risk score (0-100) and classifies traffic as Normal, Suspicious, or Malicious using a Random Forest model.
*   **Automated Alerting**: Sends SMTP email notifications when an event's risk score exceeds a configurable threshold.
*   **Traffic Simulation**: A built-in log simulator that periodically injects realistic threat data into the system, which can be toggled on/off directly from the dashboard.
*   **Manual Testing**: Dashboard interface for manually injecting custom log payloads to test the classification system.
*   **Dynamic Configuration**: Configurable administrator email and alert threshold directly via the UI dashboard.

## 🏗️ Architecture & Tech Stack

### Frontend
*   **Framework**: Next.js 15 (App Router), React 19
*   **Styling**: Tailwind CSS
*   **Mapping**: Leaflet, react-leaflet, react-leaflet-cluster
*   **HTTP Client**: Axios
*   **Testing**: Jest, React Testing Library

### Backend
*   **Framework**: FastAPI
*   **Database**: SQLite (`soc.db`)
*   **Machine Learning**: Scikit-Learn, pandas, joblib (Random Forest Classifier)
*   **Geolocation**: GeoIP2 with MaxMind GeoLite2-City database
*   **Email**: Python `smtplib`

## 📂 Project Structure

```
miniproj-soc/
├── backend/
│   ├── app/
│   │   ├── config.py         # Environment variables & SMTP settings
│   │   ├── database.py       # SQLite connection and table initialization
│   │   ├── email_service.py  # SMTP email formatting and dispatch
│   │   ├── geoip.py          # IP Geolocation using GeoIP2
│   │   ├── main.py           # FastAPI application and API routes
│   │   ├── model.py          # Joblib ML model loader and prediction logic
│   │   └── schemas.py        # Pydantic schemas for request validation
│   ├── geoip/                # GeoLite2-City.mmdb database
│   ├── ml/
│   │   └── train_model.ipynb # Jupyter notebook for model training
│   ├── tests/                # Pytest suites
│   ├── rf_model.joblib       # Pre-trained Random Forest model
│   ├── dataset.csv           # ML training dataset
│   └── simulator.py          # Background script injecting test logs
└── frontend/
    ├── app/                  # Next.js App Router (page.tsx, layout.tsx, etc.)
    ├── components/           # React components (Header, ThreatMap, KpiGrid, etc.)
    ├── services/             # Axios API client wrapper (api.ts)
    └── package.json          # Frontend dependencies and scripts
```

## 💾 Database Schema

The backend uses a local SQLite database (`soc.db`) with two main tables:

**`threat_logs`**
*   `id` (INTEGER PRIMARY KEY)
*   `timestamp` (DATETIME)
*   `source_ip` (TEXT)
*   `latitude` (FLOAT)
*   `longitude` (FLOAT)
*   `country` (TEXT)
*   `risk_score` (FLOAT)
*   `classification` (TEXT)
*   `email_sent` (BOOLEAN)

**`system_settings`**
*   `key` (TEXT PRIMARY KEY) - e.g., `admin_email`, `alert_threshold`, `cooldown_minutes`
*   `value` (TEXT)

## 🔌 API Endpoints

### Threat Logging & Analysis
*   `POST /api/manual-log`: Injects a log, performs risk prediction, locates the IP, stores the event, and triggers an email if the risk threshold is met.
*   `GET /api/logs`: Retrieves the latest threat logs (default limit: 50) ordered by descending timestamp.

### System Configuration
*   `GET /api/settings`: Fetches current system settings (`admin_email`, `alert_threshold`).
*   `PUT /api/settings`: Updates the system settings.

### Simulator Control
*   `GET /api/simulator/status`: Checks if the background simulator script is running.
*   `POST /api/simulator/start`: Spawns the `simulator.py` subprocess.
*   `POST /api/simulator/stop`: Terminates the simulator subprocess.

## 🧠 Machine Learning & Threat Classification

The system utilizes a Random Forest model (`rf_model.joblib`) trained on `dataset.csv`. 
Extracted features include `failed_login_count`, `login_success_ratio`, `privilege_target`, `hour_of_day`, `is_off_hours`, `action_frequency`, `connection_rate`, `bytes_transferred`, and `is_new_ip`.

**Classification Logic:**
*   **Risk Score < 40**: `Normal`
*   **Risk Score < 75**: `Suspicious`
*   **Risk Score >= 75**: `Malicious`

## ⚙️ Environment Variables

The backend relies on the following environment variables (defined in `backend/app/config.py`). If not provided, it falls back to hardcoded defaults.

| Variable | Description |
| :--- | :--- |
| `SOC_DB_NAME` | Database filename (default: `soc.db`) |
| `SOC_SENDER_EMAIL` | SMTP Sender Email Address |
| `SOC_SENDER_PASSWORD`| SMTP Application Password |
| `SOC_SMTP_SERVER` | SMTP Server (default: `smtp.gmail.com`) |
| `SOC_SMTP_PORT` | SMTP Port (default: `587`) |
| `SOC_SMTP_TIMEOUT_SECONDS` | SMTP Connection Timeout (default: `5`) |

## 🛠️ Local Installation & Setup

### Backend
1. Navigate to the `backend` directory.
2. Ensure you have Python 3.8+ installed.
3. Install dependencies:
   *(Note: The repository uses `requirements-dev.txt` for pytest, ensure FastAPI, Uvicorn, Pandas, Scikit-Learn, Joblib, and GeoIP2 are installed manually or create a virtual environment)*
   ```bash
   pip install fastapi uvicorn pandas scikit-learn joblib geoip2 requests pytest
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

## 🧪 Testing

*   **Frontend**: Tests are written using Jest and React Testing Library. 
    *   Run tests: `npm test` or `npm run test:watch`
*   **Backend**: Pytest is configured via `pytest.ini` and `requirements-dev.txt`.
    *   Test suites reside in `backend/tests/`.
    *   A manual script (`backend/test_email.py`) is present to verify SMTP connectivity.

## ⚠️ Current Limitations
*   Docker/Containerization is not currently implemented in the repository.
*   Authentication and Authorization (e.g., JWT, OAuth) for the API and Dashboard are not implemented.
*   `requirements.txt` is missing for the backend; only `requirements-dev.txt` is provided.
