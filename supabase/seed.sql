-- =====================================================================
-- Genuine development/bootstrap data.
--  * No products, prices, ratings or discounts are invented here.
--  * Merchants are configured for manual affiliate links; API status is
--    "not_configured" until real credentials are added.
--  * Blog articles are loaded separately as DRAFTS (npm run seed:content).
-- =====================================================================

-- Roles -------------------------------------------------------------------
insert into public.roles (key, name, description, permissions) values
  ('admin', 'Administrator', 'Full access: catalogue, merchants, affiliate programmes, users, roles, analytics and site settings.', array['*']),
  ('editor', 'Editor', 'Manages products, listings, categories, deals, comparisons, banners and blog content. Cannot manage users, merchants or site settings.',
    array['products', 'listings', 'categories', 'brands', 'offers', 'comparisons', 'banners', 'blog', 'analytics:read'])
on conflict (key) do update set name = excluded.name, description = excluded.description, permissions = excluded.permissions;

-- Site settings -----------------------------------------------------------
insert into public.site_settings (
  id, brand_name, tagline, footer_about, social_links, contact_email,
  seo_default_title, seo_title_template, seo_default_description,
  affiliate_disclosure_short, affiliate_disclosure_content, amazon_associate_statement,
  newsletter_enabled, newsletter_heading, newsletter_subheading, newsletter_consent_text
) values (
  1,
  'Kartwise',
  'Discover better products. Shop smarter.',
  'Kartwise helps shoppers in India discover products, compare listings across popular online stores and read practical buying guides. When you buy, you check out directly on the merchant''s website.',
  '{}'::jsonb,
  null,
  'Kartwise — Discover products & compare online shopping options in India',
  '%s | Kartwise',
  'Discover trending products, compare listings from Amazon, Flipkart, Meesho and more, and read practical buying guides before you shop online in India.',
  'Some links on this page are affiliate links. If you buy through them we may earn a commission at no extra cost to you. You complete your purchase on the merchant''s website.',
  E'## How we make money\n\nKartwise is a product discovery and comparison website. Some of the links on our website are **affiliate links**. When you click one of these links and make a qualifying purchase on the merchant''s website, we may earn a commission from that merchant or affiliate network. The price you pay is not increased because you used our link.\n\n## You buy from the merchant, not from us\n\n- When you click **Buy Now**, **Check Price** or **Shop Now**, you are taken to the merchant''s own website (for example Amazon, Flipkart or Meesho).\n- The merchant handles checkout, payment, delivery, returns, refunds, warranty claims and customer support.\n- We do not sell products, take payments or process orders.\n\n## No cashback or rewards\n\nKartwise does **not** offer cashback, reward points, coins, referral earnings or any wallet. Using our links does not entitle you to any reward from us.\n\n## Prices and availability\n\nPrices, offers and availability change frequently. Where we show a price, we show when it was last checked. The price and availability shown on the merchant''s website at the time of purchase are the ones that apply.\n\n## Editorial independence\n\nAffiliate relationships do not decide which products we cover or what we say about them. Read our [editorial policy](/editorial-policy) to learn how we research and update content.\n\n## Programme participation\n\nAs an Amazon Associate I earn from qualifying purchases. We also participate in the Flipkart Affiliate programme and other affiliate programmes. We are not owned by, operated by or an official representative of any merchant.',
  'As an Amazon Associate I earn from qualifying purchases.',
  true,
  'Smarter shopping, in your inbox',
  'Occasional buying guides and curated product picks. No spam, no cashback promises — unsubscribe any time.',
  'I agree to receive the Kartwise newsletter by email. I can unsubscribe at any time using the link in every email. See the Privacy Policy for details.'
) on conflict (id) do nothing;

