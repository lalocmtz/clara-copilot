
-- Add notes column to credit_cards
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS notes text;

-- Create unified debt obligations view
CREATE OR REPLACE VIEW public.debt_obligations_view AS
SELECT 
  id AS obligation_id,
  'credit_card'::text AS obligation_source,
  user_id,
  name,
  bank AS creditor,
  current_balance,
  COALESCE(apr, 0) AS apr,
  COALESCE(minimum_payment, 0) AS minimum_payment,
  due_day,
  available_credit,
  no_interest_payment,
  NULL::integer AS payoff_priority,
  CASE 
    WHEN credit_limit > 0 THEN ROUND((current_balance / credit_limit) * 100)
    ELSE 0
  END AS utilization_pct,
  active
FROM public.credit_cards
WHERE current_balance > 0

UNION ALL

SELECT 
  id AS obligation_id,
  'debt'::text AS obligation_source,
  user_id,
  name,
  creditor,
  current_balance,
  COALESCE(apr, 0) AS apr,
  COALESCE(minimum_payment, 0) AS minimum_payment,
  due_day,
  NULL::numeric AS available_credit,
  NULL::numeric AS no_interest_payment,
  payoff_priority,
  NULL::numeric AS utilization_pct,
  active
FROM public.debts
WHERE current_balance > 0;

-- Enable RLS on the view (views inherit from underlying tables)
-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_active ON public.credit_cards(user_id, active);
CREATE INDEX IF NOT EXISTS idx_debts_user_active ON public.debts(user_id, active);
