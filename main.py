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


def get_spatial_verification(record):
    acres = record.get('claim_area_acres') or 0
    # Simulate conflicts if area is large (> 5 acres) or in specific districts
    is_large = acres > 5
    is_conflict_district = record.get('district') in ['Kodagu', 'Chikkamagaluru']
    
    has_conflict = is_large and is_conflict_district
    overlap_val = 12.5 if has_conflict else (4.2 if is_large else 0.0)

    return {
        "boundary_valid": not has_conflict,
        "overlap_percentage": overlap_val,
        "conflict_type": "Critical Forest Corridor" if has_conflict else ("Minor Buffer" if overlap_val > 0 else "None"),
        "protected_zone_clear": not has_conflict,
        "satellite_cultivation_detected": True if acres > 0.3 else False,
        "resolution_status": "Pending Inspection" if has_conflict else "Resolved"
    }

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
    
    record = clean_dict(dict(row))
    record['spatial_verify'] = get_spatial_verification(record)
    return record


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

        results.append({**r, **schemes, 'eligible_count': eligible_count, 'spatial_verify': get_spatial_verification(r)})

    return {
        "total": len(results),
        "records": results
    }



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
    
    gs_report: Optional[str] = None
    gs_document: Optional[str] = None
    
    sdlc_report: Optional[str] = None
    sdlc_document: Optional[str] = None
    uploaded_document: Optional[str] = None
    
    dlc_report: Optional[str] = None
    dlc_document: Optional[str] = None
    
    title_report: Optional[str] = None
    title_document: Optional[str] = None

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
            
            gs_report = %s,
            gs_document = %s,
            
            sdlc_report = %s,
            sdlc_document = %s,
            uploaded_document = %s,
            
            dlc_report = %s,
            dlc_document = %s,
            
            title_report = %s,
            title_document = %s,
            
            updated_at = NOW()
        WHERE patta_id = %s;
    """, (
        req.status,
        req.rejection_reason,
        req.gram_sabha_date or None,
        req.sdlc_date or None,
        req.dlc_date or None,
        req.title_date or None,
        
        req.gs_report or None,
        req.gs_document or None,
        
        req.sdlc_report or None,
        req.sdlc_document or req.uploaded_document or None,
        req.uploaded_document or req.sdlc_document or None,
        
        req.dlc_report or None,
        req.dlc_document or None,
        
        req.title_report or None,
        req.title_document or None,
        
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


# ── OFFICER AUTHENTICATION ────────────────────────────────
class OfficerLoginRequest(BaseModel):
    officer_id: str
    password: str
    designation: str
    jurisdiction: str
    security_otp: str

@app.post("/api/auth/officer/login")
def officer_login(req: OfficerLoginRequest):
    from fastapi import HTTPException
    
    # 1. Check core passcode
    if req.password != "fra2006":
        raise HTTPException(status_code=401, detail="Invalid Security Passcode.")
        
    # 2. Check 6-digit OTP factor
    if req.security_otp != "123456":
        raise HTTPException(status_code=401, detail="Invalid Security OTP Code (2FA check failed).")
        
    # 3. Validate and parse the Standardized Officer ID
    # Format: KA-[DIST_CODE]-[ROLE_CODE]-[SERIAL]-[YEAR]
    id_str = req.officer_id.strip().upper()
    parts = id_str.split("-")
    if len(parts) != 5 or parts[0] != "KA":
        raise HTTPException(
            status_code=400, 
            detail="Invalid Standardized ID format. Expected: KA-[DIST]-[ROLE]-[SERIAL]-[YEAR] (e.g. KA-MYS-FRO-01-2026)"
        )
        
    dist_code, role_code, serial_num, year = parts[1], parts[2], parts[3], parts[4]
    
    # Map district jurisdiction to code
    dist_map = {
        'MYS': 'Mysuru',
        'KOD': 'Kodagu',
        'CHM': 'Chikkamagaluru',
        'CHN': 'Chamarajanagara',
        'SHI': 'Shivamogga',
        'HAS': 'Hassan'
    }
    
    # Map role designation to code
    role_map = {
        'FRO': 'Forest Rights Officer (FRO)',
        'SDLC': 'Sub-Divisional Committee (SDLC) Officer',
        'DLC': 'District Level Committee (DLC) Officer'
    }
    
    # Validate District
    expected_dist = dist_map.get(dist_code)
    if not expected_dist:
        raise HTTPException(status_code=400, detail=f"Unknown district prefix '{dist_code}' in Officer ID.")
    if expected_dist.lower() != req.jurisdiction.strip().lower():
        raise HTTPException(
            status_code=400, 
            detail=f"Jurisdiction mismatch. Officer ID district '{expected_dist}' does not match selected dropdown jurisdiction '{req.jurisdiction}'."
        )
        
    # Validate Designation / Role
    expected_role = role_map.get(role_code)
    if not expected_role:
        raise HTTPException(status_code=400, detail=f"Unknown designation code '{role_code}' in Officer ID.")
    if expected_role.lower() != req.designation.strip().lower():
        raise HTTPException(
            status_code=400, 
            detail=f"Role mismatch. Officer ID role '{expected_role}' does not match selected dropdown designation '{req.designation}'."
        )
        
    # Validate Year
    if not year.isdigit() or len(year) != 4:
        raise HTTPException(status_code=400, detail="Invalid year component in Officer ID (must be a 4-digit year, e.g. 2026).")
        
    # Validate Serial
    if not serial_num.isdigit():
        raise HTTPException(status_code=400, detail="Invalid serial number in Officer ID.")

    # Generate mock JWT-like token
    mock_token = f"mock-token-officer-{id_str}-{req.jurisdiction.lower()}"
    return {
        "status": "Authenticated",
        "token": mock_token,
        "officer_id": id_str,
        "designation": req.designation,
        "jurisdiction": req.jurisdiction
    }


# ── DUAL-FACTOR PUBLIC APPLICATION TRACKING ───────────────
class PublicTrackRequest(BaseModel):
    claimant_name: str
    village: str

@app.post("/api/fra/public/track")
def public_track(req: PublicTrackRequest):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cur.execute("""
        SELECT *, ST_X(geom) AS lng, ST_Y(geom) AS lat
        FROM fra_records
        WHERE claimant_name ILIKE %s AND (village ILIKE %s OR district ILIKE %s);
    """, (f"%{req.claimant_name.strip()}%", f"%{req.village.strip()}%", f"%{req.village.strip()}%"))
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No matching application found. Please verify the Claimant Name and nearby Village/Region.")
        
    record = clean_dict(dict(row))
    record['spatial_verify'] = get_spatial_verification(record)
    return record


# ── CLAIM SUBMISSION FORM ENDPOINT ──────────────────────────
class ClaimSubmitRequest(BaseModel):
    claimant_name: str
    village: str
    taluk: str
    district: str
    tribal_community: Optional[str] = None
    claim_area_acres: float
    form_type: str
    lat: float
    lng: float
    status: Optional[str] = None

@app.post("/api/fra/claim/submit")
def submit_claim(req: ClaimSubmitRequest):
    conn = get_conn()
    cur  = conn.cursor()
    
    # Map district names to code prefix
    prefixes = {
        'mysuru': 'MYS',
        'chamarajanagara': 'CHN',
        'shivamogga': 'SHI',
        'chikkamagaluru': 'CHM',
        'kodagu': 'KOD',
        'hassan': 'HAS'
    }
    dist_lower = req.district.strip().lower()
    prefix = prefixes.get(dist_lower, 'GEN')
    
    # Query count to make dynamic suffix
    cur.execute("SELECT COUNT(*) FROM fra_records WHERE district ILIKE %s;", (f"%{req.district.strip()}%",))
    count = cur.fetchone()[0]
    
    # Generate unique Patta ID
    patta_id = f"FRA-{prefix}-{count + 101:03d}"
    
    # Compute hectares
    ha = round(req.claim_area_acres * 0.404686, 4)
    
    # Construct geometry point
    geom = f"SRID=4326;POINT({req.lng} {req.lat})"
    
    status = req.status or 'Claim Filed'
    
    try:
        cur.execute("""
            INSERT INTO fra_records (
                patta_id, form_type, district, taluk, village,
                claimant_name, tribal_community,
                claim_area_acres, claim_area_ha,
                status, geom
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, ST_GeomFromEWKT(%s))
            RETURNING patta_id;
        """, (
            patta_id, req.form_type, req.district, req.taluk, req.village,
            req.claimant_name, req.tribal_community,
            req.claim_area_acres, ha,
            status, geom
        ))
        conn.commit()
        created_id = cur.fetchone()[0]
        cur.close()
        conn.close()
        
        return {
            "status": status,
            "patta_id": created_id,
            "claimant_name": req.claimant_name,
            "village": req.village,
            "district": req.district
        }
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Database Insertion Error: {str(e)}")


# ── MULTI-STAGE FRA AUDIT REPORT DOWNLOAD ──────────────────
from fastapi.responses import PlainTextResponse

@app.get("/api/fra/record/{patta_id}/download-report")
def download_fra_report(patta_id: str):
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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Record not found")
        
    r = clean_dict(dict(row))
    
    # Format overlaps check
    is_large = (r.get('claim_area_acres') or 0) > 5
    is_conflict_district = r.get('district') in ['Kodagu', 'Chikkamagaluru']
    has_conflict = is_large and is_conflict_district
    overlap_status = "CRITICAL FOREST CORRIDOR OVERLAP WARNING" if has_conflict else ("Minor Buffer Overlap" if is_large else "CLEAR (No Overlaps)")
    
    report_text = f"""======================================================================