-- Categories (top level) --------------------------------------------------
insert into public.categories (slug, name, icon, short_description, description, seo_title, meta_description, sort_order, show_on_home, home_sort_order, faqs) values
  ('electronics', 'Electronics', 'tv',
   'Audio, cameras, smart home devices and everyday tech, organised to help you compare before you buy.',
   E'Electronics is one of the most researched categories in Indian online shopping, and also one where small specification differences matter. Use this section to explore audio gear, cameras, smart home devices and other gadgets listed across supported stores.\n\n**Before you buy electronics online**, compare the exact model number across listings, check whether the product carries an Indian warranty, confirm the seller name, and look for BIS certification marks on products where it is mandatory.',
   'Electronics — compare gadgets across online stores in India',
   'Explore electronics such as earbuds, headphones, cameras and smart home devices, and compare listings across Amazon, Flipkart and other Indian online stores.',
   10, true, 10,
   '[{"question":"How do I check that an electronics listing is the same model on two stores?","answer":"Compare the full model number, colour, storage or variant, and what is included in the box. Product names are often shortened on listings, so the model number is the most reliable identifier."},{"question":"Do electronics bought online in India come with a warranty?","answer":"Most brands offer a manufacturer warranty, but terms differ by brand and seller. Check the warranty period, whether it is an Indian or international warranty, and how claims are handled before buying."}]'::jsonb),
  ('mobiles-accessories', 'Mobiles & Accessories', 'smartphone',
   'Smartphones, chargers, power banks, cases and other mobile essentials.',
   E'Find smartphones and the accessories that keep them running. Phones are frequently sold in several RAM and storage combinations, so always confirm the exact variant on each merchant listing.\n\nFor accessories such as chargers and power banks, check the rated output (in watts), the supported fast-charging standard, cable type, and safety certification before purchase.',
   'Mobiles & accessories — smartphones, chargers and more',
   'Discover smartphones, chargers, power banks and mobile accessories, and compare merchant listings and buying considerations before you shop online.',
   20, true, 20, '[]'::jsonb),
  ('computers-laptops', 'Computers & Laptops', 'laptop',
   'Laptops, monitors, keyboards, mice and other computing gear for study, work and play.',
   E'Choosing a computer is easier when you start from how you will use it. Students, office users, creators and gamers need very different processors, memory, storage and displays.\n\nUse our listings and buying guides to shortlist laptops and accessories, then compare the exact configuration, warranty terms and seller on each store before you buy.',
   'Computers & laptops — compare configurations and stores',
   'Explore laptops and computer accessories for students, work and home. Compare configurations, warranty and merchant listings across Indian online stores.',
   30, true, 30, '[]'::jsonb),
  ('fashion-clothing', 'Fashion & Clothing', 'shirt',
   'Clothing and accessories for men, women and kids from popular online stores.',
   E'Fashion listings vary widely in sizing, fabric and fit. Use this section to discover clothing across supported stores, and always check the size chart, fabric composition, wash-care instructions and the return or exchange policy for apparel before ordering.',
   'Fashion & clothing — discover apparel across online stores',
   'Discover clothing and fashion accessories from Amazon, Flipkart, Meesho and more. Check size charts, fabric details and return policies before you buy.',
   40, true, 40, '[]'::jsonb),
  ('home-kitchen', 'Home & Kitchen', 'cooking-pot',
   'Kitchen appliances, cookware, storage, décor and cleaning essentials for everyday living.',
   E'From kitchen appliances to storage and décor, home products are about everyday practicality. Compare capacity, material, power consumption and dimensions across listings, and check whether the product needs installation.\n\nFor electrical appliances, look at the wattage, the BEE star rating where applicable, and warranty coverage for parts such as motors or heating elements.',
   'Home & kitchen — appliances, storage and everyday essentials',
   'Explore home and kitchen products including appliances, cookware, storage and décor. Compare listings, capacity, materials and warranty before buying online.',
   70, true, 70,
   '[{"question":"What should I compare when buying a kitchen appliance online?","answer":"Compare capacity, power rating, material of parts that touch food, included accessories, warranty duration and coverage, and the service network for the brand in your city."}]'::jsonb),
  ('beauty-personal-care', 'Beauty & Personal Care', 'flower-2',
   'Skincare, haircare, grooming and personal care products.',
   E'Beauty and personal care products should be chosen for your skin or hair type, not just popularity. Check the full ingredient list, the manufacturing and expiry dates, and whether the item is sold by the brand or an authorised seller. Many personal care items are non-returnable once opened, so read the return policy carefully.',
   'Beauty & personal care — skincare, haircare and grooming',
   'Discover skincare, haircare and grooming products from popular online stores. Check ingredients, expiry dates and seller details before buying.',
   80, true, 80, '[]'::jsonb),
  ('health-fitness', 'Health & Fitness', 'heart-pulse',
   'Fitness equipment, activity trackers and wellness essentials.',
   E'Explore equipment and accessories for home workouts, running, yoga and general wellness. Check size, weight limits, materials and assembly requirements for equipment.\n\nProduct pages on this website are for shopping research only and are not medical advice. Consult a qualified professional for health-related decisions.',
   'Health & fitness — workout gear and wellness products',
   'Explore fitness equipment, activity trackers and wellness essentials. Compare materials, weight limits and merchant listings before you buy online.',
   90, true, 90, '[]'::jsonb),
  ('baby-kids', 'Baby & Kids', 'baby',
   'Baby care, toys, school supplies and essentials for children.',
   E'Shopping for children calls for extra care. Check age suitability, safety markings, materials and small-part warnings for toys, and verify expiry dates for baby care products. Compare listings and sellers before you buy.',
   'Baby & kids — baby care, toys and kids essentials',
   'Discover baby care products, toys and kids essentials. Check age suitability, safety information and seller details across online stores.',
   100, true, 100, '[]'::jsonb),
  ('sports-outdoors', 'Sports & Outdoors', 'bike',
   'Sports gear, cycling, camping and outdoor equipment.',
   E'Find equipment for cricket, badminton, cycling, trekking and other outdoor activities. Sizing and build quality matter for sports gear, so compare materials, weight and size guides across listings.',
   'Sports & outdoors — sports gear and outdoor equipment',
   'Explore sports equipment, cycling accessories and outdoor gear. Compare sizes, materials and merchant listings before you buy online in India.',
   110, true, 110, '[]'::jsonb),
  ('shoes-footwear', 'Shoes & Footwear', 'footprints',
   'Sports shoes, casual footwear, sandals and formal shoes.',
   E'Footwear sizes are not always consistent between brands. Check whether a listing uses UK, US or EU sizing, read the brand''s size chart, and confirm the exchange policy in case the fit is not right.',
   'Shoes & footwear — sports, casual and formal shoes',
   'Discover sports shoes, casual footwear and sandals from online stores. Compare size charts, materials and exchange policies before buying.',
   120, true, 120, '[]'::jsonb),
  ('watches', 'Watches', 'watch',
   'Analogue, digital and smartwatches.',
   E'From classic analogue watches to smartwatches, compare the movement or display type, water resistance rating, strap material and warranty. For smartwatches, also check phone compatibility, battery life claims and which health features are available in India.',
   'Watches — analogue, digital and smartwatches',
   'Explore analogue watches and smartwatches. Compare water resistance, battery life, compatibility and warranty across merchant listings.',
   130, true, 130, '[]'::jsonb),
  ('books', 'Books', 'book-open',
   'Fiction, non-fiction, exam preparation and children''s books.',
   E'Discover books across genres and formats. Check the edition, language, format (paperback, hardcover or e-book) and publication year — especially for exam preparation titles, where the latest edition matters.',
   'Books — fiction, non-fiction and exam preparation',
   'Discover books across genres and formats. Compare editions, formats and merchant listings for fiction, non-fiction and exam preparation titles.',
   140, true, 140, '[]'::jsonb),
  ('automotive-accessories', 'Automotive Accessories', 'car',
   'Car and bike accessories, care products and tools.',
   E'Explore accessories for cars and two-wheelers, from phone mounts and chargers to cleaning products and tools. Always check vehicle compatibility (make, model and year), fitment instructions and applicable traffic rules before buying.',
   'Automotive accessories — car and bike essentials',
   'Explore car and bike accessories including mounts, chargers, care products and tools. Check vehicle compatibility before buying online.',
   150, true, 150, '[]'::jsonb)
