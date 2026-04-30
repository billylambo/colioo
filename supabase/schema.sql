-- Table : products
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  price           INTEGER NOT NULL,
  original_price  INTEGER,
  badge           TEXT CHECK (badge IN ('nouveau','promo','best_seller','rupture','livraison_gratuite','importe_chine')),
  category_id     UUID REFERENCES categories(id),
  whatsapp_number TEXT NOT NULL,
  is_published    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Table : product_sections
CREATE TABLE product_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hero_tagline  TEXT,
  arguments     JSONB DEFAULT '[]',
  description   TEXT,
  specs         JSONB DEFAULT '[]',
  reviews       JSONB DEFAULT '[]',
  options       JSONB DEFAULT '[]',
  updated_at    TIMESTAMPTZ DEFAULT now()
);
-- Format arguments: [{"icon": "✅", "text": "Livraison rapide"}]
-- Format specs:     [{"key": "Matière", "value": "Aluminium"}]
-- Format reviews:   [{"name": "Aminata K.", "rating": 5, "text": "Super produit !"}]
-- Format options:   [{"type": "Taille", "values": ["S", "M", "L", "XL"]}]

-- Table : product_images
CREATE TABLE product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  position    INTEGER DEFAULT 0,
  is_cover    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Table : categories
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN DEFAULT true,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Table : events (Tracking)
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL CHECK (event_type IN ('page_view','commander_click','whatsapp_redirect')),
  product_id   UUID REFERENCES products(id),
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);
-- metadata pour whatsapp_redirect: {"name": "...", "phone": "...", "district": "..."}

-- Table : orders
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID REFERENCES products(id),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_district TEXT NOT NULL,
  options_chosen   JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'nouveau' CHECK (status IN ('nouveau','confirme','livre','annule')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Table : home_sections (Page d'accueil)
CREATE TABLE home_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('hero','stats','reassurance','produits','temoignages','banniere','newsletter')),
  position    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  content     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)
-- Activer RLS sur toutes les tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Lecture publique (visiteurs)
CREATE POLICY "public_read_products" ON products FOR SELECT USING (is_published = true);
CREATE POLICY "public_read_sections" ON product_sections FOR SELECT USING (true);
CREATE POLICY "public_read_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (is_active = true);

-- Écriture publique (tracking + commandes)
CREATE POLICY "public_insert_events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_orders" ON orders FOR INSERT WITH CHECK (true);

-- Home sections : lecture publique, écriture admin
CREATE POLICY "public_read_home_sections" ON home_sections FOR SELECT USING (true);
CREATE POLICY "admin_full_access_home_sections" ON home_sections FOR ALL USING (true);

-- Admin : accès total (via Supabase Auth)
-- Toutes les opérations pour les utilisateurs authentifiés