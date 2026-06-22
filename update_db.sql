-- Database extension for Document Workflow, Comments, Audit Trails, and Notifications

-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS claim_documents (
    id SERIAL PRIMARY KEY,
    patta_id VARCHAR(100) NOT NULL REFERENCES fra_records(patta_id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- 'applicant', 'gram_sabha', 'sdlc', 'dlc', 'state', 'admin'
    document_type VARCHAR(100) NOT NULL, -- e.g. 'Form A', 'Aadhaar', 'Land records', etc.
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL, -- officer_id or 'Applicant'
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claim_docs_patta ON claim_documents(patta_id);

-- 2. Create Comments Table
CREATE TABLE IF NOT EXISTS claim_comments (
    id SERIAL PRIMARY KEY,
    patta_id VARCHAR(100) NOT NULL REFERENCES fra_records(patta_id) ON DELETE CASCADE,
    officer_id VARCHAR(100) NOT NULL,
    officer_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    comment_type VARCHAR(100) NOT NULL, -- 'Internal Comment', 'Official Remark', 'Clarification Request', 'Recommendation Note'
    comment TEXT NOT NULL,
    action_taken VARCHAR(100) NOT NULL, -- 'Forwarded', 'Recommended', 'Rejected', 'Requested Clarification', 'Commented'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claim_comments_patta ON claim_comments(patta_id);

-- 3. Create Audit Trail Table
CREATE TABLE IF NOT EXISTS claim_audit_trail (
    id SERIAL PRIMARY KEY,
    patta_id VARCHAR(100) REFERENCES fra_records(patta_id) ON DELETE CASCADE, -- Can be NULL for non-claim operations like logins
    officer_id VARCHAR(100),
    officer_name VARCHAR(255),
    designation VARCHAR(100),
    action VARCHAR(100) NOT NULL, -- 'Document Upload', 'Document Download', 'Status Change', 'Comment Addition', 'Approval', 'Rejection', 'Login'
    stage VARCHAR(50) NOT NULL, -- 'Gram Sabha', 'SDLC', 'DLC', 'State', 'Applicant', 'System'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_patta ON claim_audit_trail(patta_id);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    officer_id VARCHAR(100), -- specific target officer, or NULL for role-based broadcast
    role VARCHAR(100), -- targeted role: e.g. 'SDLC Officer'
    jurisdiction VARCHAR(100), -- targeted district, or 'Karnataka'
    patta_id VARCHAR(100) REFERENCES fra_records(patta_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_target ON notifications(officer_id, role, jurisdiction, is_read);