on conflict (slug) do nothing;

-- Subcategories ------------------------------------------------------------
insert into public.categories (slug, name, icon, short_description, description, parent_id, sort_order, show_on_home, home_sort_order)
select v.slug, v.name, v.icon, v.short_description, v.description, parent.id, v.sort_order, v.show_on_home, v.home_sort_order
from (values
  ('mens-fashion', 'Men''s Fashion', 'shirt', 'Shirts, t-shirts, trousers, ethnic wear and accessories for men.',
   E'Discover menswear across online stores. Compare fabric, fit (slim, regular or relaxed) and size charts, and check exchange policies before buying.', 'fashion-clothing', 41, true, 50),
  ('womens-fashion', 'Women''s Fashion', 'gem', 'Ethnic wear, western wear, handbags and accessories for women.',
   E'Discover womenswear across online stores. Check fabric, length, size charts and care instructions, and confirm return or exchange options for each listing.', 'fashion-clothing', 42, true, 60),
  ('headphones-earbuds', 'Headphones & Earbuds', 'headphones', 'Wireless earbuds, neckbands and over-ear headphones.',
   E'Compare wireless earbuds and headphones by battery life, codec support, microphone quality, fit and water resistance. Battery and noise-cancellation figures are usually manufacturer claims, so treat them as a guide.', 'electronics', 11, false, 0),
  ('cameras', 'Cameras & Photography', 'camera', 'Cameras, lenses, action cameras and photography accessories.',
   E'Explore cameras and accessories. Compare sensor size, lens mount, video capabilities and what is included in the box.', 'electronics', 12, false, 0),
  ('smart-home', 'Smart Home', 'lightbulb', 'Smart plugs, bulbs, cameras and home automation devices.',
   E'Smart home devices depend on app and ecosystem support. Check which assistants and apps are supported, Wi-Fi band requirements and data privacy settings.', 'electronics', 13, false, 0),
  ('smartphones', 'Smartphones', 'smartphone', 'Android and iOS smartphones across budgets.',
   E'Compare smartphones by processor, RAM and storage variant, display, camera, battery, software update policy and 5G band support.', 'mobiles-accessories', 21, false, 0),
  ('chargers-power-banks', 'Chargers & Power Banks', 'battery-charging', 'Wall chargers, cables and power banks.',
   E'Check output wattage, supported fast-charging standards, cable type and safety certification when buying charging accessories.', 'mobiles-accessories', 22, false, 0),
  ('laptops', 'Laptops', 'laptop', 'Laptops for students, work, creative tasks and gaming.',
   E'Compare processor generation, RAM (and whether it is upgradeable), SSD capacity, display quality, weight, battery life and warranty.', 'computers-laptops', 31, false, 0),
  ('computer-accessories', 'Computer Accessories', 'mouse', 'Keyboards, mice, monitors, webcams and storage.',
   E'Check connectivity (USB-C, Bluetooth, wireless receiver), operating system compatibility and warranty for computer accessories.', 'computers-laptops', 32, false, 0),
  ('kitchen-appliances', 'Kitchen Appliances', 'microwave', 'Mixer grinders, kettles, air fryers, induction cooktops and more.',
   E'Compare capacity, wattage, material, safety features and warranty. For appliances that run daily, a strong local service network matters.', 'home-kitchen', 71, false, 0),
  ('home-decor', 'Home Décor', 'sofa', 'Décor, lighting, furnishings and wall art.',
   E'Check dimensions, materials and colour accuracy notes, and look at the return policy for décor items that may arrive in a different shade than on screen.', 'home-kitchen', 72, false, 0),
  ('storage-organisation', 'Storage & Organisation', 'archive', 'Containers, organisers, racks and space-saving storage.',
   E'Measure your space first. Compare dimensions, material (food-grade plastic, steel or glass) and load capacity for racks and organisers.', 'home-kitchen', 73, false, 0),
  ('fitness-equipment', 'Fitness Equipment', 'dumbbell', 'Dumbbells, yoga mats, resistance bands and home gym equipment.',
   E'Check weight ranges, materials, maximum user weight and floor space requirements for home fitness equipment.', 'health-fitness', 91, false, 0),
  ('toys-games', 'Toys & Games', 'puzzle', 'Educational toys, board games and outdoor play.',
   E'Check the recommended age, safety warnings and materials. Toys sold in India are covered by BIS certification requirements.', 'baby-kids', 101, false, 0),
  ('smartwatches', 'Smartwatches', 'watch', 'Smartwatches and fitness bands.',
   E'Compare display type, battery life claims, phone compatibility, water resistance rating and which sensors and features work in India.', 'watches', 131, false, 0)
) as v(slug, name, icon, short_description, description, parent_slug, sort_order, show_on_home, home_sort_order)
join public.categories parent on parent.slug = v.parent_slug
on conflict (slug) do nothing;

