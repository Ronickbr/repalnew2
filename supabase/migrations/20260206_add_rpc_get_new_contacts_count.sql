-- Function to get count of new leads (contacts) to avoid 'leads' keyword in URL (AdBlock workaround)
CREATE OR REPLACE FUNCTION get_new_contacts_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM leads WHERE status = 'novo';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_new_contacts_count() TO authenticated;
