# 🎤 TerraClaim — Panel Demonstration Guide with Speaker Notes

> **Estimated Duration**: 20–25 minutes full demo | 10–12 minutes express demo
> **Who**: Project panel / evaluators / viva board
> **Setup required before presenting**: Backend running on port 8000, Frontend running on port 5173, PostgreSQL active

---

## ⚙️ Pre-Demo Checklist (Do this 5 minutes before panel)

```bash
# Terminal 1 — Start Backend
cd c:/Projects/MiniProject/FRA
uvicorn main:app --reload --port 8000

# Terminal 2 — Start Frontend
cd c:/Projects/MiniProject/FRA/frontend
npm run dev
```
- Open browser at `http://localhost:5173`
- Keep the project report PDF / synopsis open as backup
- Have a second window open showing the `main.py` code for code walkthrough moments

---

---

# 🎬 SLIDE 1 — Opening & Project Identity

## What to Show
- The TerraClaim landing page in **Public Mode** (no login yet)
- The "Track Application Status" screen

## 🎙️ Speaker Notes
> *"Good [morning/afternoon] respected panel members. The project I'm presenting today is called **TerraClaim** — a WebGIS Spatial Ledger and Decision Support System for administering the Forest Rights Act, 2006, in Karnataka.*

> *India's Forest Rights Act was passed in 2006 to give tribal communities legal ownership of the forest land they've occupied for generations. But even today — 20 years later — the process is entirely paper-based. Claims physically travel from the Gram Sabha to the Sub-Divisional Level Committee to the District Level Committee. Files get lost. Boundaries overlap. Nobody knows the status of their claim.*

> *TerraClaim solves all of this digitally. What you see on screen right now is the Public Portal — a claimant can type their name and village to track exactly where their claim stands in the approval pipeline.*

> *This is a full-stack system — React 19 frontend, FastAPI Python backend, PostgreSQL with PostGIS spatial extensions, and external satellite data from Sentinel-2 on AWS."*

---

---

# 🎬 SLIDE 2 — The Problem Statement (30 seconds)

## What to Show
- Keep the public track page visible OR open the project report to the Problem Statement section

## 🎙️ Speaker Notes
> *"Let me quickly explain the four core problems we identified:*

> ***Problem 1 — Paper-based workflows.** Claims go through 3 administrative tiers — Gram Sabha, then SDLC, then DLC. Each level manually stamps and forwards files. Delays run into years.*

> ***Problem 2 — Spatial boundary disputes.** Multiple claimants file for overlapping land. There's no GIS system to detect this. A claim may overlap a tiger reserve and nobody catches it until a court case.*

> ***Problem 3 — Subjective verification.** For Other Traditional Forest Dwellers, or OTFDs, you need to prove 75 years of continuous forest occupancy — three generations. This is verified by a single officer's judgment.*

> ***Problem 4 — Welfare isolation.** Even when a claimant gets their Patta — their land title — they don't automatically get PM-KISAN crop support, or housing under PMAY-G, or electricity. There's no system linking the title to schemes.*

> *TerraClaim addresses all four."*

---

---

# 🎬 SLIDE 3 — System Architecture (Tech Stack)

## What to Show
- Open `main.py` briefly OR draw attention to the project report's architecture diagram
- Optionally open browser DevTools → Network tab to show live API calls

## 🎙️ Speaker Notes
> *"The system has a clean three-tier architecture.*

> ***Frontend** — React 19 with Vite. The map is rendered using MapLibre GL — an open-source WebGL map library. We use Recharts for the analytics dashboard and Turf.js for client-side geometry calculations.*

> ***Backend** — FastAPI in Python 3. It exposes a RESTful JSON API at localhost port 8000. FastAPI was chosen because it's asynchronous, auto-generates OpenAPI docs, and handles file uploads natively.*