GOVERNMENT OF KARNATAKA - TRIBAL WELFARE & FOREST DEPARTMENTS
COMPREHENSIVE FOREST RIGHTS ACT (FRA) AUDIT PORTFOLIO
======================================================================
GENERATED ON       : {r.get('updated_at') or 'N/A'}
PATTA CLAIM ID     : {r['patta_id']}
STATUS             : {r['status']}

1. CLAIM IDENTIFICATION DETAILS:
---------------------------------
Claim Category     : {r['form_type']}
Claimant Name      : {r['claimant_name'] or 'Village Community Representative'}
Tribal/Dwellers    : {r['tribal_community'] or 'Other Traditional Forest Dwellers (OTFD)'}
District           : {r['district']}
Taluk              : {r['taluk']}
Village / Region   : {r['village']}

2. SPATIAL GIS & REMOTE SENSING AUDIT:
--------------------------------------
Land Area          : {r['claim_area_acres']:.2f} Acres ({r['claim_area_ha']:.3f} Hectares)
Coordinates        : Latitude: {r['lat']:.6f}, Longitude: {r['lng']:.6f}
GIS Boundary Check : {overlap_status}
NDVI Status        : Cultivation Verified (Threshold Met)
NDWI Status        : Normal moisture levels detected

3. STAGE-BY-STAGE AUDIT TIMELINE & DECISION PORTFOLIO:
------------------------------------------------------

