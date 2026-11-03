-- =====================================================================
-- Core schema for the multi-store affiliate product discovery platform.
--
-- Design notes
--  * Text + CHECK constraints are used instead of Postgres enums so that
--    values can evolve with simple migrations.
--  * Every table has Row Level Security enabled (see the RLS migration).
--  * There is intentionally NO cashback, wallet, reward, referral or
--    withdrawal data model. Outbound clicks are recorded for analytics only
--    and are never treated as sales or commissions.
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Slugs: lowercase letters, digits and single hyphens.
create domain public.slug_text as text
  check (value ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(value) <= 120);

-- ---------------------------------------------------------------------
-- Users, profiles and roles
-- ---------------------------------------------------------------------
create table public.roles (
  key text primary key check (key in ('admin', 'editor')),
  name text not null,
  description text not null,
  permissions text[] not null default '{}'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 120),
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  newsletter_opt_in boolean not null default false,
  notification_prefs jsonb not null default '{"product_updates": false, "editorial_digest": false}'::jsonb,
  privacy_prefs jsonb not null default '{"track_recently_viewed": true}'::jsonb,
  deletion_requested_at timestamptz,
  deletion_reason text check (char_length(deletion_reason) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (lower(email));
create index profiles_deletion_requested_idx on public.profiles (deletion_requested_at) where deletion_requested_at is not null;

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null references public.roles (key) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---------------------------------------------------------------------
-- Catalogue: brands, categories
-- ---------------------------------------------------------------------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  website_url text check (website_url is null or website_url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  slug public.slug_text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  short_description text check (char_length(short_description) <= 300),
  description text,
  icon text,
  image_url text,
  image_alt text,
  seo_title text check (char_length(seo_title) <= 120),
  meta_description text check (char_length(meta_description) <= 320),
  faqs jsonb not null default '[]'::jsonb check (jsonb_typeof(faqs) = 'array'),
  sort_order integer not null default 0,
  show_on_home boolean not null default false,
  home_sort_order integer not null default 0,
  is_active boolean not null default true,
  noindex boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_not_self_parent check (parent_id is null or parent_id <> id)
);
create index categories_parent_idx on public.categories (parent_id);
create index categories_home_idx on public.categories (show_on_home, home_sort_order) where is_active;

-- Prevent cycles in the category tree.
create or replace function public.categories_prevent_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cursor_id uuid := new.parent_id;
  depth integer := 0;
begin
  while cursor_id is not null loop
    if cursor_id = new.id then
      raise exception 'Category hierarchy cycle detected';
    end if;
    depth := depth + 1;
    if depth > 10 then
      raise exception 'Category hierarchy is too deep (max 10 levels)';
    end if;
    select c.parent_id into cursor_id from public.categories c where c.id = cursor_id;
  end loop;
  return new;
end;
$$;
create trigger categories_prevent_cycle
  before insert or update of parent_id on public.categories
  for each row execute function public.categories_prevent_cycle();

-- ---------------------------------------------------------------------
-- Merchants and affiliate programmes
-- ---------------------------------------------------------------------
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  short_description text check (char_length(short_description) <= 300),
  description text,
  website_url text not null check (website_url ~* '^https://'),
  -- Optional affiliate-tagged link to the store homepage ("Visit Store").
  visit_url text check (visit_url is null or visit_url ~* '^https://'),
  -- Hostnames that destination and affiliate URLs for this merchant may use
  -- (merchant domains plus any approved network tracking domains).
  allowed_domains text[] not null default '{}',
  logo_url text,
  -- Only display a third-party logo when its use is authorised.
  logo_usage_permitted boolean not null default false,
  brand_color text check (brand_color is null or brand_color ~ '^#[0-9a-fA-F]{6}$'),
  -- Merchant-specific disclosure (e.g. the Amazon Associates statement).
  disclosure_text text,
  -- Pricing compliance controls.
  allow_manual_prices boolean not null default true,
  price_max_age_hours integer check (price_max_age_hours is null or price_max_age_hours > 0),
  highlights jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights) = 'array'),
  policy_links jsonb not null default '[]'::jsonb check (jsonb_typeof(policy_links) = 'array'),
  seo_title text check (char_length(seo_title) <= 120),
  meta_description text check (char_length(meta_description) <= 320),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  network text,
  status text not null default 'not_applied'
    check (status in ('not_applied', 'applied', 'approved', 'paused', 'rejected', 'inactive')),
  integration_type text not null default 'manual'
    check (integration_type in ('manual', 'api', 'feed', 'network')),
  adapter_key text not null default 'generic'
    check (adapter_key in ('generic', 'amazon_creators', 'flipkart_affiliate', 'meesho')),
  api_status text not null default 'not_configured'
    check (api_status in ('not_configured', 'credentials_added', 'active', 'error', 'disabled')),
  -- A non-secret reference such as an Associates tag or affiliate id label.
  -- Secrets (tokens, client secrets) live ONLY in server environment variables.
  tracking_id_ref text check (char_length(tracking_id_ref) <= 120),
  documentation_url text check (documentation_url is null or documentation_url ~* '^https://'),
  terms_url text check (terms_url is null or terms_url ~* '^https://'),
  notes text,
  is_default boolean not null default false,
  last_sync_at timestamptz,
  last_sync_status text check (last_sync_status is null or last_sync_status in ('success', 'partial', 'error')),
  last_sync_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index affiliate_programs_merchant_idx on public.affiliate_programs (merchant_id);