> ***Database** — PostgreSQL with the PostGIS extension. PostGIS lets us store claim coordinates as actual geometric objects — not just latitude/longitude numbers. This means we can run spatial queries like 'find all claims within 100 metres of this point' directly in SQL.*

> ***External services** — We integrate two external APIs: OpenStreetMap's Overpass API for boundary data, and the Sentinel-2 STAC catalog on AWS for satellite imagery bands, which we use to compute NDVI — vegetation index — to verify farming activity.*

> *Every API call from the frontend automatically injects a JWT bearer token using an Axios request interceptor. I'll show you the authentication flow in a moment."*

---

---

# 🎬 SLIDE 4 — Public Mode: Submit a New Claim

## What to Show
- Click "Submit Claim" sub-tab in public mode
- Fill out the form: Name, Village, Taluk, District, Tribe, Area, Form Type
- Hit Submit — show the success response with the generated Patta ID

## 🎙️ Speaker Notes
> *"Let's start with how a claimant interacts with the system. The public portal has two modes — Track, and Submit.*

> *I'll submit a new claim now. I'll enter a claimant name — say, Ravi Soliga — select the Soliga tribe — this is a Scheduled Tribe community in the Chamarajanagar district. I'll select Form A — which is an Individual Forest Rights claim — put in the area as 2.5 acres, and provide the GPS coordinates.*

> *When I hit Submit, the frontend sends a POST request to our backend at `/api/fra/claim/submit`. The backend validates the payload, generates a unique Patta ID with a date-stamped format, inserts it into the PostgreSQL database with a PostGIS Point geometry, and returns the new Patta ID.*

> *Notice — no login needed for submission. The public portal is intentionally open. But all review, approval, and admin operations require authenticated officer login — which I'll show next."*

---

---

# 🎬 SLIDE 5 — Public Mode: Track Application Status

## What to Show
- Go to Track sub-tab
- Type in a claimant name + village (use one from the dataset, e.g. "Basava Soliga" + "Begur")
- Show the result card — status badge, workflow stages, dates

## 🎙️ Speaker Notes
> *"Back on the Track tab — this is dual-factor search. The claimant must enter both their name and their village. This prevents one person from looking up another person's claim with just a name.*

> *Let me search for Basava Soliga from Begur village. The backend does a case-insensitive match on both fields simultaneously. The result shows the current status — in this case 'Title Granted' — the Patta ID, the claim area, and the dates at which each stage was cleared: when the Gram Sabha resolved it, when the SDLC reviewed it, and the DLC final date.*

> *This is everything a tribal claimant needs. They don't need to physically visit a government office. They can do this from a mobile phone.*

> *Now let me switch to the official portal to show what the administrators see."*

---

---

# 🎬 SLIDE 6 — Officer Login & JWT Authentication

## What to Show
- Click "Official Login" button in the top navigation
- The LoginModal appears
- Log in with officer credentials
- Show how the view transforms into the full dashboard

## 🎙️ Speaker Notes
> *"Clicking Official Login opens the authentication modal. The system has pre-configured officers at different administrative levels — a Gram Sabha FRO, an SDLC officer, a DLC officer, and a State-level administrator.*

> *When I log in, the backend receives the credentials, hashes the password using PBKDF2-HMAC-SHA256 with 100,000 iterations — that's a high-security hashing standard — and if it matches, generates a custom JWT token signed with HMAC-SHA256.*

> *This token is stored in localStorage and injected by an Axios interceptor into every subsequent request. So the backend can verify the identity and jurisdiction of the officer on every API call.*

> *Notice how the entire UI just changed — the navigation expanded to show Dashboard, WebGIS Map, Search Plots, Analytics, DSS Welfare, Tribes Info, and User Guide. These views are entirely hidden from public users."*

---

---

# 🎬 SLIDE 7 — Officer Dashboard (DashboardManager)

## What to Show
- The Dashboard tab is auto-selected after login
- Show the five tab categories: Pending Action, Under Review, Approved, Rejected, Escalated
- Click on a claim card — show the Review Claim button
- Click "Locate Map" on a card — it flies to the map view

