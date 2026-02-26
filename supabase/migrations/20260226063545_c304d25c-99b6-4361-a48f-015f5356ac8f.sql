
ALTER TABLE public.subscriptions
  ADD COLUMN billing_day integer,
  ADD COLUMN sub_type text NOT NULL DEFAULT 'digital',
  ADD COLUMN category text,
  ADD COLUMN category_icon text NOT NULL DEFAULT '🔄';

-- Set billing_day from existing next_date for existing rows
UPDATE public.subscriptions
SET billing_day = EXTRACT(DAY FROM next_date)::integer
WHERE billing_day IS NULL;
