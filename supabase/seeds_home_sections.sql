-- Seeds: Sections par défaut pour la page d'accueil COLIOO
-- Exécuter après création de la table home_sections

-- 1. Hero Principal
INSERT INTO home_sections (id, type, position, is_active, content) VALUES
('11111111-0000-0000-0000-000000000001', 'hero', 0, true, '{
  "title": "Les Meilleurs Produits Importés de Chine",
  "subtitle": "Livraison à domicile en Côte d''Ivoire. Qualité garantie, prix direct usine.",
  "cta_text": "Découvrir le catalogue",
  "cta_link": "/catalogue",
  "bg_color": "#1a1a2e"
}');

-- 2. Statistiques
INSERT INTO home_sections (id, type, position, is_active, content) VALUES
('11111111-0000-0000-0000-000000000002', 'stats', 1, true, '{
  "items": [
    {"number": "500+", "label": "Produits"},
    {"number": "48h", "label": "Livraison"},
    {"number": "100%", "label": "Satisfait"}
  ]
}');

-- 3. Réassurance
INSERT INTO home_sections (id, type, position, is_active, content) VALUES
('11111111-0000-0000-0000-000000000003', 'reassurance', 2, true, '{
  "items": [
    {"icon": "🚚", "label": "Livraison domicile"},
    {"icon": "✅", "label": "Qualité garantie"},
    {"icon": "💬", "label": "Support WhatsApp"}
  ]
}');

-- 4. Grille Produits (automatique depuis la BDD)
INSERT INTO home_sections (id, type, position, is_active, content) VALUES
('11111111-0000-0000-0000-000000000004', 'produits', 3, true, '{
  "title": "Nos produits populaires"
}');

-- 5. Bannière Promo
INSERT INTO home_sections (id, type, position, is_active, content) VALUES
('11111111-0000-0000-0000-000000000005', 'banniere', 4, true, '{
  "title": "Nouveau ! Commandez via WhatsApp",
  "subtitle": "Simple, rapide et sécurisé. Cliquez pour commander.",
  "cta_text": "Commander maintenant",
  "cta_link": "/catalogue",
  "bg_color": "#FF6B00"
}');

-- 6. Témoignages
INSERT INTO home_sections (id, type, position, is_active, content) VALUES
('11111111-0000-0000-0000-000000000006', 'temoignages', 5, true, '{
  "title": "Ce que disent nos clients",
  "items": [
    {"name": "Aminata K.", "text": "Livraison rapide et produits de qualité. Je recommande !", "rating": 5},
    {"name": "Konan B.", "text": "Excellent service client, toujours disponible sur WhatsApp.", "rating": 5}
  ]
}');

-- 7. Newsletter
INSERT INTO home_sections (id, type, position, is_active, content) VALUES
('11111111-0000-0000-0000-000000000007', 'newsletter', 6, true, '{
  "title": "Restez informé",
  "subtitle": "Inscrivez-vous pour recevoir nos offres exclusives",
  "placeholder": "Votre email..."
}');