## 🎙️ Speaker Notes
> *"The Dashboard is the officer's primary workstation. It's role-aware — meaning what you see here is filtered by your designation and jurisdiction.*

> *If I'm logged in as a Gram Sabha FRO in Mysuru district, I only see claims from Mysuru. If I'm a DLC officer, I see claims that have been approved by SDLC and are waiting for my review. State-level admins see everything.*

> *The five tabs you see are workflow queues:*
> - *Pending Action — claims waiting for this officer's decision*
> - *Under Review — claims currently being examined*
> - *Approved — claims this officer has cleared*
> - *Rejected — applications turned down*
> - *Escalated — DLC-approved claims awaiting State final decree*

> *Each card shows the Patta ID, claimant name, tribe, village, area, and a red conflict badge if a spatial sanctuary overlap has been detected. I can either click 'Locate Map' to fly the WebGIS map to that claim's coordinates, or click 'Review Claim' to open the full review workspace."*

---

---

# 🎬 SLIDE 8 — WebGIS Map & Spatial Visualization

## What to Show
- Navigate to "WebGIS Map" tab
- Show the map with claim points rendered in color-coded circles
- Zoom into a district — watch polygons appear at higher zoom levels
- Toggle satellite view — show ESRI imagery underneath
- Hover over a point — show the popup
- Click a point — show the ClaimWorkspace opening in the sidebar

## 🎙️ Speaker Notes
> *"This is the WebGIS Map — the geographic heart of the system. It's powered by MapLibre GL, a WebGL-based open-source mapping library.*

> *Each dot you see on the map is a claim point from our PostgreSQL database. The colors follow the workflow status:*
> - *Grey = newly filed*
> - *Teal = Gram Sabha resolved*
> - *Blue = SDLC approved*
> - *Purple = DLC approved*
> - *Green = Title Granted*
> - *Dark red = Rejected*

> *As I zoom in, you'll see the points transform into their actual land boundary polygons. These are computed client-side using the GPS centroid and the claimed area — converting acres to metres using the Earth radius formula — and drawn as square polygons on the map.*

> *Those red dashed zones you see overlapping some polygons? Those are conflict zones — simulated overlap with a wildlife reserve or forest corridor. Any claim whose plot is in Kodagu or Chikkamagaluru district with a large area triggers this visualization.*

> *I can toggle to satellite view — this loads ESRI World Imagery tiles underneath all our data layers. When I hover over a point, a popup shows the Patta ID, village, tribe name, status, and acreage. Clicking it fires an API call to fetch the full claim and opens the review workspace on the right.*

> *There's also a polygon drawing tool — officers can manually draw plot boundaries by hand on the map."*

---

---

# 🎬 SLIDE 9 — Claim Workspace & AI DSS Analysis (Core Demo)

## What to Show
- Click on a claim on the map (preferably one that has spatial conflicts)
- The ClaimWorkspace sidebar opens
- Walk through each section: Claim Details, Spatial Verification, AI Assessment, Scheme Recommendations
- Show the Eligibility Score and Risk Rating bars
- Show the Decision recommendation

## 🎙️ Speaker Notes
> *"This is the most important screen — the Claim Workspace. This is where every intelligent analysis the system does is shown in one place.*

> *At the top you have the basic claim details — Patta ID, claimant name, tribe, form type, village, district, and area.*

> ***Section 1 — Spatial Verification.** This shows the result of our Ray-Casting Point-in-Polygon algorithm. The backend takes the claim coordinates, fetches all protected forest polygon boundaries from the database, and runs a pure-Python geometric algorithm — no external GIS library — to determine if the claim point falls inside a reserve forest. It also calculates the percentage overlap between the claim polygon and the reserve boundary using bounding box intersection.*

