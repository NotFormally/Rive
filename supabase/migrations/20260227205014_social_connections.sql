CREATE TABLE IF NOT EXISTS public.social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurant_profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok', 'instagram')),
    account_id TEXT NOT NULL,
    account_name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    
    -- Ensure a restaurant only links one specific account from a platform once
    UNIQUE (restaurant_id, platform, account_id)
);

-- RLS Policies
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own social connections"
    ON public.social_connections FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.restaurant_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own social connections"
    ON public.social_connections FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM public.restaurant_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can update own social connections"
    ON public.social_connections FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.restaurant_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can delete own social connections"
    ON public.social_connections FOR DELETE
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM public.restaurant_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Index for fast lookup by restaurant
CREATE INDEX IF NOT EXISTS idx_social_connections_restr_id ON public.social_connections(restaurant_id);
-- Timestamp trigger
CREATE TRIGGER handle_updated_at_social_conn
  BEFORE UPDATE ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
