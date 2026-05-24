import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ── DB CONNECTION ──────────────────────────────────────────
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="fra_atlas",
    user="postgres",
    password="fra2006"
)
cur = conn.cursor()

# ── LOAD XLSX ──────────────────────────────────────────────
XLSX_PATH = r"C:\fra_atlas\FRA_Karnataka_Synthetic_Records.xlsx"

sheets = {
    "Form A (IFR)": "Form A — IFR (Individual)",
    "Form B (CR)":  "Form B — CR (Community)",
    "Form C (CFR)": "Form C — CFR (Community Forest)",
}

all_rows = []

for form_type, sheet_name in sheets.items():
    df = pd.read_excel(XLSX_PATH, sheet_name=sheet_name)
    df.columns = df.columns.str.strip()
    print(f"\n{sheet_name} — {len(df)} rows")
    print("Columns:", list(df.columns))

    for _, row in df.iterrows():

        def get(col):
            v = row.get(col)
            if v is None:
                return None
            if isinstance(v, float) and pd.isna(v):
                return None
            return v

        def getd(col):
            v = row.get(col)
            if v is None:
                return None
            if isinstance(v, float) and pd.isna(v):
                return None
            try:
                return pd.to_datetime(v).date()
            except Exception:
                return None

        def getf(col):
            v = row.get(col)
            if v is None:
                return None
            try:
                f = float(v)
                if pd.isna(f):
                    return None
                return f
            except Exception:
                return None

        patta_id = str(row.get("Fra Id", "")).strip()
        if not patta_id or patta_id == "nan":
            continue

        lat = getf("Latitude")
        lng = getf("Longitude")
        geom = f"SRID=4326;POINT({lng} {lat})" if lat and lng else None

        acres = getf("Claim Area Acres")
        ha = getf("Claim Area Ha") or (round(acres * 0.404686, 4) if acres else None)

        claimant = str(row.get("Claimant Name") or "").strip()

        all_rows.append((
            patta_id,
            form_type,
            str(row.get("District", "")).strip(),
            str(row.get("Taluk", "")).strip(),
            str(row.get("Village", "")).strip(),
            claimant,
            str(row.get("Tribal Community", "")).strip(),
            acres,
            ha,
            str(row.get("Status", "")).strip(),
            getd("Gram Sabha Date"),
            getd("Sdlc Date"),
            getd("Dlc Date"),
            getd("Title Date"),
            str(row.get("Remarks") or "").strip() or None,
            geom,
        ))
print(f"\nTotal rows to insert: {len(all_rows)}")

# ── INSERT ─────────────────────────────────────────────────
INSERT_SQL = """
INSERT INTO fra_records (
    patta_id, form_type, district, taluk, village,
    claimant_name, tribal_community,
    claim_area_acres, claim_area_ha,
    status, gram_sabha_date, sdlc_date, dlc_date, title_date,
    rejection_reason, geom
) VALUES %s
ON CONFLICT (patta_id) DO UPDATE SET
    status     = EXCLUDED.status,
    updated_at = NOW()
"""

template = """(
    %s, %s, %s, %s, %s,
    %s, %s,
    %s, %s,
    %s, %s, %s, %s, %s,
    %s, ST_GeomFromEWKT(%s)
)"""

execute_values(cur, INSERT_SQL, all_rows, template=template)
conn.commit()

# ── VERIFY ─────────────────────────────────────────────────
cur.execute("SELECT COUNT(*) FROM fra_records;")
print(f"\n✓ Records in DB: {cur.fetchone()[0]}")

cur.execute("""
    SELECT district, COUNT(*)
    FROM fra_records
    GROUP BY district
    ORDER BY COUNT(*) DESC;
""")
print("\nBy district:")
for row in cur.fetchall():
    print(f"  {row[0]:<25} {row[1]}")

cur.close()
conn.close()
print("\n✓ Done. Database loaded successfully.")