> ***Section 2 — Satellite Reality Check.** This shows the NDVI value we retrieved from the Sentinel-2 satellite through the AWS STAC API. NDVI — Normalized Difference Vegetation Index — is calculated from the Near-Infrared and Red reflectance bands. A value above 0.6 confirms healthy agricultural vegetation. This objectively proves whether the claimant is actually farming the land.*

> ***Section 3 — AI Decision Support.** This is our scoring model. It combines:*
> - *Document completeness score — 50% weight*
> - *Legal compliance score — 50% weight*
> - *These combine into an Eligibility Score from 0 to 100%*
> - *A separate Risk Rating flags spatial overlaps, proximity to other claims, and missing evidence*

> *Based on these scores, the system generates a decision recommendation — Approve, Reject, or Review Required — with a natural language explanation written by the backend.*

> *For example, for a claim where the area is 4.8 hectares — which exceeds the 4.0 hectare statutory cap under Section 4(6) of the FRA — the system flags it as Failed under the area check, drops the eligibility score to around 55%, and recommends rejection."*

---

---

# 🎬 SLIDE 10 — 10-Point Legal Rule Engine

## What to Show
- From the Claim Workspace, navigate to the Legal Audit / Validation section
- OR open the RecordsTable and click "Review" to open ClaimReviewModal — it shows the full validator output
- Show each of the 10 checks with Pass / Fail / Warning badges

## 🎙️ Speaker Notes
> *"Let me now show the 10-Point Legal Rule Engine. This is our statutory compliance checker — it's in `ClaimValidator.js` on the frontend, runs entirely client-side in the browser, and validates the claim against the actual provisions of the FRA, 2006.*

> *The 10 checks are:*

> *1. **Tribal Identity Check** — Is the claimant from a recognized Karnataka Scheduled Tribe? We have all 12 notified ST communities hardcoded — Soliga, Jenu Kuruba, Nayaka, Betta Kuruba, and so on.*

> *2. **ST Verified Community** — If they're an ST, they pass automatically. If they're an OTFD, they need to prove 75 years of forest occupancy.*

> *3. **OTFD 75-Year Proof** — Has proof of three-generation residency been submitted? Oral history, tax receipts, revenue records.*

> *4. **Statutory Land Limit Cap** — The area must be 4.0 hectares or less. This is Section 4(6) of the FRA. Any claim above this hard fails.*

> *5. **Gram Sabha Resolution** — Is the Gram Sabha approval date present in the record? This is mandatory.*

> *6. **Gram Sabha Quorum** — At least 50% of the village must attend, and one-third must be women. This is verified via attendance logs.*

> *7 & 8. **SDLC and DLC Reviews** — Have these committees signed off? System checks for the respective approval dates.*

> *9. **Supporting Evidence Count** — At least 2 historical proofs must be uploaded.*

> *10. **Forest Boundary Overlap** — The spatial conflict check. A Pass means no critical overlap. A Warning means partial overlap needing further inspection.*

> *Each check returns Pass, Fail, or Warning. The total Pass count divided by 10 gives the eligibility score as a percentage."*

---

---

# 🎬 SLIDE 11 — Search Plots / Records Table

## What to Show
- Navigate to "Search Plots" tab
- Show the filterable table with columns for status, district, tribe, form type
- Use the filter dropdowns — show how the table narrows down
- Click "Review" on a record — show the ClaimReviewModal opening
- In the modal: upload a document, write a comment, change the status

## 🎙️ Speaker Notes
> *"The Search Plots view is a tabular database view of all 64 synthetic claim records. Officers can filter by district, tribe, form type, and status simultaneously.*

> *Each row shows the Patta ID, claimant name, tribe, village, area, form type, current status, and action buttons. There are two key actions — Locate on Map, which flies the map to those coordinates, and Review, which opens the full review modal.*

