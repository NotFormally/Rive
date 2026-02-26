-- ============================================================================
-- Migration v15: Smart Prep List — Predictive Preparation Planning
--
-- Creates the tables needed for the Smart Prep List feature:
--   1. prep_lists          — One per restaurant/date/service combo
--   2. prep_list_items     — Predicted menu items with portions & feedback
--   3. prep_list_ingredients — Aggregated raw ingredients (Level 3)
--   4. Enrichment of pos_sales with day_of_week and service_period
--   5. Performance indexes and RLS policies
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. prep_lists — The main prep list entity
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prep_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    
    -- Target date and service
    target_date DATE NOT NULL,
    service_period TEXT NOT NULL DEFAULT 'all_day' CHECK (service_period IN ('lunch', 'dinner', 'all_day')),
    
    -- Cover estimation
    reserved_covers INTEGER NOT NULL DEFAULT 0,
    estimated_covers INTEGER NOT NULL DEFAULT 0,
    walk_in_ratio DECIMAL(4,3) DEFAULT 0.000,  -- e.g., 0.280 = 28% walk-ins
    safety_buffer DECIMAL(3,2) DEFAULT 0.10,     -- e.g., 0.10 = 10% extra
    
    -- Aggregated cost from all items
    estimated_food_cost DECIMAL(10,2) DEFAULT 0.00,
    
    -- AI-generated alerts (dietary, anomalies, VIP, etc.)
    alerts JSONB DEFAULT '[]'::jsonb,
    
    -- Data quality indicator (1=reservations only, 2=+POS, 3=+recipes/food cost)
    generation_level INTEGER DEFAULT 1 CHECK (generation_level IN (1, 2, 3)),
    
    -- Lifecycle
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed')),
    chef_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- One prep list per restaurant per date per service period
    UNIQUE(restaurant_id, target_date, service_period)
);

-- Enable RLS
ALTER TABLE public.prep_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prep lists"
    ON public.prep_lists FOR SELECT
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own prep lists"
    ON public.prep_lists FOR ALL
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