create unique index affiliate_programs_one_default on public.affiliate_programs (merchant_id) where is_default;

-- ---------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  name text not null check (char_length(name) between 2 and 200),
  brand_id uuid references public.brands (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  model_number text check (char_length(model_number) <= 120),
  short_description text check (char_length(short_description) <= 320),
  overview text,
  description text,
  key_features text[] not null default '{}',
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  best_for text,
  not_ideal_for text,
  buying_considerations text,
  faqs jsonb not null default '[]'::jsonb check (jsonb_typeof(faqs) = 'array'),
  -- Attribution for specifications / editorial claims: [{title, url, note}]
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  search_keywords text check (char_length(search_keywords) <= 500),
  seo_title text check (char_length(seo_title) <= 120),
  meta_description text check (char_length(meta_description) <= 320),
  canonical_url text check (canonical_url is null or canonical_url ~* '^https://'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  -- Editorial justification required for the "Trending" label.
  trending_reason text check (char_length(trending_reason) <= 200),
  noindex boolean not null default false,
  published_at timestamptz,
  content_reviewed_at timestamptz,
  view_count bigint not null default 0,
  click_count bigint not null default 0,
  popularity_score bigint generated always as (view_count + click_count * 5) stored,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(model_number, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(search_keywords, '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(short_description, '')), 'C')
  ) stored,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_trending_needs_reason check (not is_trending or trending_reason is not null)
);
create index products_category_idx on public.products (category_id);
create index products_brand_idx on public.products (brand_id);
create index products_status_published_idx on public.products (status, published_at desc);
create index products_featured_idx on public.products (is_featured) where is_featured;
create index products_trending_idx on public.products (is_trending) where is_trending;
create index products_popularity_idx on public.products (popularity_score desc);
create index products_search_idx on public.products using gin (search_vector);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

create or replace function public.products_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;
create trigger products_set_published_at
  before insert or update of status on public.products
  for each row execute function public.products_set_published_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null check (url ~* '^https?://'),
  storage_path text,
  alt_text text not null check (char_length(alt_text) between 3 and 250),
  -- Where the image came from. Merchant API images must be served from the
  -- merchant-provided URL and are rendered without re-processing.
  source text not null default 'upload'
    check (source in ('upload', 'merchant_api', 'licensed', 'brand_press_kit', 'own_photo', 'other')),
  credit text,
  source_url text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  group_name text not null default 'General' check (char_length(group_name) <= 80),
  label text not null check (char_length(label) between 1 and 120),
  value text not null check (char_length(value) between 1 and 500),
  source_url text check (source_url is null or source_url ~* '^https?://'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, group_name, label)
);
create index product_specs_product_idx on public.product_specs (product_id, sort_order);

create table public.product_relations (
  product_id uuid not null references public.products (id) on delete cascade,
  related_product_id uuid not null references public.products (id) on delete cascade,
  relation_type text not null default 'alternative' check (relation_type in ('alternative', 'related')),
  note text check (char_length(note) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, related_product_id, relation_type),
  constraint product_relations_not_self check (product_id <> related_product_id)
);

-- ---------------------------------------------------------------------
-- Merchant listings (affiliate links) for products
-- ---------------------------------------------------------------------
create table public.product_listings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  merchant_id uuid not null references public.merchants (id) on delete restrict,
  program_id uuid references public.affiliate_programs (id) on delete set null,
  variant_label text not null default '' check (char_length(variant_label) <= 120),
  destination_url text not null check (destination_url ~* '^https://'),
  affiliate_url text not null check (affiliate_url ~* '^https://'),
  merchant_product_id text check (char_length(merchant_product_id) <= 120),
  current_price numeric(12, 2) check (current_price is null or current_price >= 0),
  previous_price numeric(12, 2) check (previous_price is null or previous_price >= 0),
  previous_price_type text not null default 'mrp' check (previous_price_type in ('mrp', 'list_price', 'was_price')),
  currency char(3) not null default 'INR',
  availability text not null default 'unknown'
    check (availability in ('in_stock', 'out_of_stock', 'limited_stock', 'preorder', 'unknown')),
  coupon_code text check (char_length(coupon_code) <= 60),
  offer_details text check (char_length(offer_details) <= 500),
  offer_expires_at timestamptz,
  price_source text not null default 'manual'
    check (price_source in ('manual', 'amazon_creators_api', 'flipkart_affiliate_api', 'partner_feed', 'network_api', 'other')),
  price_checked_at timestamptz,
  url_status text not null default 'unchecked' check (url_status in ('unchecked', 'ok', 'redirected', 'broken', 'error')),
  url_checked_at timestamptz,
  url_check_message text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  internal_notes text,
  last_synced_at timestamptz,
  sync_error text,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, merchant_id, variant_label),
  constraint product_listings_price_needs_timestamp check (current_price is null or price_checked_at is not null)
);
create index product_listings_product_idx on public.product_listings (product_id) where is_active;
create index product_listings_merchant_idx on public.product_listings (merchant_id);
create index product_listings_merchant_product_idx on public.product_listings (merchant_id, merchant_product_id);
create index product_listings_updated_idx on public.product_listings (updated_at desc);

