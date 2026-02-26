
-- Table to link Telegram chat_id with app user_id
CREATE TABLE public.telegram_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_chat_id BIGINT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own telegram links"
  ON public.telegram_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role needs full access for the edge function (no JWT)
CREATE POLICY "Service role full access telegram_links"
  ON public.telegram_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Table for temporary linking codes
CREATE TABLE public.telegram_link_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own link codes"
  ON public.telegram_link_codes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role needs full access for the edge function
CREATE POLICY "Service role full access telegram_link_codes"
  ON public.telegram_link_codes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
