
CREATE TABLE public.statement_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  account_name text NOT NULL,
  transactions_count integer NOT NULL DEFAULT 0,
  period_start date,
  period_end date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.statement_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own statement_imports"
  ON public.statement_imports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
