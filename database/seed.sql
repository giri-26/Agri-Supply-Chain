-- ==========================================================
-- SEED DATA
-- Run after schema.sql
-- Default admin password is "Admin@12345" (bcrypt hash below).
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN.
-- ==========================================================

INSERT INTO roles (name, description) VALUES
    ('admin', 'System administrator with full access'),
    ('farmer', 'Registers farms and products'),
    ('collection_center', 'Verifies and accepts products from farmers'),
    ('warehouse_manager', 'Manages storage, batches and inventory'),
    ('transporter', 'Manages vehicles and shipments'),
    ('retailer', 'Receives stock and manages sales'),
    ('customer', 'Read-only product tracking access')
ON CONFLICT (name) DO NOTHING;

-- Default admin user (email: admin@agrichain.local / password: Admin@12345)
-- Hash generated with bcrypt, 12 salt rounds.
INSERT INTO users (role_id, full_name, email, password_hash, is_approved, is_active)
SELECT id, 'System Administrator', 'admin@agrichain.local',
       '$2b$12$NR4CLHIXGulCm6z2QFKQ/uQR0KSk8QmUdhJWTdjiniWiCwIExAWKq',
       TRUE, TRUE
FROM roles WHERE name = 'admin'
ON CONFLICT (email) DO NOTHING;