-- Merchants ---------------------------------------------------------------
insert into public.merchants (
  slug, name, short_description, description, website_url, allowed_domains,
  logo_usage_permitted, disclosure_text, allow_manual_prices, price_max_age_hours,
  highlights, seo_title, meta_description, is_active, is_featured, sort_order
) values
  ('amazon', 'Amazon',
   'Amazon.in sells products from Amazon and independent sellers across almost every category.',
   E'Amazon.in is one of India''s largest online marketplaces. Products are sold either by Amazon-fulfilled sellers or by independent third-party sellers, so the seller, delivery speed and return terms can differ between two listings of the same product.\n\n### Tips for shopping on Amazon\n\n- Check the **"Sold by"** name on the product page and look at the seller''s ratings.\n- Read the return window shown on the product page — it varies by category and seller.\n- Compare the exact model number and variant before buying.\n\nKartwise participates in the Amazon Associates programme. We are not owned by, operated by or an official representative of Amazon.',
   'https://www.amazon.in', array['amazon.in', 'www.amazon.in', 'amzn.to', 'amzn.in'],
   false, 'As an Amazon Associate I earn from qualifying purchases.', false, 23,
   '["Products are sold by Amazon-fulfilled and independent sellers — check the seller on each listing","Return windows vary by category and seller","Prices shown here are only displayed when sourced from Amazon''s official API and refreshed within 24 hours"]'::jsonb,
   'Amazon India — discover products and listings',
   'Discover products available on Amazon.in, compare listings with other Indian stores, and learn what to check before you buy.',
   true, true, 10),
  ('flipkart', 'Flipkart',
   'Flipkart is a large Indian marketplace for electronics, fashion, home products and more.',
   E'Flipkart is one of India''s largest e-commerce marketplaces, with a wide range of electronics, fashion, home and everyday products. Like other marketplaces, many items are sold by third-party sellers, so delivery, warranty handling and returns can vary.\n\n### Tips for shopping on Flipkart\n\n- Check the seller name and seller rating on the product page.\n- Read the return or replacement policy shown on each listing.\n- Confirm the exact variant (colour, storage, size) before checkout.\n\nKartwise participates in the Flipkart Affiliate programme. We are not owned by, operated by or an official representative of Flipkart.',
   'https://www.flipkart.com', array['flipkart.com', 'www.flipkart.com', 'dl.flipkart.com', 'fkrt.it'],
   false, null, true, 48,
   '["Many items are sold by third-party sellers — check the seller on each listing","Return and replacement terms differ by product","Always confirm the exact variant before checkout"]'::jsonb,
   'Flipkart — discover products and listings',
   'Discover products available on Flipkart, compare listings with other Indian online stores, and learn what to check before buying.',
   true, true, 20),
  ('meesho', 'Meesho',
   'Meesho is an Indian marketplace known for affordable fashion, home and lifestyle products from small sellers.',
   E'Meesho is an Indian online marketplace where many small businesses sell fashion, home, kitchen and lifestyle products, often at budget-friendly price points.\n\n### Tips for shopping on Meesho\n\n- Read the product details, fabric or material, and size chart carefully.\n- Check the return or exchange policy shown on the listing.\n- Look at product photos from multiple angles and the seller information.\n\nWe list Meesho products only through an approved affiliate programme or network. We are not owned by, operated by or an official representative of Meesho.',
   'https://www.meesho.com', array['meesho.com', 'www.meesho.com'],
   false, null, true, 48,
   '["Wide range of budget fashion and home products from small sellers","Check size charts and material details carefully","Return and exchange terms vary by listing"]'::jsonb,
   'Meesho — discover products and listings',
   'Discover affordable fashion, home and lifestyle products available on Meesho, and learn what to check before you buy.',
   true, true, 30)
