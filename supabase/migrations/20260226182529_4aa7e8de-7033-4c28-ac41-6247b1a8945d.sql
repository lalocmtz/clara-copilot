
-- Add type column to categories
ALTER TABLE public.categories ADD COLUMN type text NOT NULL DEFAULT 'expense';

-- Update existing income categories
UPDATE public.categories SET type = 'income' WHERE name IN ('Ventas', 'Freelance');
