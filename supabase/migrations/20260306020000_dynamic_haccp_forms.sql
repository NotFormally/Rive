-- Rive — Migration v17 : Dynamic HACCP Forms (No-Code Audit Logic)
-- Execution: Supabase SQL Editor / CLI

-- 1. Table: audit_templates (Le Constructeur No-Code)
CREATE TABLE IF NOT EXISTS audit_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Le Schéma JSONB définit les champs (ex: { "fields": [{ "id": "temp1", "type": "number", "label": "Température Cœur" }, { "id": "photo", "type": "image"}] })
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index template par restaurant
CREATE INDEX IF NOT EXISTS idx_audit_templates_restaurant_id 
    ON audit_templates(restaurant_id);


-- 2. Table: audit_logs (Les Soumissions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurant_profiles(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES audit_templates(id) ON DELETE RESTRICT,
    
    -- L'utilisateur ayant signé l'audit
    user_id UUID NOT NULL REFERENCES auth.users(id), 
    
    -- Polymorphique: Peut lier cet audit à une facture (réception OCR) ou une recette/fiche technique
    reference_entity_type TEXT, -- (ex: 'invoice', 'recipe_prep', 'station_closing')
    reference_entity_id UUID,
    
    -- Les Données Soumises
    data JSONB NOT NULL,
    
    -- Preuve cryptographique d'intégrité (Hash des datas + timestamp + signature commis)
    signature_hash TEXT,
    
    -- Logs immuables: générés au moment X
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index logs par restaurant et reference_entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_id ON audit_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reference ON audit_logs(reference_entity_id);


-- ROW LEVEL SECURITY (RLS)
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour audit_templates : CRUD standard par le Tenant
DROP POLICY IF EXISTS "Tenant select audit_templates" ON audit_templates;
CREATE POLICY "Tenant select audit_templates" ON audit_templates FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant insert audit_templates" ON audit_templates;
CREATE POLICY "Tenant insert audit_templates" ON audit_templates FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant update audit_templates" ON audit_templates;
CREATE POLICY "Tenant update audit_templates" ON audit_templates FOR UPDATE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant delete audit_templates" ON audit_templates;
CREATE POLICY "Tenant delete audit_templates" ON audit_templates FOR DELETE
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));


-- Politiques pour audit_logs : Isolation Tenant + IMMUTABILTÉ
DROP POLICY IF EXISTS "Tenant select audit_logs" ON audit_logs;
CREATE POLICY "Tenant select audit_logs" ON audit_logs FOR SELECT
  USING (restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant insert audit_logs" ON audit_logs;
CREATE POLICY "Tenant insert audit_logs" ON audit_logs FOR INSERT
  WITH CHECK (
      restaurant_id IN (SELECT id FROM restaurant_profiles WHERE user_id = auth.uid()) 
      AND user_id = auth.uid() -- L'audit est signé par soi-même
  );

-- IMMUTABILITÉ : PAS DE DROIT D'UPDATE SUR UN LOG HACCP
-- Une fois signé, l'audit HACCP est scellé pour raisons légales (MAPAQ/Hygiène).
-- S'il y a une erreur, il faut générer un nouveau log.
-- (On ne crée volontairement pas de policy Update)

-- PAS DE DROIT DE DELETE MANUEL 
-- (Les suppressions se font uniquement en cascade via la suppression du restaurant)
-- (On ne crée volontairement pas de policy Delete)

-- Trigger pour la template updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
        CREATE TRIGGER update_audit_templates_modtime
            BEFORE UPDATE ON audit_templates
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;
