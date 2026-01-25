-- Add missing index on activity_logs.user_id to fix "unindexed_foreign_keys"
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- Fix "multiple_permissive_policies" on public.users
-- The existing policy "Admin Write Access on users" (ALL) overlaps with "Public Read Access on users" (SELECT)
-- We split the write access into INSERT, UPDATE, DELETE to avoid checking it during SELECT

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Admin Write Access on users'
    ) THEN
        DROP POLICY "Admin Write Access on users" ON public.users;
        
        -- Create separate policies for write operations
        CREATE POLICY "Admin Insert Access on users" ON public.users
        FOR INSERT TO public
        WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

        CREATE POLICY "Admin Update Access on users" ON public.users
        FOR UPDATE TO public
        USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text)
        WITH CHECK ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);

        CREATE POLICY "Admin Delete Access on users" ON public.users
        FOR DELETE TO public
        USING ((auth.jwt() ->> 'is_admin'::text) = 'true'::text);
    END IF;
END $$;
