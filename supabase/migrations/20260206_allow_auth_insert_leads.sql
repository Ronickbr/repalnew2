-- Enable RLS on leads table if not already enabled (it should be)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert leads (e.g., admins generating mock leads)
CREATE POLICY "Authenticated users can insert leads" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (auth.role() = 'authenticated');