> *Inside the review modal, an officer can:*
> - *Read the full claim details*
> - *See the 10-point validator output*
> - *Upload new documents — Aadhaar, Land Records, Survey Sketch, or the signed Form A/B/C scan*
> - *Write official remarks with a recommendation type — Approve, Reject, or Request Clarification*
> - *Change the claim status — moving it from Gram Sabha Resolved to SDLC Approved, for example*

> *Every status change and document upload is logged to the claim_audit_trail table in the database — an immutable system ledger. So any officer who touched this file, at what time, and what they did — it's all permanently recorded.*

> *This audit trail is critical for accountability. Corruption at any level — like approving an invalid claim — leaves a traceable evidence trail."*

---

---

# 🎬 SLIDE 12 — Analytics Dashboard

## What to Show
- Navigate to "Analytics" tab
- Show bar charts, pie charts, district-wise breakdowns
- Point out total claims, approval rate, pending count

## 🎙️ Speaker Notes
> *"The Analytics tab gives administrators a high-level statistical overview of the entire claims registry. These charts are built with Recharts — a React charting library.*

> *We have a district-wise breakdown showing which districts have the most pending claims. We have a status distribution pie chart — what percentage of all claims are filed, in-progress, approved, or rejected. There's also a form-type breakdown — how many are Individual Rights claims versus Community Rights versus Community Forest Resource claims.*

> *This view is particularly useful for a State-level administrator who needs to identify districts that are bottlenecked, or where the rejection rate is unusually high — which might indicate a corrupt SDLC officer or incorrect boundary data.*

> *All data is fetched live from the backend's `/api/fra/stats` endpoint which queries aggregates directly from PostgreSQL."*

---

---

# 🎬 SLIDE 13 — DSS Welfare Scheme Recommender

## What to Show
- Navigate to "DSS Welfare" tab
- Show the scheme recommendation interface
- Pick a claim with "Title Granted" status and run the scheme engine
- Show PM-KISAN, Saubhagya, PMAY-G, JJM, PMFBY recommendations with scores

## 🎙️ Speaker Notes
> *"One of the most unique features of TerraClaim is this — the Decision Support System for Welfare Scheme Routing.*

> *In India, a tribal community gets their Patta — land title — and they still don't receive PM-KISAN agricultural support, or solar electricity under Saubhagya, or housing under PMAY-G. These are separate government portals that don't talk to each other.*

> *Our Scheme Recommender Engine bridges this gap. For any claim with a Title Granted status, it evaluates the claimant's profile against five central and state schemes:*

> - ***PM-KISAN** — Pradhan Mantri Kisan Samman Nidhi. Direct ₹6,000/year cash transfer if agricultural occupation is confirmed via NDVI.*
> - ***PMAY-G** — Pradhan Mantri Awas Yojana Gramin. Housing subsidy for low-income rural families.*
> - ***Saubhagya** — Free solar or grid electricity connection for remote households.*
> - ***JJM** — Jal Jeevan Mission. Piped water supply to forest hamlets.*
> - ***PMFBY** — Pradhan Mantri Fasal Bima Yojana. Crop insurance recommended when NDVI confirms active cultivation.*

> *Each scheme gets a recommendation score from 0 to 100%. The score is computed by a vectorized rule engine that cross-references the claimant's category, land area, NDVI value, and location. This directly answers the post-grant welfare gap the government struggles with."*

---

---

# 🎬 SLIDE 14 — Digital Patta Certificate Generator

## What to Show
- From the Claim Workspace, click "Generate Patta Certificate"
- The PattaCertificate component renders on screen
- Show the QR code, the emblem, the legal text, the claimant details
- Optionally trigger browser print dialog

## 🎙️ Speaker Notes
> *"The final output of the entire system is this — the Digital Patta Certificate. A Patta is the official land title deed issued under the Forest Rights Act.*

