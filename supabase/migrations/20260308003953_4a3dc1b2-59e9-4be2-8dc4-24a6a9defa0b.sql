
CREATE OR REPLACE FUNCTION increment_account_balance(p_account_id uuid, p_delta numeric)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE accounts SET balance = balance + p_delta, balance_updated_at = now()
  WHERE id = p_account_id;
$$;

CREATE OR REPLACE FUNCTION increment_credit_card_balance(p_card_id uuid, p_delta numeric)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE credit_cards SET current_balance = current_balance + p_delta, updated_at = now()
  WHERE id = p_card_id;
$$;
