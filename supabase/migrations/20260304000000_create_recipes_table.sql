-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    note TEXT,
    prep_time TEXT,
    cook_time TEXT,
    servings TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own recipes"
    ON public.recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
    ON public.recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
    ON public.recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
    ON public.recipes FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipes_timestamp
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipes_updated_at();
