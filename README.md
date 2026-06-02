# TerraClaim: Forest Rights Act (FRA) Spatial Ledger & Dashboard

TerraClaim is a desktop-grade spatial ledger and decision support dashboard for monitoring, evaluating, and reviewing land claims under the **Forest Rights Act (FRA), 2006** (specifically for Karnataka). It allows administrators and Forest Rights Officers to visualizes spatial claims, query statistical metrics, evaluate program eligibility using a built-in Decision Support System (DSS), review individual records, and generate digital Patta Certificates.

---

## 🏗️ System Architecture

The following diagram illustrates the relationship between the dataset ingestion pipeline, database storage, Python FastAPI server, and the React + Vite frontend dashboard:

```mermaid
graph TD
    %% Datasets & Ingestion
    subgraph Data_Layer["Data Layer"]
        XLSX[FRA_Karnataka_Synthetic_Records.xlsx] -->|Loads spreadsheet data| INGEST[ingest.py]
        DB[(PostgreSQL + PostGIS)]
        INGEST -->|Bulk inserts via psycopg2| DB
    end

    %% Backend Service
    subgraph Backend_Layer["Backend Layer (FastAPI)"]
        API[FastAPI Server: main.py]
        API <-->|SQL Queries & Spatial functions| DB
    end

    %% Frontend App
    subgraph Frontend_Layer["Frontend Layer (React + Vite)"]
        UI[React Dashboard App]
        AXIOS[Axios Client] <-->|HTTP REST Requests| API
        
        subgraph Components["Core Components"]
            MAP[Maplibre GL Map]
            TABLE[Records Table]
            STATS[Analytics & Charts]
            DSS[Decision Support System DSS]
            CERT[Patta Certificate Generator]
            REVIEW[Claim Review Modal]
            GUIDE[Compliance & Info Guide]
        end
        
        UI --> Components
        Components <--> AXIOS
    end

    %% User Interaction
    User([Forest Rights Officer / Admin]) <-->|Interacts with UI| UI

    classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
    classDef highlight fill:#d4edda,stroke:#28a745,stroke-width:2px;
    class INGEST,API,UI highlight;
```

---

## ✨ Features

- 🗺️ **Interactive Spatial Map**: Maplibre GL integration displaying geolocated Individual (IFR), Community (CR), and Community Forest Resource (CFR) claims, color-coded by claim status.
- 📊 **Dynamic Analytics**: Summary dashboard featuring metrics such as total land claimed (in acres), ratio of granted vs. rejected files, and breakdowns by tribal community and district.
- 🔍 **Elastic Search**: Instantly look up claims by Patta ID, claimant name, tribal community, village, or district.
- 💡 **Decision Support System (DSS)**: Automatically computes eligibility for 7 central and state schemes (e.g., PM-KISAN, MGNREGA, JJM, PMAY-G, PMFBY, NSTFDC, DAJGUA) based on applicant's claim metadata.
- 📝 **Workflow Review & Audit**: Inline review modal to update verification dates (Gram Sabha, SDLC, DLC) and final status (Title Granted/Rejected), persisting updates directly to the PostgreSQL database.
- 📜 **Digital Patta Generator**: Automatically compiles official digital land title certificates with unique QR codes, state seals, and signatures for claimants with "Title Granted" status.
- 📚 **Compliance & Guidelines**: Embedded reference manual explaining legal acts, application criteria, and claim verification processes under the FRA.

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Python** (version 3.10 or higher)
- **Node.js** (version 18 or higher) & **npm**
- **PostgreSQL** with the **PostGIS** extension installed

### 2. Database Configuration
1. Initialize a PostgreSQL database named `fra_atlas`:
   ```sql
   CREATE DATABASE fra_atlas;
   ```
2. Enable the PostGIS spatial extension in your database:
   ```sql
   \c fra_atlas;
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Create the database table `fra_records`:
   ```sql
   CREATE TABLE IF NOT EXISTS fra_records (
       patta_id VARCHAR(100) PRIMARY KEY,
       form_type VARCHAR(100) NOT NULL,
       district VARCHAR(100) NOT NULL,
       taluk VARCHAR(100) NOT NULL,
       village VARCHAR(100) NOT NULL,
       claimant_name VARCHAR(255),
       tribal_community VARCHAR(100),
       claim_area_acres NUMERIC(10, 4),
       claim_area_ha NUMERIC(10, 4),
       status VARCHAR(100) NOT NULL,
       gram_sabha_date DATE,
       sdlc_date DATE,
       dlc_date DATE,
       title_date DATE,
       rejection_reason TEXT,
       geom GEOMETRY(Point, 4326),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### 3. Data Ingestion
Run the python data ingestion script to read and populate the database from the synthetic records spreadsheet:
```bash
# Verify your python virtual environment is active
python ingest.py
```

### 4. Backend Setup (FastAPI)
1. Install Python backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the development API server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend documentation will be accessible at http://localhost:8000/docs.*

### 5. Frontend Setup (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The app should be live on http://localhost:5173.*

---

## 📂 Project Structure

```text
├── frontend/                     # React + Vite Client Dashboard
│   ├── src/
│   │   ├── components/           # Sub-modules (Analytics, DSS, Map, PattaCertificate, etc.)
│   │   ├── App.jsx               # App entrypoint and layout framework
│   │   └── index.css             # Main stylesheet
│   ├── package.json              # Client dependencies & scripts
│   └── vite.config.js            # Vite configuration
│
├── main.py                       # FastAPI backend server API
├── ingest.py                     # Database ETL ingestion script
├── requirements.txt              # Python requirements
├── .gitignore                    # Git file exclusions
├── FRA_Karnataka_Synthetic_Records.xlsx # Raw spreadsheet data
└── README.md                     # Project documentation
```