on conflict (slug) do nothing;

-- Affiliate programmes ------------------------------------------------------
insert into public.affiliate_programs (merchant_id, name, network, status, integration_type, adapter_key, api_status, documentation_url, notes, is_default)
select m.id, v.name, v.network, v.status, v.integration_type, v.adapter_key, 'not_configured', v.documentation_url, v.notes, true
from (values
  ('amazon', 'Amazon Associates (India)', 'Direct', 'approved', 'manual', 'amazon_creators',
   'https://affiliate-program.amazon.in/',
   'Manual links (SiteStripe or tagged URLs) work immediately. Product data and prices require the official Amazon Creators API (PA-API 5.0 is retired) — add credentials in server environment variables, then test the connection from Admin > Merchants. Prices from manual entry are not displayed for Amazon.'),
  ('flipkart', 'Flipkart Affiliate', 'Direct', 'approved', 'manual', 'flipkart_affiliate',
   'https://affiliate.flipkart.com/api-docs/affiliate_index.html',
   'Manual affiliate links work immediately. Optional: add FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN to enable product/price refresh through the official Affiliate API.'),
  ('meesho', 'Meesho (approved programme or network)', null, 'approved', 'manual', 'meesho',
   null,
   'Admin-managed affiliate URLs only. No public Meesho product API is assumed. If links come from an affiliate network, add the network''s tracking domain to this merchant''s allowed domains.')
) as v(slug, name, network, status, integration_type, adapter_key, documentation_url, notes)
join public.merchants m on m.slug = v.slug
where not exists (select 1 from public.affiliate_programs ap where ap.merchant_id = m.id);

