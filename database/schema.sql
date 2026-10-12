-- ==========================================================
-- AGRI SUPPLY CHAIN TRACKING AND MANAGEMENT SYSTEM
-- PostgreSQL Schema (normalized, LAN-only, no cloud services)
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------
-- ROLES & USERS
-- ----------------------------------------------------------
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL, -- admin, farmer, collection_center, warehouse_manager, transporter, retailer, customer
    description VARCHAR(255)
);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id         INTEGER NOT NULL REFERENCES roles(id),
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    profile_photo   VARCHAR(255),
    is_approved     BOOLEAN NOT NULL DEFAULT FALSE, -- admin approves new registrations
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    reset_token     VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ----------------------------------------------------------
-- FARMERS & FARMS
-- ----------------------------------------------------------
CREATE TABLE farmers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_proof    VARCHAR(255),
    bank_details VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE farms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id       UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    farm_name       VARCHAR(150) NOT NULL,
    address         VARCHAR(255),
    gps_lat         DECIMAL(10,7),
    gps_lng         DECIMAL(10,7),
    soil_type       VARCHAR(100),
    size_acres      DECIMAL(10,2),
    is_organic      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- PRODUCTS / CROPS
-- ----------------------------------------------------------
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id             UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_name           VARCHAR(150) NOT NULL,
    variety             VARCHAR(150),
    harvest_date        DATE,
    expected_quantity   DECIMAL(12,2),
    actual_quantity     DECIMAL(12,2),
    unit                VARCHAR(20) DEFAULT 'kg',
    is_organic          BOOLEAN DEFAULT FALSE,
    status              VARCHAR(30) NOT NULL DEFAULT 'registered',
    -- registered -> collected -> in_warehouse -> in_transit -> at_retailer -> sold
    tracking_id         VARCHAR(30) UNIQUE NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_farm ON products(farm_id);
CREATE INDEX idx_products_tracking ON products(tracking_id);

-- ----------------------------------------------------------
-- QR CODES (polymorphic: attach to products, batches, shipments)
-- ----------------------------------------------------------
CREATE TABLE qr_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code            VARCHAR(64) UNIQUE NOT NULL,
    entity_type     VARCHAR(30) NOT NULL, -- 'product', 'batch', 'shipment'
    entity_id       UUID NOT NULL,
    qr_image_path   VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_qr_entity ON qr_codes(entity_type, entity_id);

-- ----------------------------------------------------------
-- IMAGES (polymorphic: farms, products, quality checks)
-- ----------------------------------------------------------
CREATE TABLE images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(30) NOT NULL,
    entity_id   UUID NOT NULL,
    file_path   VARCHAR(255) NOT NULL,
    caption     VARCHAR(255),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_images_entity ON images(entity_type, entity_id);

-- ----------------------------------------------------------
-- COLLECTION CENTERS
-- ----------------------------------------------------------
CREATE TABLE collection_centers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    center_name VARCHAR(150) NOT NULL,
    address     VARCHAR(255),
    gps_lat     DECIMAL(10,7),
    gps_lng     DECIMAL(10,7),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    collection_center_id UUID NOT NULL REFERENCES collection_centers(id),
    decision            VARCHAR(20) NOT NULL, -- accepted, rejected
    quality_notes       TEXT,
    verified_weight     DECIMAL(12,2),
    rejection_reason    TEXT,
    received_at         TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_collection_product ON collection_records(product_id);

-- ----------------------------------------------------------
-- WAREHOUSES
-- ----------------------------------------------------------
CREATE TABLE warehouses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id  UUID NOT NULL REFERENCES users(id),
    name        VARCHAR(150) NOT NULL,
    address     VARCHAR(255),
    gps_lat     DECIMAL(10,7),
    gps_lng     DECIMAL(10,7),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouse_shelves (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    shelf_number    VARCHAR(30) NOT NULL,
    capacity        DECIMAL(12,2),
    UNIQUE(warehouse_id, shelf_number)
);

