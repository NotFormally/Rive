-- Migration: Table des Prospects OSINT (Lead Generation)
-- Description: Stocke les restaurants ciblés par notre scraper pour le pipeline de ventes automatiques.

CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    location TEXT NOT NULL,
    lead_source TEXT NOT NULL, -- ex: MAPAQ_OSINT_SCRAPER, YELP_BAD_REVIEWS
    trigger_event TEXT, -- ex: Hygiene Fine, Health Score Drop
    context_data JSONB, -- Stocke le détail de l'amende, note de l'inspecteur, etc.
    priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH (ex: amende HACCP = HIGH pour vendre RiveHub)
    status TEXT DEFAULT 'NEW', -- NEW, OUTREACH_SENT, DEMO_BOOKED, CLOSED_WON, CLOSED_LOST
    ai_marketing_draft TEXT, -- Copie de l'e-mail auto-généré par Claude pour cibler leur douleur
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ventes et Admin peuvent tout voir sur les leads"
    ON public.leads FOR ALL 
    TO authenticated
    USING (
      (auth.jwt() ->> 'email') LIKE '%@rivehub.com'
    )
    WITH CHECK (
      (auth.jwt() ->> 'email') LIKE '%@rivehub.com'
    );

-- Trigger de mise à jour timestamp
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