-- ---------------------------------------------------------------------
-- Offers / deals
-- ---------------------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  title text not null check (char_length(title) between 3 and 200),
  description text check (char_length(description) <= 1000),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  listing_id uuid references public.product_listings (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  offer_url text not null check (offer_url ~* '^https://'),
  image_url text,
  image_alt text,
  coupon_code text check (char_length(coupon_code) <= 60),
  -- Verified discount information exactly as stated by the merchant.
  discount_text text check (char_length(discount_text) <= 160),
  terms text check (char_length(terms) <= 2000),
  source_url text check (source_url is null or source_url ~* '^https://'),
  verified_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  click_count bigint not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_valid_window check (expires_at is null or starts_at is null or expires_at > starts_at)
);
create index offers_status_idx on public.offers (status, expires_at);
create index offers_merchant_idx on public.offers (merchant_id);

-- ---------------------------------------------------------------------
-- Editorial comparisons
-- ---------------------------------------------------------------------
create table public.comparisons (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  title text not null check (char_length(title) between 3 and 200),
  summary text check (char_length(summary) <= 500),
  intro text,
  verdict text,
  category_id uuid references public.categories (id) on delete set null,
  -- Spec labels to compare as rows; empty = all labels shared by products.
  spec_labels text[] not null default '{}',
  faqs jsonb not null default '[]'::jsonb check (jsonb_typeof(faqs) = 'array'),
  seo_title text check (char_length(seo_title) <= 120),
  meta_description text check (char_length(meta_description) <= 320),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comparison_items (
  comparison_id uuid not null references public.comparisons (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  highlight text check (char_length(highlight) <= 120),
  note text check (char_length(note) <= 500),
  primary key (comparison_id, product_id)
);

-- ---------------------------------------------------------------------
-- Wishlists and recently viewed
-- ---------------------------------------------------------------------
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'My Wishlist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wishlist_items (
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wishlist_id, product_id)
);
create index wishlist_items_product_idx on public.wishlist_items (product_id);