-- ---------------------------------------------------------------------------
-- 2. prep_list_items — Individual menu items in the prep list
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prep_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prep_list_id UUID NOT NULL REFERENCES public.prep_lists(id) ON DELETE CASCADE,
    
    -- Menu item reference
    menu_item_id UUID,  -- FK to menu items (nullable if item removed from menu)
    menu_item_name TEXT NOT NULL,
    
    -- Prediction data
    predicted_portions INTEGER NOT NULL DEFAULT 0,
    item_share DECIMAL(5,4) DEFAULT 0.0000,            -- historical order percentage
    confidence_score DECIMAL(3,2) DEFAULT 0.50,          -- 0.00-1.00, based on data quality
    confidence_modifier DECIMAL(4,2) DEFAULT 1.00,       -- learned adjustment (clamped 0.50-2.00)
    
    -- Priority (derived from BCG matrix)
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    priority_score INTEGER DEFAULT 50 CHECK (priority_score BETWEEN 0 AND 100),
    bcg_category TEXT CHECK (bcg_category IN ('phare', 'ancre', 'derive', 'ecueil')),
    
    -- Cost estimate
    margin_percent DECIMAL(5,2) DEFAULT 0.00,
    estimated_cost DECIMAL(8,2) DEFAULT 0.00,
    
    -- Feedback (filled after service)
    actual_portions INTEGER,            -- what the chef actually prepared/sold
    feedback_delta INTEGER,             -- actual - predicted (computed on feedback)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prep_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prep list items"
    ON public.prep_list_items FOR SELECT
    USING (prep_list_id IN (
        SELECT id FROM prep_lists WHERE restaurant_id IN (
            SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage their own prep list items"
    ON public.prep_list_items FOR ALL
    USING (prep_list_id IN (
        SELECT id FROM prep_lists WHERE restaurant_id IN (
            SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
        )
    ));

-- ---------------------------------------------------------------------------
-- 3. prep_list_ingredients — Aggregated raw ingredients (Level 3 output)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prep_list_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prep_list_id UUID NOT NULL REFERENCES public.prep_lists(id) ON DELETE CASCADE,
    
    ingredient_id UUID,  -- FK to ingredients (nullable if ingredient removed)
    ingredient_name TEXT NOT NULL,
    
    total_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'kg',
    estimated_cost DECIMAL(8,2) DEFAULT 0.00,
    
    -- Traceability: which items use this ingredient and how much
    used_by_items JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"menu_item_name": "Risotto", "qty": 2.4, "portions": 12}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prep_list_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prep list ingredients"
    ON public.prep_list_ingredients FOR SELECT
    USING (prep_list_id IN (
        SELECT id FROM prep_lists WHERE restaurant_id IN (
            SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage their own prep list ingredients"
    ON public.prep_list_ingredients FOR ALL
    USING (prep_list_id IN (
        SELECT id FROM prep_lists WHERE restaurant_id IN (
            SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
        )
    ));

-- ---------------------------------------------------------------------------
-- 4. Enrich pos_sales with day_of_week and service_period
-- ---------------------------------------------------------------------------

ALTER TABLE public.pos_sales
    ADD COLUMN IF NOT EXISTS day_of_week INTEGER,       -- 0=Sun, 1=Mon ... 6=Sat
    ADD COLUMN IF NOT EXISTS service_period TEXT,         -- 'lunch' | 'dinner'
    ADD COLUMN IF NOT EXISTS sale_date DATE;              -- Date of sale for historical queries

COMMENT ON COLUMN public.pos_sales.day_of_week IS 'Day of week: 0=Sunday through 6=Saturday. Computed on insert from sale_date.';
COMMENT ON COLUMN public.pos_sales.service_period IS 'Service period derived from sale time: lunch (before 15:00) or dinner (15:00+).';

-- ---------------------------------------------------------------------------
-- 5. Add module toggle to restaurant_settings
-- ---------------------------------------------------------------------------

ALTER TABLE public.restaurant_settings
    ADD COLUMN IF NOT EXISTS module_smart_prep BOOLEAN DEFAULT false;

-- ---------------------------------------------------------------------------
-- 6. Confidence modifiers — persistent per restaurant/item pair
-- (survives across prep lists to enable learning over time)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prep_confidence_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL,
    
    -- The learned modifier (starts at 1.0, adjusts with feedback)
    modifier DECIMAL(4,2) DEFAULT 1.00 CHECK (modifier BETWEEN 0.50 AND 2.00),
    
    -- How many feedback points contributed to this modifier
    feedback_count INTEGER DEFAULT 0,
    
    -- Last feedback date
    last_feedback_at TIMESTAMPTZ,
    
    UNIQUE(restaurant_id, menu_item_id)
);

ALTER TABLE public.prep_confidence_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own confidence modifiers"
    ON public.prep_confidence_modifiers FOR SELECT
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own confidence modifiers"
    ON public.prep_confidence_modifiers FOR ALL
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

-- ---------------------------------------------------------------------------
-- 7. Performance indexes
-- ---------------------------------------------------------------------------

-- Fast prep list lookup by date
CREATE INDEX IF NOT EXISTS idx_prep_lists_restaurant_date
    ON public.prep_lists (restaurant_id, target_date DESC);

-- Prep list items by prep_list (for loading a full list)
CREATE INDEX IF NOT EXISTS idx_prep_items_list
    ON public.prep_list_items (prep_list_id, priority_score DESC);

-- Prep ingredients by prep_list
CREATE INDEX IF NOT EXISTS idx_prep_ingredients_list
    ON public.prep_list_ingredients (prep_list_id);

-- POS sales by day of week (critical for prediction queries)
CREATE INDEX IF NOT EXISTS idx_pos_sales_day_item
    ON public.pos_sales (restaurant_id, day_of_week, menu_item_id);

-- Confidence modifiers lookup
CREATE INDEX IF NOT EXISTS idx_confidence_restaurant_item
    ON public.prep_confidence_modifiers (restaurant_id, menu_item_id);

-- ---------------------------------------------------------------------------
-- Done! Summary:
--   - 4 new tables: prep_lists, prep_list_items, prep_list_ingredients, 
--     prep_confidence_modifiers
--   - 3 new columns on pos_sales (day_of_week, service_period, sale_date)
--   - 1 new column on restaurant_settings (module_smart_prep)
--   - RLS policies on all new tables
--   - 5 performance indexes
-- ---------------------------------------------------------------------------
