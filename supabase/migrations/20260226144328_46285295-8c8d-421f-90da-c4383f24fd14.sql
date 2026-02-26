
-- Create storage bucket for statement files
INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', false);

-- Users can upload their own statements
CREATE POLICY "Users upload own statements"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read their own statements
CREATE POLICY "Users read own statements"
ON storage.objects FOR SELECT
USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own statements
CREATE POLICY "Users delete own statements"
ON storage.objects FOR DELETE
USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);
