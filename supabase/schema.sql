-- Pencilation — Supabase schema (run in SQL Editor)
-- Admin login: create a user in Authentication with email = username + '@pencilation.admin'
-- (see <meta name="login-email-domain">), then sign in from the login page.

-- Realtime (optional): Database → Replication → enable bookings + artworks, or:
-- alter publication supabase_realtime add table bookings;
-- alter publication supabase_realtime add table artworks;

CREATE TABLE IF NOT EXISTS public.bookings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    service text,
    date date,
    client_name text NOT NULL,
    client_email text NOT NULL,
    client_phone text NOT NULL DEFAULT '',
    client_social text NOT NULL DEFAULT '',
    medium text NOT NULL,
    size text NOT NULL DEFAULT '',
    address text,
    deadline text,
    payment_method text NOT NULL DEFAULT '',
    reference_url text,
    receipt_url text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings (client_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings (created_at DESC);

ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.artworks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    category text NOT NULL DEFAULT '',
    size text NOT NULL DEFAULT '',
    image_url text,
    is_featured boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artworks DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.services (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    description text,
    image_url text,
    order_index integer NOT NULL DEFAULT 0
);

ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rates (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    size text NOT NULL,
    label text,
    price text,
    order_index integer NOT NULL DEFAULT 0
);

ALTER TABLE public.rates DISABLE ROW LEVEL SECURITY;

-- Seed once (idempotent)
INSERT INTO public.services (title, description, image_url, order_index)
SELECT 'Pencil Realism Art', '"BINI Mikha" - A breathtaking hyper-realistic pencil portrait, meticulously crafted to capture every fine detail and expression.', 'images/portrait_sample.png', 1
WHERE NOT EXISTS (SELECT 1 FROM public.services s WHERE s.title = 'Pencil Realism Art');

INSERT INTO public.services (title, description, image_url, order_index)
SELECT 'Colored Drawing Art', '"Evil Demon Slayer" - A masterful triple-panel hand-drawn illustration with vibrant colored pencils and bold Japanese calligraphy.', 'images/colored.jpg', 2
WHERE NOT EXISTS (SELECT 1 FROM public.services s WHERE s.title = 'Colored Drawing Art');

INSERT INTO public.services (title, description, image_url, order_index)
SELECT 'Digital Masterpiece', '"ASEAN Diversity" - A professional digital commission celebrating Southeast Asian unity and cultural harmony.', 'images/digital_art.png', 3
WHERE NOT EXISTS (SELECT 1 FROM public.services s WHERE s.title = 'Digital Masterpiece');

INSERT INTO public.rates (size, label, price, order_index)
SELECT '8.5 x 11', 'Standard Letter', '500.00', 1
WHERE NOT EXISTS (SELECT 1 FROM public.rates r WHERE r.size = '8.5 x 11');

INSERT INTO public.rates (size, label, price, order_index)
SELECT '9 x 12', 'Artist Choice', '750.00', 2
WHERE NOT EXISTS (SELECT 1 FROM public.rates r WHERE r.size = '9 x 12');

INSERT INTO public.rates (size, label, price, order_index)
SELECT '11 x 14', 'Premium Large', '1200.00', 3
WHERE NOT EXISTS (SELECT 1 FROM public.rates r WHERE r.size = '11 x 14');

INSERT INTO public.rates (size, label, price, order_index)
SELECT '12 x 18', 'Exhibition Size', '2000.00', 4
WHERE NOT EXISTS (SELECT 1 FROM public.rates r WHERE r.size = '12 x 18');

INSERT INTO public.artworks (title, category, size, image_url, is_featured)
SELECT 'Graceful Glance', 'Graphite', '9x12 inches', 'images/portrait_sample.png', true
WHERE NOT EXISTS (SELECT 1 FROM public.artworks a WHERE a.title = 'Graceful Glance');
