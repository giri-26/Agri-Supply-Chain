-- ==========================================================
-- MIGRATION 002: Farmers/Products/Inventory/Collection/Orders/
-- Shipments/Buyers module support.
-- Purely additive: only CREATE TABLE IF NOT EXISTS and
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS. Nothing here drops
-- or modifies any existing table's existing columns/data.
-- Run this AFTER database/schema.sql and database/seed.sql.
-- ==========================================================

-- ----------------------------------------------------------
-- PRODUCT CATEGORIES
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Seed a starter set of categories (safe no-op if already present)
INSERT INTO product_categories (name, description) VALUES
    ('Vegetables', 'Fresh vegetables'),
    ('Fruits', 'Fresh fruits'),
    ('Grains', 'Cereals and grains'),
    ('Pulses', 'Lentils and legumes'),
    ('Spices', 'Spices and condiments'),
    ('Dairy', 'Milk and dairy products')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------
-- COLLECTION CENTERS: capacity + contact details
-- ----------------------------------------------------------
ALTER TABLE collection_centers ADD COLUMN IF NOT EXISTS capacity_kg DECIMAL(12,2);
ALTER TABLE collection_centers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE collection_centers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150);

-- Farmers assigned to a collection center
CREATE TABLE IF NOT EXISTS center_farmer_assignments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_center_id    UUID NOT NULL REFERENCES collection_centers(id) ON DELETE CASCADE,
    farmer_id               UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    assigned_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (collection_center_id, farmer_id)
);
CREATE INDEX IF NOT EXISTS idx_center_assignments_center ON center_farmer_assignments(collection_center_id);
CREATE INDEX IF NOT EXISTS idx_center_assignments_farmer ON center_farmer_assignments(farmer_id);

-- ----------------------------------------------------------
-- BUYER ROLE (additive - required for the Buyers module; no
-- existing role or auth logic is modified)
-- ----------------------------------------------------------
INSERT INTO roles (name, description) VALUES
    ('buyer', 'Registers and purchases products from retailers')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------
-- BUYERS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS buyers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name   VARCHAR(150) NOT NULL,
    address         VARCHAR(255),
    gps_lat         DECIMAL(10,7),
    gps_lng         DECIMAL(10,7),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- ORDERS: link to buyers, add notes
-- ----------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      VARCHAR(30) NOT NULL,
    notes       TEXT,
    changed_by  UUID REFERENCES users(id),
    changed_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- ----------------------------------------------------------
-- SHIPMENTS: live route tracking log (many points over time)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipment_tracking_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    gps_lat         DECIMAL(10,7) NOT NULL,
    gps_lng         DECIMAL(10,7) NOT NULL,
    note            VARCHAR(255),
    recorded_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shipment_logs_shipment ON shipment_tracking_logs(shipment_id);

-- Driver profile detail (a shipment's driver_id already points at a users row;
-- this adds license/contact detail without touching the users table)
CREATE TABLE IF NOT EXISTS driver_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_number  VARCHAR(50),
    default_vehicle_id UUID REFERENCES vehicles(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- STOCK MOVEMENTS (drives Available / Incoming / Outgoing Stock views)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    batch_id        UUID REFERENCES batches(id),
    movement_type   VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
    quantity        DECIMAL(12,2) NOT NULL,
    reference_type  VARCHAR(30), -- 'collection', 'shipment', 'adjustment'
    reference_id    UUID,
    notes           VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
