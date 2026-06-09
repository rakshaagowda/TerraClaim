-- FRA Atlas Database Setup Script
-- Required: PostgreSQL with PostGIS extension

-- 1. Create Database
-- CREATE DATABASE fra_atlas;

-- 2. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 3. Create Records Table
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

-- 4. Create Spatial Index
CREATE INDEX IF NOT EXISTS fra_records_geom_idx ON fra_records USING GIST (geom);
