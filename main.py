from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg2
import psycopg2.extras
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel

app = FastAPI(title="FRA Atlas API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB = dict(host="localhost", port=5432, dbname="fra_atlas",
          user="postgres", password="fra2006")

def get_conn():
    return psycopg2.connect(**DB)

def clean(v):
    if isinstance(v, Decimal):
        return float(v)
    return v

def clean_dict(d):
    return {k: clean(v) for k, v in d.items()}


# ── HEALTH ─────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "FRA Atlas API running", "version": "1.0.0"}


# ── ALL RECORDS AS GEOJSON ──────────────────────────────────
@app.get("/api/fra/geojson")
def get_geojson(
    district:  Optional[str] = Query(None),
    form_type: Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
    tribe:     Optional[str] = Query(None),
):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    filters = ["geom IS NOT NULL"]
    params  = []

    if district:
        filters.append("district = %s")
        params.append(district)
    if form_type:
        filters.append("form_type = %s")
        params.append(form_type)
    if status:
        filters.append("status = %s")
        params.append(status)
    if tribe:
        filters.append("tribal_community = %s")
        params.append(tribe)

    where = " AND ".join(filters)

    cur.execute(f"""
        SELECT
            patta_id, form_type, district, taluk, village,
            claimant_name, tribal_community,
            claim_area_acres, claim_area_ha, status,
            gram_sabha_date::text, sdlc_date::text,
            dlc_date::text, title_date::text, rejection_reason,
            ST_X(geom) AS lng, ST_Y(geom) AS lat
        FROM fra_records
        WHERE {where}
        ORDER BY district, village;
    """, params)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(r["lng"]), float(r["lat"])]
            },
            "properties": {k: clean(v) for k, v in r.items()
                           if k not in ("lng", "lat")}
        })

    return JSONResponse({
        "type": "FeatureCollection",
        "count": len(features),
        "features": features
    })


