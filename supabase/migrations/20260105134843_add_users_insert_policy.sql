-- Allow authenticated users to insert their own profile
-- This is needed when a user first signs in via OAuth
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = id);