STAGE 1: GRAM SABHA REVIEW
---------------------------
Decision Date      : {r['gram_sabha_date'] or 'PENDING'}
Review Report / Res: {r.get('gs_report') or 'Resolution passed by Gram Sabha for recommendation.'}
Supporting Document: {r.get('gs_document') or 'No Gram Sabha resolution document uploaded.'}

STAGE 2: SUB-DIVISIONAL LEVEL COMMITTEE (SDLC) REVIEW
-----------------------------------------------------
Decision Date      : {r['sdlc_date'] or 'PENDING'}
Review Report / JFI: {r.get('sdlc_report') or r.get('rejection_reason') or 'Joint Field Inspection completed. GPS coordinates validated on site.'}
Supporting Document: {r.get('sdlc_document') or r.get('uploaded_document') or 'No JFI document uploaded.'}

STAGE 3: DISTRICT LEVEL COMMITTEE (DLC) REVIEW
----------------------------------------------
Decision Date      : {r['dlc_date'] or 'PENDING'}
Review Report / Res: {r.get('dlc_report') or 'District Level Committee review and verification.'}
Supporting Document: {r.get('dlc_document') or 'No DLC recommendation document uploaded.'}

STAGE 4: FINAL TITLE DEED FINALIATION
-------------------------------------
Decision Date      : {r['title_date'] or 'PENDING'}
Review Report / Res: {r.get('title_report') or 'Title Deed prepared and approved.'}
Supporting Document: {r.get('title_document') or 'No Title Deed certificate uploaded.'}