# ── SUMMARY STATS ───────────────────────────────────────────
@app.get("/api/fra/stats")
def get_stats():
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT
            COUNT(*)                                             AS total,
            COUNT(*) FILTER (WHERE status = 'Title Granted')    AS granted,
            COUNT(*) FILTER (WHERE status = 'Rejected')         AS rejected,
            COUNT(*) FILTER (WHERE form_type = 'Form A (IFR)')  AS ifr,
            COUNT(*) FILTER (WHERE form_type = 'Form B (CR)')   AS cr,
            COUNT(*) FILTER (WHERE form_type = 'Form C (CFR)')  AS cfr,
            ROUND(SUM(claim_area_acres)::numeric, 2)            AS total_acres
        FROM fra_records;
    """)
    summary = clean_dict(dict(cur.fetchone()))

    cur.execute("""
        SELECT district, COUNT(*) AS count,
               ROUND(SUM(claim_area_acres)::numeric, 2) AS acres
        FROM fra_records
        GROUP BY district ORDER BY count DESC;
    """)
    summary["by_district"] = [clean_dict(dict(r)) for r in cur.fetchall()]

    cur.execute("""
        SELECT status, COUNT(*) AS count
        FROM fra_records
        GROUP BY status ORDER BY count DESC;
    """)
    summary["by_status"] = [clean_dict(dict(r)) for r in cur.fetchall()]

    cur.execute("""
        SELECT tribal_community, COUNT(*) AS count
        FROM fra_records
        GROUP BY tribal_community ORDER BY count DESC;
    """)
    summary["by_tribe"] = [clean_dict(dict(r)) for r in cur.fetchall()]

    cur.close()
    conn.close()
    return summary


# ── SINGLE RECORD ───────────────────────────────────────────
@app.get("/api/fra/record/{patta_id}")
def get_record(patta_id: str):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT *, ST_X(geom) AS lng, ST_Y(geom) AS lat
        FROM fra_records WHERE patta_id = %s;
    """, (patta_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return JSONResponse({"error": "Not found"}, status_code=404)
    return clean_dict(dict(row))


# ── DISTRICTS LIST ──────────────────────────────────────────
@app.get("/api/fra/districts")
def get_districts():
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("SELECT DISTINCT district FROM fra_records ORDER BY district;")
    districts = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return {"districts": districts}

# ── DSS ENGINE ──────────────────────────────────────────────
@app.get("/api/fra/dss")
def get_dss(
    district:  Optional[str] = Query(None),
    status:    Optional[str] = Query(None),
):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    filters = ["1=1"]
    params  = []
    if district:
        filters.append("district = %s")
        params.append(district)
    if status:
        filters.append("status = %s")
        params.append(status)

    cur.execute(f"""
        SELECT
            patta_id, form_type, district, taluk, village,
            claimant_name, tribal_community,
            claim_area_acres, status, title_date::text
        FROM fra_records
        WHERE {' AND '.join(filters)}
        ORDER BY district, village;
    """, params)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    PVTG = ['Soliga','Jenu Kuruba','Koraga','Paniyan','Malekudiya','Nayaka','Hasala']

    results = []
    for r in rows:
        r = clean_dict(dict(r))
        ft      = r['form_type']
        st      = r['status']
        tribe   = r['tribal_community']
        acres   = r['claim_area_acres'] or 0
        granted = st == 'Title Granted'
        ifr     = 'A' in ft
        cr      = 'B' in ft
        cfr     = 'C' in ft
        pvtg    = tribe in PVTG

        schemes = {
            'PM_KISAN':  'Yes' if (ifr and granted) else 'No',
            'MGNREGA':   'Yes',
            'JJM':       'Yes' if (cfr or cr) else 'Check',
            'PMAY_G':    'Yes' if (ifr and granted) else 'No',
            'PMFBY':     'Yes' if (ifr and acres > 0) else 'No',
            'DAJGUA':    'Yes' if cfr else 'No',
            'NSTFDC':    'Yes' if pvtg else 'Check',
        }

        eligible_count = sum(1 for v in schemes.values() if v == 'Yes')

        results.append({**r, **schemes, 'eligible_count': eligible_count})

    return {
        "total": len(results),
        "records": results
    }

# ── SEARCH ─────────────────────────────────────────────────
@app.get("/api/fra/search")
def search(q: str = Query(..., min_length=2)):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT
            patta_id, form_type, district, taluk, village,
            claimant_name, tribal_community,
            claim_area_acres, status,
            ST_X(geom) AS lng, ST_Y(geom) AS lat
        FROM fra_records
        WHERE
            geom IS NOT NULL AND (
            patta_id        ILIKE %s OR
            village         ILIKE %s OR
            claimant_name   ILIKE %s OR
            tribal_community ILIKE %s OR
            district        ILIKE %s
            )
        LIMIT 10;
    """, [f'%{q}%'] * 5)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"results": [clean_dict(dict(r)) for r in rows]}


# ── REVIEW UPDATE (PERSIST STATUS) ─────────────────────────────────
class ReviewRequest(BaseModel):
    status: str
    rejection_reason: Optional[str] = None
    gram_sabha_date: Optional[str] = None
    sdlc_date: Optional[str] = None
    dlc_date: Optional[str] = None
    title_date: Optional[str] = None

@app.post("/api/fra/record/{patta_id}/review")
def review_record(patta_id: str, req: ReviewRequest):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Check if record exists
    cur.execute("SELECT * FROM fra_records WHERE patta_id = %s;", (patta_id,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return JSONResponse({"error": "Record not found"}, status_code=404)
        
    # Update record
    cur.execute("""
        UPDATE fra_records
        SET
            status = %s,
            rejection_reason = %s,
            gram_sabha_date = %s,
            sdlc_date = %s,
            dlc_date = %s,
            title_date = %s,
            updated_at = NOW()
        WHERE patta_id = %s;
    """, (
        req.status,
        req.rejection_reason,
        req.gram_sabha_date or None,
        req.sdlc_date or None,
        req.dlc_date or None,
        req.title_date or None,
        patta_id
    ))
    conn.commit()
    
    # Retrieve updated record
    cur.execute("""
        SELECT *, ST_X(geom) AS lng, ST_Y(geom) AS lat
        FROM fra_records WHERE patta_id = %s;
    """, (patta_id,))
    updated_row = cur.fetchone()
    cur.close()
    conn.close()
    
    return clean_dict(dict(updated_row))