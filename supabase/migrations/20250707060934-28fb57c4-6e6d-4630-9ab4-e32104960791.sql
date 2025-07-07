-- Insert sample client profiles for testing
INSERT INTO public.client_profiles (client_name, default_location) VALUES
('Liam Thompson', 'Birchwood House'),
('Ava Williams', 'Meadowview Lodge'),
('Noah Johnson', 'Rosefield Court'),
('Ella Smith', 'Hilltop Home'),
('Lucas Brown', 'Maple Ridge House'),
('Sophie Lewis', 'Greenlake Support')
ON CONFLICT (client_name) DO UPDATE SET 
default_location = EXCLUDED.default_location;