
ALTER TABLE public.accounts ADD COLUMN balance_updated_at timestamptz DEFAULT now();
ALTER TABLE public.transactions ADD COLUMN status text NOT NULL DEFAULT 'confirmed';
