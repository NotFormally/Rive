-- Rive — Migration v9 : Invoices (OCR Receipts)
-- Exécuter dans le Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  total_amount TEXT NOT NULL, -- On garde TEXT pour l'instant car le modèle IA renvoie "150.50$" etc, on pourra parser plus tard si besoin
  date DATE NOT NULL,
  top_items TEXT[] DEFAULT '{}',
  image_url TEXT, -- Pour stocker l'URL du reçu scanné plus tard
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select invoices" ON invoices FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant insert invoices" ON invoices FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant update invoices" ON invoices FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant delete invoices" ON invoices FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));