create table public.recently_viewed (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

-- Keep only the 50 most recent items per user.
create or replace function public.recently_viewed_trim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.recently_viewed rv
  where rv.user_id = new.user_id
    and rv.product_id in (
      select r.product_id from public.recently_viewed r
      where r.user_id = new.user_id
      order by r.viewed_at desc
      offset 50
    );
  return null;
end;
$$;
create trigger recently_viewed_trim
  after insert or update on public.recently_viewed
  for each row execute function public.recently_viewed_trim();

-- ---------------------------------------------------------------------
-- Analytics: outbound affiliate clicks, content views, internal search
-- (Clicks are NOT sales and NOT commissions.)
-- ---------------------------------------------------------------------
create table public.affiliate_click_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  listing_id uuid references public.product_listings (id) on delete set null,
  offer_id uuid references public.offers (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  merchant_id uuid references public.merchants (id) on delete set null,
  destination_host text,
  source_path text check (char_length(source_path) <= 500),
  source_component text check (char_length(source_component) <= 60),
  user_id uuid references auth.users (id) on delete set null,
  anon_id text check (char_length(anon_id) <= 64),
  ip_hash text,
  device_type text check (device_type is null or device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')),
  referrer_host text,
  utm_source text check (char_length(utm_source) <= 120),
  utm_medium text check (char_length(utm_medium) <= 120),
  utm_campaign text check (char_length(utm_campaign) <= 120),
  utm_term text check (char_length(utm_term) <= 120),
  utm_content text check (char_length(utm_content) <= 120),
  country text check (char_length(country) <= 8),
  is_suspected_bot boolean not null default false
);
create index affiliate_click_events_created_idx on public.affiliate_click_events (created_at desc);
create index affiliate_click_events_merchant_idx on public.affiliate_click_events (merchant_id, created_at desc);
create index affiliate_click_events_product_idx on public.affiliate_click_events (product_id, created_at desc);

create or replace function public.affiliate_click_increment_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_suspected_bot then
    return null;
  end if;
  if new.product_id is not null then
    update public.products set click_count = click_count + 1 where id = new.product_id;
  end if;
  if new.offer_id is not null then
    update public.offers set click_count = click_count + 1 where id = new.offer_id;
  end if;
  return null;
end;
$$;
create trigger affiliate_click_increment_counters
  after insert on public.affiliate_click_events
  for each row execute function public.affiliate_click_increment_counters();

create table public.content_views_daily (
  entity_type text not null check (entity_type in ('home', 'product', 'category', 'store', 'blog_post', 'comparison', 'deals')),
  entity_id uuid not null,
  day date not null default current_date,
  views integer not null default 0,
  primary key (entity_type, entity_id, day)
);
create index content_views_daily_day_idx on public.content_views_daily (day desc);

create table public.search_queries (
  id bigint generated always as identity primary key,
  query text not null check (char_length(query) <= 200),
  normalized_query text not null check (char_length(normalized_query) <= 200),
  results_count integer not null default 0,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index search_queries_normalized_idx on public.search_queries (normalized_query, created_at desc);
create index search_queries_created_idx on public.search_queries (created_at desc);

-- Optional partner-reported performance (imported from official reports/APIs).
-- These figures come from the affiliate programmes, never from click counts.
create table public.affiliate_performance_reports (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants (id) on delete cascade,
  program_id uuid references public.affiliate_programs (id) on delete set null,
  period_start date not null,
  period_end date not null,
  clicks_reported integer check (clicks_reported is null or clicks_reported >= 0),
  orders integer check (orders is null or orders >= 0),
  items_shipped integer check (items_shipped is null or items_shipped >= 0),
  revenue numeric(14, 2) check (revenue is null or revenue >= 0),
  commission numeric(14, 2),
  currency char(3) not null default 'INR',
  source text not null default 'manual' check (source in ('manual', 'csv_import', 'api')),
  notes text,
  raw jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint affiliate_performance_reports_period check (period_end >= period_start),
  unique (merchant_id, period_start, period_end, source)
);

-- ---------------------------------------------------------------------
-- Blog CMS
-- ---------------------------------------------------------------------
create table public.blog_authors (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  name text not null check (char_length(name) between 2 and 120),
  job_title text check (char_length(job_title) <= 120),
  bio text check (char_length(bio) <= 2000),
  avatar_url text,
  expertise text[] not null default '{}',
  website_url text check (website_url is null or website_url ~* '^https://'),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  profile_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 500),
  seo_title text check (char_length(seo_title) <= 120),
  meta_description text check (char_length(meta_description) <= 320),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  title text not null check (char_length(title) between 5 and 200),
  excerpt text check (char_length(excerpt) <= 400),
  -- AEO: a concise, stand-alone answer shown near the top of the article.
  answer_summary text check (char_length(answer_summary) <= 800),
  content text not null default '',
  featured_image_url text,
  featured_image_alt text check (char_length(featured_image_alt) <= 250),
  author_id uuid references public.blog_authors (id) on delete set null,
  category_id uuid references public.blog_categories (id) on delete set null,
  product_category_id uuid references public.categories (id) on delete set null,
  seo_title text check (char_length(seo_title) <= 120),
  meta_description text check (char_length(meta_description) <= 320),
  canonical_url text check (canonical_url is null or canonical_url ~* '^https://'),
  primary_keyword text check (char_length(primary_keyword) <= 120),
  secondary_keywords text[] not null default '{}',
  search_intent text check (search_intent is null or search_intent in ('informational', 'commercial', 'transactional', 'navigational')),
  faqs jsonb not null default '[]'::jsonb check (jsonb_typeof(faqs) = 'array'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'scheduled', 'published', 'archived')),
  published_at timestamptz,
  content_updated_at timestamptz,
  ai_assisted boolean not null default false,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  editor_notes text,
  reading_time_minutes integer,
  is_featured boolean not null default false,
  noindex boolean not null default false,
  view_count bigint not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_live_needs_date check (status not in ('published', 'scheduled') or published_at is not null),
  -- AI-assisted drafts can never go live without a recorded editorial review.
  constraint blog_posts_ai_needs_review check (not ai_assisted or status not in ('published', 'scheduled') or reviewed_at is not null)
);
create index blog_posts_status_published_idx on public.blog_posts (status, published_at desc);
create index blog_posts_category_idx on public.blog_posts (category_id);
create index blog_posts_product_category_idx on public.blog_posts (product_category_id);

create or replace function public.blog_posts_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  words integer;
begin
  words := coalesce(array_length(regexp_split_to_array(trim(coalesce(new.content, '')), '\s+'), 1), 0);
  new.reading_time_minutes := greatest(1, ceil(words / 200.0)::integer);
  if tg_op = 'UPDATE' and (new.content is distinct from old.content or new.title is distinct from old.title) then
    new.content_updated_at := now();
  end if;
  return new;
end;
$$;
create trigger blog_posts_before_write
  before insert or update on public.blog_posts
  for each row execute function public.blog_posts_before_write();

create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  tag_id uuid not null references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create table public.blog_post_products (
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (post_id, product_id)
);

create table public.blog_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  title text not null,
  excerpt text,
  content text not null,
  snapshot jsonb not null default '{}'::jsonb,
  note text check (char_length(note) <= 300),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index blog_revisions_post_idx on public.blog_revisions (post_id, created_at desc);

-- ---------------------------------------------------------------------
-- Newsletter, contact, banners, site settings
-- ---------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status text not null default 'subscribed' check (status in ('pending', 'subscribed', 'unsubscribed')),
  consent_text text not null,
  consent_at timestamptz not null default now(),
  consent_source text check (char_length(consent_source) <= 300),
  ip_hash text,
  user_id uuid references auth.users (id) on delete set null,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  provider_synced_at timestamptz,
  provider_error text,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_idx on public.newsletter_subscribers (lower(email));

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254),
  subject text not null check (char_length(subject) between 1 and 200),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  ip_hash text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('home_hero', 'home_promo', 'deals_top')),
  eyebrow text check (char_length(eyebrow) <= 80),
  title text not null check (char_length(title) between 3 and 160),
  subtitle text check (char_length(subtitle) <= 400),
  cta_label text check (char_length(cta_label) <= 40),
  cta_url text,
  secondary_cta_label text check (char_length(secondary_cta_label) <= 40),
  secondary_cta_url text,
  image_url text,
  image_alt text,
  theme text not null default 'violet' check (theme in ('violet', 'saffron', 'navy', 'emerald', 'rose')),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index banners_placement_idx on public.banners (placement, sort_order) where is_active;

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  brand_name text not null default 'Kartwise' check (char_length(brand_name) between 1 and 60),
  tagline text check (char_length(tagline) <= 160),
  logo_url text,
  favicon_url text,
  footer_about text check (char_length(footer_about) <= 600),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  contact_email text,
  contact_phone text,
  contact_address text,
  seo_default_title text check (char_length(seo_default_title) <= 120),
  seo_title_template text check (seo_title_template is null or position('%s' in seo_title_template) > 0),
  seo_default_description text check (char_length(seo_default_description) <= 320),
  default_og_image_url text,
  affiliate_disclosure_short text check (char_length(affiliate_disclosure_short) <= 500),
  affiliate_disclosure_content text,
  amazon_associate_statement text not null default 'As an Amazon Associate I earn from qualifying purchases.',
  newsletter_enabled boolean not null default true,
  newsletter_heading text check (char_length(newsletter_heading) <= 120),
  newsletter_subheading text check (char_length(newsletter_subheading) <= 300),
  newsletter_consent_text text check (char_length(newsletter_consent_text) <= 500),
  announcement_text text check (char_length(announcement_text) <= 200),
  announcement_url text,
  google_site_verification text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  entity_type text not null check (char_length(entity_type) <= 60),
  entity_id text,
  summary text check (char_length(summary) <= 500),
  details jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'brands', 'categories', 'merchants', 'affiliate_programs', 'products',
    'product_listings', 'offers', 'comparisons', 'wishlists', 'blog_authors',
    'blog_categories', 'blog_posts', 'newsletter_subscribers', 'banners', 'site_settings'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;
