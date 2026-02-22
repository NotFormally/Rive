-- Instructions: Allez dans l'onglet SQL Editor sur votre dashboard Supabase.
-- Collez tout ce code et exécutez-le pour créer les tables.

-- 1. Table des utilisateurs (Gérants et Employés)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  pin TEXT NOT NULL UNIQUE
);

-- 2. Table des modèles de Checklists
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  recurrence TEXT DEFAULT 'daily'
);

-- 3. Table des tâches (Items d'une checklist)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('boolean', 'temperature', 'text')),
  required BOOLEAN DEFAULT true,
  max_temp NUMERIC -- Utilisé uniquement pour le type 'temperature'
);

-- 4. Table des sessions actives (Checklist du jour)
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_by UUID REFERENCES users(id) -- Qui a fini la checklist
);

-- 5. Table des réponses générées par les employés
CREATE TABLE log_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  value TEXT NOT NULL, -- On stocke tout en texte (même les booléens ou les températures)
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Désactivation des RLS (Row Level Security) pour le prototypage MVP.
-- ⚠️ À RÉACTIVER AVANT LA PRODUCTION.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries DISABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- INSERTION DES DONNÉES DE SIMULATION (MOCK DATA)
-- -------------------------------------------------------------

-- Création de Nassim et Sophie
INSERT INTO users (id, name, role, pin) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Nassim (Gérant)', 'admin', '1234'),
  ('22222222-2222-2222-2222-222222222222', 'Sophie (Cuisinière)', 'staff', '5678');

-- Création de notre première checklist : Ouverture Cuisine
INSERT INTO templates (id, title, description) VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Ouverture Cuisine', 'À faire tous les matins avant 11h');

-- Ajout des 3 tâches de l'ouverture cuisine
INSERT INTO tasks (id, template_id, description, type, required, max_temp) VALUES 
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 'Allumer les hottes', 'boolean', true, null),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 'Vérifier température Frigo Viandes (< 4°C)', 'temperature', true, 4.0),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 'Nettoyer les plans de travail', 'boolean', true, null);

-- Création d'une session "À faire aujourd'hui" pour Sophie
INSERT INTO sessions (id, template_id, date, status) VALUES 
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', CURRENT_DATE, 'pending');