> *Previously, a Patta was a handwritten or typed paper document that could be forged, lost, or tampered with. Our digital Patta contains:*
> - *The Emblem of India and Karnataka Government seal*
> - *The claimant's full name, Patta ID, and tribal community*
> - *The village, taluk, and district with GPS coordinates*
> - *The area granted in both acres and hectares*
> - *The approval dates at each committee level*
> - *And most importantly — a QR code*

> *That QR code encodes a URL pointing to our API endpoint: `/api/fra/claim/verify/{patta_id}`. Anyone — a bank officer, a welfare scheme office, a court — can scan this QR code and instantly verify the authenticity of the Patta by checking it against our live database. This completely eliminates document forgery.*

> *The certificate can be printed directly from the browser using the print dialog — it's styled to fit A4 paper with the correct margins and formatting."*

---

---

# 🎬 SLIDE 15 — Tribes Information Module

## What to Show
- Navigate to "Tribes Info" tab
- Show the 12 Karnataka tribes listed with details

## 🎙️ Speaker Notes
> *"We also included an educational module on Karnataka's 12 Scheduled Tribes. This section gives administrators background on each community — their geographic distribution, traditional livelihoods, and historical ties to the forest.*

> *This was included because many FRO officers from urban backgrounds may not be familiar with the specific tribes they're processing claims for. Understanding that the Jenu Kuruba people are traditionally honey-gatherers in Kodagu's Nagarahole, while the Soliga people are settled cultivators in the BRT Tiger Reserve — this context affects how claims should be evaluated.*

> *We sourced this from the Karnataka state government's tribal welfare department records and the Anthropological Survey of India."*

---

---

# 🎬 SLIDE 16 — Database & Backend Code Walkthrough

## What to Show
- Open `main.py` in VS Code briefly
- Show the `get_claim_intelligence()` function section
- Show the `point_in_polygon()` ray-casting function
- Show the SQL schema briefly — `fra_records` table with PostGIS geometry column

## 🎙️ Speaker Notes
> *"Let me do a brief code walkthrough for the technical evaluation.*

> *This is `main.py` — 1671 lines of Python. It's structured in clear sections.*

> *Here is the `point_in_polygon()` function — this is our Ray-Casting algorithm. For a given point and a polygon boundary, it casts a horizontal ray to infinity. It counts how many times the ray crosses the polygon's edges. An odd number means the point is inside. Even number means outside. This is classical computational geometry — implemented in pure Python without any GIS library dependency.*

> *Here is `get_claim_intelligence()` — this is the AI Decision Support engine. It runs a PostGIS query using `ST_DWithin` to find nearby claims within 100 metres — detecting spatial duplicates. It then evaluates the document completeness, checks the 4-hectare limit, and computes the two scores. Then it runs a classifier that outputs Approve, Reject, or Review Required.*

> *The database table `fra_records` has a column called `geom` of type `GEOMETRY(Point, 4326)`. The 4326 is the SRID — Spatial Reference ID — for the standard WGS84 coordinate system used by GPS. PostGIS uses a GiST spatial index on this column, which makes bounding box queries lightning fast.*

> *Authentication is done with a custom JWT implementation using Python's `hmac` and `hashlib` standard libraries — no external JWT package needed."*

---

---

# 🎬 SLIDE 17 — Conclusion & Results

## What to Show
- Switch back to the Analytics dashboard
- Or open the project report table of results

## 🎙️ Speaker Notes
> *"To summarize what TerraClaim achieves:*

> *We validated the system on 64 synthetic Karnataka FRA claim records across 6 districts. The system correctly:*
> - *Rejected Manjunath K.'s claim from Uttara Kannada because the 4.8 hectare area exceeded the 4.0 hectare statutory limit — even though no forest overlap existed*
> - *Rejected Devendra Nayak's claim from Shimoga because 42% of his claimed plot overlapped a wildlife reserve, and his NDVI score was only 0.22 — indicating no active cultivation*
> - *Approved Basava Soliga's claim with a 95% eligibility score — Scheduled Tribe, 1.8 ha, no overlaps, NDVI of 0.82 confirming high cultivation*

