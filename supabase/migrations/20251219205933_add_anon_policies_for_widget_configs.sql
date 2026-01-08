/*
  # Add Anonymous Access Policies for Widget Configurations
  
  1. Changes
    - Add policies to allow anonymous (unauthenticated) users to manage widget configurations
    - This enables the demo application to function without Supabase authentication
    - Policies allow full CRUD operations for anon users on all widget-related tables
  
  2. Security Note
    - These policies are intended for demo/development environments
    - In production, you would use authenticated policies with proper user identification
*/

-- Add anon policies for widget_configurations
CREATE POLICY "Allow anon users to view all widget configurations"
  ON widget_configurations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert widget configurations"
  ON widget_configurations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update widget configurations"
  ON widget_configurations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete widget configurations"
  ON widget_configurations FOR DELETE
  TO anon
  USING (true);

-- Add anon policies for custom_gradients
CREATE POLICY "Allow anon users to view all gradients"
  ON custom_gradients FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert gradients"
  ON custom_gradients FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update gradients"
  ON custom_gradients FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete gradients"
  ON custom_gradients FOR DELETE
  TO anon
  USING (true);

-- Add anon policies for slide_backgrounds
CREATE POLICY "Allow anon users to view all slide backgrounds"
  ON slide_backgrounds FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert slide backgrounds"
  ON slide_backgrounds FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update slide backgrounds"
  ON slide_backgrounds FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete slide backgrounds"
  ON slide_backgrounds FOR DELETE
  TO anon
  USING (true);

-- Add anon policies for calculated_metrics
CREATE POLICY "Allow anon users to view all calculated metrics"
  ON calculated_metrics FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert calculated metrics"
  ON calculated_metrics FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update calculated metrics"
  ON calculated_metrics FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete calculated metrics"
  ON calculated_metrics FOR DELETE
  TO anon
  USING (true);