-- Blog taxonomy -------------------------------------------------------------
insert into public.blog_categories (slug, name, description, sort_order) values
  ('buying-guides', 'Buying Guides', 'Practical guides that explain what to look for before you buy a product.', 10),
  ('smart-shopping', 'Smart Shopping', 'Tips for comparing stores, spotting genuine deals and shopping online safely in India.', 20),
  ('comparisons', 'Comparisons', 'Side-by-side looks at products, specifications and shopping platforms.', 30),
  ('explainers', 'Explainers', 'How online shopping, affiliate links and product discovery work.', 40)
on conflict (slug) do nothing;

insert into public.blog_tags (slug, name) values
  ('smartphones', 'Smartphones'), ('earbuds', 'Earbuds'), ('laptops', 'Laptops'),
  ('kitchen', 'Kitchen'), ('home', 'Home'), ('gadgets', 'Gadgets'), ('deals', 'Deals'),
  ('amazon', 'Amazon'), ('flipkart', 'Flipkart'), ('meesho', 'Meesho'),
  ('online-safety', 'Online safety'), ('budget', 'Budget'), ('students', 'Students'),
  ('price-comparison', 'Price comparison'), ('affiliate-marketing', 'Affiliate marketing')
on conflict (slug) do nothing;

insert into public.blog_authors (slug, name, job_title, bio, expertise) values
  ('editorial-team', 'Kartwise Editorial Team', 'Editorial team',
   'Our editorial team researches products and online shopping practices for Indian consumers. Articles are written from publicly available manufacturer information, official policies and hands-on research where stated, and are reviewed before publication. Replace or extend this profile with your named authors and their real credentials.',
   array['Online shopping', 'Consumer electronics', 'Home & kitchen'])
on conflict (slug) do nothing;

-- Banners -------------------------------------------------------------------
insert into public.banners (placement, eyebrow, title, subtitle, cta_label, cta_url, secondary_cta_label, secondary_cta_url, theme, sort_order)
select * from (values
  ('home_hero', 'Product discovery across India''s favourite stores',
   'Discover Better Products. Shop Smarter.',
   'Explore products, compare shopping options and find great deals from your favourite online stores.',
   'Explore Products', '/products', 'Discover Today''s Deals', '/deals', 'violet', 0),
  ('home_promo', 'Buying guides',
   'Know what to check before you buy',
   'Plain-English guides on specifications, warranties, returns and spotting genuine discounts.',
   'Read the guides', '/blog', null, null, 'saffron', 10),
  ('home_promo', 'How it works',
   'You always buy directly from the store',
   'We help you discover and compare. Checkout, delivery and returns are handled by the merchant.',
   'See how it works', '/how-it-works', null, null, 'navy', 20)
) as v(placement, eyebrow, title, subtitle, cta_label, cta_url, secondary_cta_label, secondary_cta_url, theme, sort_order)
where not exists (select 1 from public.banners);