> *The key innovations of this project are:*
> - *Pure-Python geospatial engine without GDAL or Shapely*
> - *Sentinel-2 NDVI integration for objective historical cultivation verification*
> - *Role-based multi-tier officer workflow matching the actual FRA administrative hierarchy*
> - *QR-secured digital Patta certificates*
> - *Welfare scheme DSS that bridges the post-grant development gap*

> *Future scope includes blockchain integration for Patta hashes on Hyperledger Fabric, a Flutter offline mobile app for field GPS surveys, and Sentinel-1 Radar change detection alerts for forest encroachment.*

> *Thank you. I'm happy to take questions."*

---

---

# ❓ Anticipated Panel Questions & Suggested Answers

| Question | Suggested Answer |
|---|---|
| **"Why PostGIS and not a simpler solution?"** | PostGIS enables native spatial SQL — `ST_DWithin`, `ST_Intersects`, bounding box queries — directly in the database without reading everything into Python memory. This is critical for scalability to thousands of records. |
| **"What's NDVI and why does it matter?"** | NDVI = (NIR - Red) / (NIR + Red). Values near 1.0 mean dense healthy vegetation. A claim site with 0.82 NDVI proves active farming. This objective satellite proof replaces subjective officer field visits, saving weeks. |
| **"Isn't the JWT custom implementation a security risk?"** | The HMAC-SHA256 signature with a server-side secret key is the core security primitive used by all JWT libraries. We implement it using Python's stdlib `hmac` module — no external library needed. The password uses PBKDF2 with 100K iterations, which is NIST-recommended. |
| **"What if two claims overlap in the database?"** | The `ST_DWithin(geom, target_geom, 0.001)` query detects claims within ~100m radius. The system flags this as a Duplicate Risk in the AI DSS output. The officer must manually resolve it through the review modal. |
| **"How is the 4-hectare limit enforced?"** | It's double-enforced — client-side in ClaimValidator.js check #4 AND server-side in get_claim_intelligence() via a Python conditional. The backend is authoritative. |
| **"Why React and not Angular/Vue?"** | React 19 has the best ecosystem for real-time map integrations via MapLibre GL React bindings, and its component model (ClaimWorkspace, PattaCertificate) maps cleanly to our modular feature set. |
| **"Where's the real data?"** | We use 64 synthetic records generated in FRA_Karnataka_Synthetic_Records.xlsx with realistic names, tribal communities, and GPS coordinates within Karnataka's actual forested regions (Kodagu, Shivamogga, Chamarajanagar). Real government data would require an MoU with the Karnataka Forest Department. |
| **"How does the role-based filtering work?"** | The JWT token payload contains `designation` and `jurisdiction` fields. DashboardManager.jsx reads these and applies a `filter()` on the claims array — DLC officers only see SDLC-approved claims in their district. This is enforced again at the API level by passing the officer's jurisdiction as a query parameter. |

---

---

# 🚀 Express Demo Route (10 minutes only)

If the panel gives you limited time, follow this path:

1. **Public Track** — Search for "Basava Soliga" (30 sec)
2. **Login as Officer** — Log in, show dashboard cards (1 min)
3. **Map Tab** — Show colored points, zoom in for polygons, toggle satellite (1 min)
4. **Click a claim on map** — Open ClaimWorkspace, point to Eligibility Score + NDVI + Decision (2 min)
5. **10-Point Validator** — Open review modal, walk through the 10 checks (1.5 min)
6. **DSS Welfare Tab** — Show PM-KISAN + Saubhagya scores (1 min)
7. **Patta Certificate** — Show the digital deed with QR code (1 min)
8. **Conclusion** — 30 seconds on innovation points

---

> 💡 **Pro Tip**: Keep the browser and VS Code side by side. When you mention a backend function, flip to the code briefly. Panels respond very positively when they can see real code backing the demo.
