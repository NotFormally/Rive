-- Rive — Migration v16 : Invoice Line Items (Hybrid OCR Support)
-- Execution: Supabase SQL Editor / CLI

-- CREATE TABLE FOR DETAILED INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL, -- L'IA peut ne pas trouver de match, l'ID est null
    
    -- Valeurs Brutes extraites par OCR (Document AI) & LLM (Claude)
    raw_description TEXT NOT NULL,
    quantity NUMERIC(10,4),
    unit TEXT,
    unit_price NUMERIC(10,4),
    total_price NUMERIC(10,2),
    
    -- Méta-données de l'IA
    ai_confidence DECIMAL(3,2) DEFAULT 1.00 CHECK (ai_confidence BETWEEN 0.00 AND 1.00),
    status TEXT DEFAULT 'mapped' CHECK (status IN ('mapped', 'unmapped', 'flagged', 'reviewed')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour accélérer les recherches par facture
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id 
    ON invoice_line_items(invoice_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- 1. Un restaurant ne peut SELECT que les lignes de SES factures
DROP POLICY IF EXISTS "Tenant select invoice_line_items" ON invoice_line_items;
CREATE POLICY "Tenant select invoice_line_items" ON invoice_line_items FOR SELECT
  USING (
    invoice_id IN (
        SELECT id FROM invoices WHERE restaurant_id IN (
            SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- 2. Un restaurant ne peut INSERT que s'il possède la facture
DROP POLICY IF EXISTS "Tenant insert invoice_line_items" ON invoice_line_items;
CREATE POLICY "Tenant insert invoice_line_items" ON invoice_line_items FOR INSERT
  WITH CHECK (
    invoice_id IN (
        SELECT id FROM invoices WHERE restaurant_id IN (
            SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- 3. Un restaurant ne peut UPDATE que sur SES factures (ex: Correction manuelle d'un flag OCR)
DROP POLICY IF EXISTS "Tenant update invoice_line_items" ON invoice_line_items;
CREATE POLICY "Tenant update invoice_line_items" ON invoice_line_items FOR UPDATE
  USING (
    invoice_id IN (
        SELECT id FROM invoices WHERE restaurant_id IN (
            SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- 4. Delete automatique géré par ON DELETE CASCADE (via la facture parente), 
-- mais on sécurise quand même le delete manuel ligne par ligne
DROP POLICY IF EXISTS "Tenant delete invoice_line_items" ON invoice_line_items;
CREATE POLICY "Tenant delete invoice_line_items" ON invoice_line_items FOR DELETE
  USING (
    invoice_id IN (
        SELECT id FROM invoices WHERE restaurant_id IN (
            SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()
        )
    )
  );

-- Trigger pour updated_at (Si la fonction update_modified_column existe de la migration food_cost)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
        CREATE TRIGGER update_invoice_lines_modtime
            BEFORE UPDATE ON invoice_line_items
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;
