-- Add super_admin role for nick@algner.de
INSERT INTO public.user_roles (user_id, role)
VALUES ('d9b68ca8-c47b-40c8-b2ee-7ea853c2417b', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;