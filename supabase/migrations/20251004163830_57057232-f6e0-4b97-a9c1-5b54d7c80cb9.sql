-- Add permissive policy for development to allow calendar and dashboard to display shifts
DROP POLICY IF EXISTS "Allow all operations during development" ON shifts;

CREATE POLICY "Allow all operations during development"
  ON shifts
  FOR ALL
  USING (true)
  WITH CHECK (true);