CREATE TABLE batches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number    VARCHAR(50) UNIQUE NOT NULL,
    product_id      UUID NOT NULL REFERENCES products(id),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    shelf_id        UUID REFERENCES warehouse_shelves(id),
    quantity        DECIMAL(12,2) NOT NULL,
    expiry_date     DATE,
    status          VARCHAR(30) DEFAULT 'stored', -- stored, dispatched, expired
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_batches_warehouse ON batches(warehouse_id);

CREATE TABLE inventory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    batch_id        UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        DECIMAL(12,2) NOT NULL,
    reorder_level   DECIMAL(12,2) DEFAULT 50,
    status          VARCHAR(20) DEFAULT 'in_stock', -- in_stock, low_stock, out_of_stock
    last_updated    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);

CREATE TABLE environment_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    temperature_c   DECIMAL(5,2),
    humidity_pct    DECIMAL(5,2),
    recorded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_env_logs_warehouse ON environment_logs(warehouse_id);

-- ----------------------------------------------------------
-- TRANSPORT
-- ----------------------------------------------------------
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transporter_id  UUID NOT NULL REFERENCES users(id),
    vehicle_number  VARCHAR(30) UNIQUE NOT NULL,
    vehicle_type    VARCHAR(50),
    capacity_kg     DECIMAL(12,2),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE shipments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id         VARCHAR(30) UNIQUE NOT NULL,
    batch_id            UUID REFERENCES batches(id),
    product_id          UUID NOT NULL REFERENCES products(id),
    vehicle_id          UUID REFERENCES vehicles(id),
    driver_id           UUID REFERENCES users(id),
    origin_type         VARCHAR(30), -- warehouse, collection_center
    origin_id           UUID,
    destination_type    VARCHAR(30), -- retailer, warehouse
    destination_id      UUID,
    status              VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending -> pickup -> dispatched -> in_transit -> delivered / cancelled
    delay_reason        TEXT,
    estimated_arrival   TIMESTAMP,
    current_lat         DECIMAL(10,7),
    current_lng         DECIMAL(10,7),
    dispatched_at       TIMESTAMP,
    delivered_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- ----------------------------------------------------------
-- RETAILERS & ORDERS
-- ----------------------------------------------------------
CREATE TABLE retailers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name  VARCHAR(150) NOT NULL,
    address     VARCHAR(255),
    gps_lat     DECIMAL(10,7),
    gps_lng     DECIMAL(10,7),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE retailer_stock (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retailer_id UUID NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id),
    shipment_id UUID REFERENCES shipments(id),
    quantity    DECIMAL(12,2) NOT NULL,
    received_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    retailer_id     UUID NOT NULL REFERENCES retailers(id),
    customer_name   VARCHAR(150),
    product_id      UUID NOT NULL REFERENCES products(id),
    quantity        DECIMAL(12,2) NOT NULL,
    total_amount    DECIMAL(12,2),
    status          VARCHAR(30) DEFAULT 'placed', -- placed, fulfilled, cancelled
    order_date      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_retailer ON orders(retailer_id);

-- ----------------------------------------------------------
-- TRACKING HISTORY (the customer-facing timeline)
-- ----------------------------------------------------------
CREATE TABLE tracking_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stage       VARCHAR(50) NOT NULL, -- farm, collection_center, warehouse, transport, retailer
    status      VARCHAR(50) NOT NULL,
    location    VARCHAR(255),
    gps_lat     DECIMAL(10,7),
    gps_lng     DECIMAL(10,7),
    notes       TEXT,
    recorded_by UUID REFERENCES users(id),
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tracking_product ON tracking_history(product_id);

-- ----------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = broadcast to role
    role_id     INTEGER REFERENCES roles(id), -- used when broadcasting to a role
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(150) NOT NULL,
    message     TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ----------------------------------------------------------
-- ACTIVITY / AUDIT LOGS
-- ----------------------------------------------------------
CREATE TABLE activity_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   UUID,
    ip_address  VARCHAR(50),
    metadata    JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at);

-- ----------------------------------------------------------
-- AUTO-UPDATE updated_at TRIGGER
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
