
-- =============================================
-- PHASE 1: Clara Financial System Evolution
-- =============================================

-- 1. Evolve existing tables (non-destructive additions)

-- transactions: new columns
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS credit_card_id uuid,
  ADD COLUMN IF NOT EXISTS debt_id uuid,
  ADD COLUMN IF NOT EXISTS receivable_id uuid,
  ADD COLUMN IF NOT EXISTS parse_confidence numeric,
  ADD COLUMN IF NOT EXISTS duplicate_of_transaction_id uuid;

-- categories: new columns
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS default_budget numeric;

-- accounts: new columns
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS available_balance numeric,
  ADD COLUMN IF NOT EXISTS last_statement_balance numeric,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 2. New tables

-- credit_cards
CREATE TABLE public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bank text NOT NULL,
  name text NOT NULL,
  last_four text,
  linked_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  credit_limit numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  statement_balance numeric,
  available_credit numeric,
  closing_day integer,
  due_day integer,
  minimum_payment numeric,
  no_interest_payment numeric,
  apr numeric,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- debts
CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  creditor text,
  original_amount numeric NOT NULL DEFAULT 0,
  current_balance numeric NOT NULL DEFAULT 0,
  apr numeric DEFAULT 0,
  minimum_payment numeric DEFAULT 0,
  due_day integer,
  type text NOT NULL DEFAULT 'other',
  strategy_tag text NOT NULL DEFAULT 'manual',
  payoff_priority integer,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- receivables
CREATE TABLE public.receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  debtor_name text NOT NULL,
  concept text,
  amount_total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  reminder_enabled boolean NOT NULL DEFAULT false,
  last_reminder_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- jar_settings
CREATE TABLE public.jar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  necessities numeric NOT NULL DEFAULT 55,
  financial_freedom numeric NOT NULL DEFAULT 10,
  education numeric NOT NULL DEFAULT 10,
  play numeric NOT NULL DEFAULT 10,
  long_term_savings numeric NOT NULL DEFAULT 10,
  give numeric NOT NULL DEFAULT 5,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- income_allocations
CREATE TABLE public.income_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  income_transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  jar_type text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  destination_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- assistant_memory
CREATE TABLE public.assistant_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text,
  entity_id uuid,
  summary text NOT NULL,
  tags text[] DEFAULT '{}',
  memory_type text NOT NULL DEFAULT 'fact',
  salience_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- reminders
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'telegram',
  reminder_type text NOT NULL,
  target_entity_type text,
  target_entity_id uuid,
  schedule_type text NOT NULL DEFAULT 'daily',
  schedule_config jsonb DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_financial_preferences
CREATE TABLE public.user_financial_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  monthly_income_goal numeric,
  preferred_currency text NOT NULL DEFAULT 'MXN',
  debt_strategy_default text DEFAULT 'avalanche',
  motivational_tone text DEFAULT 'calm',
  telegram_daily_digest_enabled boolean NOT NULL DEFAULT false,
  telegram_digest_hour integer DEFAULT 8,
  week_start_day integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- attachments
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  source text NOT NULL DEFAULT 'web',
  uploaded_via text DEFAULT 'dashboard',
  parsed_text text,
  ocr_status text NOT NULL DEFAULT 'pending',
  ocr_confidence numeric,
  parse_status text NOT NULL DEFAULT 'pending',
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Foreign keys for transactions new columns
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_credit_card FOREIGN KEY (credit_card_id) REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_transactions_debt FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_transactions_receivable FOREIGN KEY (receivable_id) REFERENCES public.receivables(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_transactions_duplicate FOREIGN KEY (duplicate_of_transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;

-- 4. RLS on all new tables
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_financial_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own credit_cards" ON public.credit_cards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own debts" ON public.debts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own receivables" ON public.receivables FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own jar_settings" ON public.jar_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own income_allocations" ON public.income_allocations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own assistant_memory" ON public.assistant_memory FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own reminders" ON public.reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own user_financial_preferences" ON public.user_financial_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own attachments" ON public.attachments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Triggers for updated_at
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON public.receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jar_settings_updated_at BEFORE UPDATE ON public.jar_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_financial_preferences_updated_at BEFORE UPDATE ON public.user_financial_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Indexes for performance
CREATE INDEX idx_credit_cards_user ON public.credit_cards(user_id);
CREATE INDEX idx_debts_user ON public.debts(user_id);
CREATE INDEX idx_receivables_user ON public.receivables(user_id);
CREATE INDEX idx_receivables_status ON public.receivables(user_id, status);
CREATE INDEX idx_jar_settings_user ON public.jar_settings(user_id);
CREATE INDEX idx_income_allocations_user ON public.income_allocations(user_id);
CREATE INDEX idx_income_allocations_tx ON public.income_allocations(income_transaction_id);
CREATE INDEX idx_assistant_memory_user ON public.assistant_memory(user_id);
CREATE INDEX idx_reminders_user ON public.reminders(user_id);
CREATE INDEX idx_reminders_next_run ON public.reminders(next_run_at) WHERE enabled = true;
CREATE INDEX idx_attachments_user ON public.attachments(user_id);
CREATE INDEX idx_transactions_source ON public.transactions(user_id, source);
CREATE INDEX idx_transactions_credit_card ON public.transactions(credit_card_id) WHERE credit_card_id IS NOT NULL;
CREATE INDEX idx_transactions_debt ON public.transactions(debt_id) WHERE debt_id IS NOT NULL;
