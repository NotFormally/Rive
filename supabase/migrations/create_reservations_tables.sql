-- Create reservation providers table (Stores API Webhook integrations per restaurant)
CREATE TABLE IF NOT EXISTS public.reservation_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    webhook_token TEXT NOT NULL UNIQUE,
    provider_name TEXT, -- 'libro', 'resy', 'sevenrooms', etc. Nullable until first webhook
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error')),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for providers
ALTER TABLE public.reservation_providers ENABLE ROW LEVEL SECURITY;

-- Provider Policies
CREATE POLICY "Users can view their own providers"
    ON public.reservation_providers FOR SELECT
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own providers"
    ON public.reservation_providers FOR ALL
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

-- Create reservations table (Stores standardized booking data)
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.reservation_providers(id) ON DELETE SET NULL,
    external_id TEXT NOT NULL, -- The ID from Libro/Resy
    guest_count INTEGER NOT NULL DEFAULT 1,
    reservation_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'seated', 'completed', 'cancelled', 'no_show')),
    customer_notes TEXT, -- Dietaries, VIP info
    raw_payload JSONB, -- Store original webhook payload for debugging/future parsing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, external_id) -- Avoid duplicate entries from webhooks
);

-- Enable RLS for reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Reservation Policies
CREATE POLICY "Users can view their own reservations"
    ON public.reservations FOR SELECT
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own reservations"
    ON public.reservations FOR ALL
    USING (restaurant_id IN (
        SELECT restaurant_id FROM user_roles WHERE user_id = auth.uid()
    ));
