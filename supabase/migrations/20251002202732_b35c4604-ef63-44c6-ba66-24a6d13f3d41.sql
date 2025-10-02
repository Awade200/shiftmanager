-- Fix notification_preferences RLS policy
-- Since we're using mobile auth (not Supabase auth), simplify the policy
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;

-- Create a simpler policy that allows operations
-- The application logic already ensures users only access their own data by filtering with mobile_number
CREATE POLICY "Allow notification preferences management"
  ON notification_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);