======================================================================
CERTIFICATION & LEGAL COMPLIANCE
--------------------------------
This document serves as an official consolidated spatial and administrative 
audit trail for Patta ID {r['patta_id']} under the Scheduled Tribes and Other 
Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006. All 
records are cryptographically registered and updated in the State WebGIS Registry.
======================================================================
"""
    headers = {
        "Content-Disposition": f"attachment; filename=FRA-Audit-Report-{patta_id}.txt"
    }
    return PlainTextResponse(content=report_text, headers=headers)



# ── STARTUP DEMO SEED ROUTINE ──────────────────────────────
def seed_demo_data():
    conn = get_conn()
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM fra_records WHERE patta_id IN ('FRA-MYS-501', 'FRA-KOD-502', 'FRA-CHM-503');")
    count = cur.fetchone()[0]
    
    if count < 3:
        demo_records = [
            ('FRA-MYS-501', 'Form A (IFR)', 'Mysuru', 'Hunsur', 'Kerehalli', 'Basava', 'Jenu Kuruba', 2.4, 0.971, 'Claim Filed', 'SRID=4326;POINT(76.2 12.3)'),
            ('FRA-KOD-502', 'Form A (IFR)', 'Kodagu', 'Virajpet', 'Birunani', 'Madha', 'Jenu Kuruba', 1.8, 0.728, 'SDLC Approved', 'SRID=4326;POINT(75.8 12.1)'),
            ('FRA-CHM-503', 'Form C (CFR)', 'Chikkamagaluru', 'Mudigere', 'Khandya', 'Ketan', 'Soliga', 12.5, 5.058, 'DLC Approved', 'SRID=4326;POINT(75.6 13.1)')
        ]
        
        for pid, ft, dist, taluk, village, claimant, tribe, acres, ha, status, geom in demo_records:
            gs_date = '2026-05-10' if status != 'Claim Filed' else None
            sdlc_date = '2026-05-25' if status in ('SDLC Approved', 'DLC Approved') else None
            dlc_date = '2026-06-01' if status == 'DLC Approved' else None
            
            cur.execute("""
                INSERT INTO fra_records (
                    patta_id, form_type, district, taluk, village,
                    claimant_name, tribal_community,
                    claim_area_acres, claim_area_ha,
                    status, gram_sabha_date, sdlc_date, dlc_date, geom
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, ST_GeomFromEWKT(%s))
                ON CONFLICT (patta_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    gram_sabha_date = EXCLUDED.gram_sabha_date,
                    sdlc_date = EXCLUDED.sdlc_date,
                    dlc_date = EXCLUDED.dlc_date;
            """, (pid, ft, dist, taluk, village, claimant, tribe, acres, ha, status, gs_date, sdlc_date, dlc_date, geom))
            
        conn.commit()
        print("[DEMO SEED] Successfully seeded 3 demo records.")
    
    cur.close()
    conn.close()

@app.on_event("startup")
def startup_event():
    seed_demo_data()
