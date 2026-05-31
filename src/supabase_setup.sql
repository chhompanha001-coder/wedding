-- =====================================================================
-- SUPABASE POSTGRESQL SCHEMA SETUP SCRIPT
-- =====================================================================
-- Application: Wedding Guest Manager (Khmer Unicode Typography)
-- Description: Create tables, enable RLS, and add public policies for easy prototyping.
-- Location: /src/supabase_setup.sql
-- =====================================================================

-- 1. Create tables
-- Admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Weddings table
CREATE TABLE IF NOT EXISTS public.weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    host_username VARCHAR(100) UNIQUE NOT NULL,
    host_password VARCHAR(255) NOT NULL,
    khqr_img_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Guests table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    companions INTEGER DEFAULT 0 NOT NULL,
    relation_type VARCHAR(100) NOT NULL, -- e.g., 'ខាងកូនកំលោះ', 'ខាងកូនក្រមុំ', 'មិត្តភក្តិ', 'ផ្សេងៗ'
    amount NUMERIC DEFAULT 0.00 NOT NULL,
    note TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending' or 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Seed default admin (username: admin123, password: password123)
-- Seed standard credentials for local or test environments
INSERT INTO public.admins (username, password)
VALUES ('admin123', 'password123')
ON CONFLICT (username) DO NOTHING;

-- Seed a default wedding event for testing (host_username: wedding123, host_password: host123)
INSERT INTO public.weddings (title, host_username, host_password, khqr_img_url)
VALUES (
    'ពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ សុខា និង ចិន្តា', 
    'wedding123', 
    'host123', 
    'https://i.ibb.co/3s6qCg3/khqr-demo.png' -- ImgBB/Demo placeholder
)
ON CONFLICT (host_username) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- 4. Create Permissive Public Policies for Prototype Access
-- Standard setup for dev/prototype clients using database anon/service keys

-- Drop existing policies if they exist (to allow safe re-running of this script)
DROP POLICY IF EXISTS "Allow public read on Admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public insert on Admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public update on Admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public delete on Admins" ON public.admins;

DROP POLICY IF EXISTS "Allow public read on Weddings" ON public.weddings;
DROP POLICY IF EXISTS "Allow public insert on Weddings" ON public.weddings;
DROP POLICY IF EXISTS "Allow public update on Weddings" ON public.weddings;
DROP POLICY IF EXISTS "Allow public delete on Weddings" ON public.weddings;

DROP POLICY IF EXISTS "Allow public read on Guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public insert on Guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public update on Guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public delete on Guests" ON public.guests;

-- Admins public policies
CREATE POLICY "Allow public read on Admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Allow public insert on Admins" ON public.admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on Admins" ON public.admins FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on Admins" ON public.admins FOR DELETE USING (true);

-- Weddings public policies
CREATE POLICY "Allow public read on Weddings" ON public.weddings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on Weddings" ON public.weddings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on Weddings" ON public.weddings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on Weddings" ON public.weddings FOR DELETE USING (true);

-- Guests public policies
CREATE POLICY "Allow public read on Guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Allow public insert on Guests" ON public.guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on Guests" ON public.guests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on Guests" ON public.guests FOR DELETE USING (true);
