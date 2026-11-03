-- =====================================================================
-- Authorisation helpers, new-user bootstrap, RLS policies, public views
-- and analytics functions.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER so they can be used inside RLS policies
-- without recursive policy evaluation). Roles are ALWAYS checked in the
-- database; client-side role information is never trusted.
-- ---------------------------------------------------------------------
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid())
      and ur.role = p_role
      and p.status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = (select auth.uid())
      and ur.role in ('admin', 'editor')
      and p.status = 'active'
  );
$$;

grant execute on function public.has_role(text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

-- ---------------------------------------------------------------------
-- New user bootstrap: profile + default wishlist.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.wishlists (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the profile email in sync when a user changes their email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.merchants enable row level security;
alter table public.affiliate_programs enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specs enable row level security;
alter table public.product_relations enable row level security;
alter table public.product_listings enable row level security;
alter table public.offers enable row level security;
alter table public.comparisons enable row level security;
alter table public.comparison_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.affiliate_click_events enable row level security;
alter table public.content_views_daily enable row level security;
alter table public.search_queries enable row level security;
alter table public.affiliate_performance_reports enable row level security;
alter table public.blog_authors enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.blog_post_products enable row level security;
alter table public.blog_revisions enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.banners enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.rate_limits enable row level security;

-- ---------------------------------------------------------------------
-- Roles & profiles
-- ---------------------------------------------------------------------
create policy "Roles are readable by signed-in users" on public.roles
  for select to authenticated using (true);

create policy "Users read own profile; admins read all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may only change these columns; status / email are admin-controlled.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, newsletter_opt_in, notification_prefs, privacy_prefs, deletion_requested_at, deletion_reason)
  on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

create policy "Users read own roles; admins read all" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins manage roles" on public.user_roles
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Catalogue (public read, staff write)
-- ---------------------------------------------------------------------
create policy "Brands are public" on public.brands for select using (true);
create policy "Staff manage brands" on public.brands for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Active categories are public" on public.categories for select
  using (is_active or (select public.is_staff()));
create policy "Staff manage categories" on public.categories for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Active merchants are public" on public.merchants for select
  using (is_active or (select public.is_staff()));
create policy "Admins manage merchants" on public.merchants for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Staff read affiliate programmes" on public.affiliate_programs for select to authenticated
  using ((select public.is_staff()));
create policy "Admins manage affiliate programmes" on public.affiliate_programs for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Published products are public" on public.products for select
  using (status = 'published' or (select public.is_staff()));
create policy "Staff manage products" on public.products for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Images of visible products are public" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or (select public.is_staff()))));
create policy "Staff manage product images" on public.product_images for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Specs of visible products are public" on public.product_specs for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or (select public.is_staff()))));
create policy "Staff manage product specs" on public.product_specs for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Relations of visible products are public" on public.product_relations for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or (select public.is_staff()))));
create policy "Staff manage product relations" on public.product_relations for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Public users can read active listings of published products, but can
-- never insert/update/delete prices or affiliate URLs.
create policy "Active listings of published products are public" on public.product_listings for select
  using (
    (select public.is_staff())
    or (
      is_active
      and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
      and exists (select 1 from public.merchants m where m.id = merchant_id and m.is_active)
    )
  );
create policy "Staff manage listings" on public.product_listings for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Live offers are public" on public.offers for select
  using (
    (select public.is_staff())
    or (
      status = 'published'
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at > now())
      and exists (select 1 from public.merchants m where m.id = merchant_id and m.is_active)
    )
  );
create policy "Staff manage offers" on public.offers for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Published comparisons are public" on public.comparisons for select
  using (status = 'published' or (select public.is_staff()));
create policy "Staff manage comparisons" on public.comparisons for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Items of published comparisons are public" on public.comparison_items for select
  using (exists (select 1 from public.comparisons c where c.id = comparison_id and (c.status = 'published' or (select public.is_staff()))));
create policy "Staff manage comparison items" on public.comparison_items for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------------------------------------------------------------------
-- Wishlists & recently viewed (owner only)
-- ---------------------------------------------------------------------
create policy "Users manage own wishlist" on public.wishlists for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Users manage own wishlist items" on public.wishlist_items for all to authenticated
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = (select auth.uid())));

create policy "Users manage own recently viewed" on public.recently_viewed for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Analytics (writes happen server-side with the service role only)
-- ---------------------------------------------------------------------
create policy "Staff read click events" on public.affiliate_click_events for select to authenticated
  using ((select public.is_staff()));
create policy "Staff read content views" on public.content_views_daily for select to authenticated
  using ((select public.is_staff()));
create policy "Staff read search queries" on public.search_queries for select to authenticated
  using ((select public.is_staff()));
create policy "Admins manage performance reports" on public.affiliate_performance_reports for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Blog
-- ---------------------------------------------------------------------
create policy "Blog authors are public" on public.blog_authors for select
  using (is_active or (select public.is_staff()));
create policy "Staff manage blog authors" on public.blog_authors for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Blog categories are public" on public.blog_categories for select using (true);
create policy "Staff manage blog categories" on public.blog_categories for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Blog tags are public" on public.blog_tags for select using (true);
create policy "Staff manage blog tags" on public.blog_tags for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Scheduled posts become visible automatically once published_at passes.
create policy "Live blog posts are public" on public.blog_posts for select
  using (
    (select public.is_staff())
    or (status in ('published', 'scheduled') and published_at <= now())
  );
create policy "Staff manage blog posts" on public.blog_posts for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Tags of live posts are public" on public.blog_post_tags for select
  using (exists (
    select 1 from public.blog_posts p where p.id = post_id
      and ((select public.is_staff()) or (p.status in ('published', 'scheduled') and p.published_at <= now()))
  ));
create policy "Staff manage post tags" on public.blog_post_tags for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Products of live posts are public" on public.blog_post_products for select
  using (exists (
    select 1 from public.blog_posts p where p.id = post_id
      and ((select public.is_staff()) or (p.status in ('published', 'scheduled') and p.published_at <= now()))
  ));
create policy "Staff manage post products" on public.blog_post_products for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Staff manage revisions" on public.blog_revisions for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------------------------------------------------------------------
-- Newsletter, contact, banners, settings, audit, rate limits
-- ---------------------------------------------------------------------
create policy "Admins read subscribers" on public.newsletter_subscribers for select to authenticated
  using ((select public.is_admin()));
create policy "Admins update subscribers" on public.newsletter_subscribers for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete subscribers" on public.newsletter_subscribers for delete to authenticated
  using ((select public.is_admin()));

create policy "Admins manage contact messages" on public.contact_messages for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Live banners are public" on public.banners for select
  using (
    (select public.is_staff())
    or (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
  );
create policy "Staff manage banners" on public.banners for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "Site settings are public" on public.site_settings for select using (true);
create policy "Admins update site settings" on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins read audit log" on public.admin_audit_log for select to authenticated
  using ((select public.is_admin()));
create policy "Staff write own audit entries" on public.admin_audit_log for insert to authenticated
  with check ((select public.is_staff()) and actor_id = (select auth.uid()));

-- rate_limits: no policies => no access except service role.

-- ---------------------------------------------------------------------
-- Public views (security_invoker => underlying RLS applies)
-- ---------------------------------------------------------------------

-- A listing price may be DISPLAYED only when it is verified (has a check
-- timestamp), fresh enough for the merchant's policy, and either sourced
-- from an approved API/feed or the merchant permits manual prices.
create or replace view public.v_listings
with (security_invoker = true)
as
select
  l.*,
  m.slug as merchant_slug,
  m.name as merchant_name,
  m.logo_url as merchant_logo_url,
  m.logo_usage_permitted as merchant_logo_usage_permitted,
  m.brand_color as merchant_brand_color,
  m.disclosure_text as merchant_disclosure_text,
  m.is_active as merchant_is_active,
  m.price_max_age_hours as merchant_price_max_age_hours,
  (
    l.current_price is not null
    and l.price_checked_at is not null
    and (m.price_max_age_hours is null or l.price_checked_at > now() - make_interval(hours => m.price_max_age_hours))
    and (l.price_source <> 'manual' or m.allow_manual_prices)
  ) as price_displayable
from public.product_listings l
join public.merchants m on m.id = l.merchant_id;

create or replace view public.v_product_cards
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.short_description,
  p.status,
  p.is_featured,
  p.is_trending,
  p.trending_reason,
  p.published_at,
  p.updated_at,
  p.popularity_score,
  p.search_vector,
  p.category_id,
  p.brand_id,
  c.slug as category_slug,
  c.name as category_name,
  b.name as brand_name,
  img.url as image_url,
  img.alt_text as image_alt,
  img.source as image_source,
  best.id as best_listing_id,
  best.merchant_id as best_merchant_id,
  best.merchant_name as best_merchant_name,
  best.merchant_slug as best_merchant_slug,
  best.affiliate_url as best_affiliate_url,
  case when best.price_displayable then best.current_price end as best_price,
  case when best.price_displayable then best.previous_price end as best_previous_price,
  case when best.price_displayable then best.price_checked_at end as best_price_checked_at,
  best.availability as best_availability,
  coalesce(agg.merchant_slugs, '{}') as merchant_slugs,
  coalesce(agg.listing_count, 0) as listing_count
from public.products p
left join public.categories c on c.id = p.category_id
left join public.brands b on b.id = p.brand_id
left join lateral (
  select i.url, i.alt_text, i.source
  from public.product_images i
  where i.product_id = p.id
  order by i.sort_order, i.created_at
  limit 1
) img on true
left join lateral (
  select vl.*
  from public.v_listings vl
  where vl.product_id = p.id and vl.is_active and vl.merchant_is_active
  order by vl.price_displayable desc, vl.current_price asc nulls last, vl.sort_order, vl.created_at
  limit 1
) best on true
left join lateral (
  select array_agg(distinct vl.merchant_slug) as merchant_slugs, count(*)::integer as listing_count
  from public.v_listings vl
  where vl.product_id = p.id and vl.is_active and vl.merchant_is_active
) agg on true;

grant select on public.v_listings to anon, authenticated;
grant select on public.v_product_cards to anon, authenticated;

-- ---------------------------------------------------------------------
-- Service-role-only functions: rate limiting & view counting
-- ---------------------------------------------------------------------
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_hits integer;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.hits + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end
  returning hits into current_hits;

  -- Opportunistic cleanup of stale keys.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return current_hits <= p_max;
end;
$$;

create or replace function public.track_content_view(p_entity_type text, p_entity_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.content_views_daily as cv (entity_type, entity_id, day, views)
  values (p_entity_type, p_entity_id, (now() at time zone 'Asia/Kolkata')::date, 1)
  on conflict (entity_type, entity_id, day) do update set views = cv.views + 1;

  if p_entity_type = 'product' then
    update public.products set view_count = view_count + 1 where id = p_entity_id;
  elsif p_entity_type = 'blog_post' then
    update public.blog_posts set view_count = view_count + 1 where id = p_entity_id;
  end if;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.track_content_view(text, uuid) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
grant execute on function public.track_content_view(text, uuid) to service_role;

-- ---------------------------------------------------------------------
-- Staff analytics functions (security invoker + explicit staff check)
-- ---------------------------------------------------------------------
create or replace function public.admin_overview_stats()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'products_total', (select count(*) from public.products),
    'products_published', (select count(*) from public.products where status = 'published'),
    'categories_total', (select count(*) from public.categories),
    'merchants_total', (select count(*) from public.merchants),
    'merchants_active', (select count(*) from public.merchants where is_active),
    'listings_total', (select count(*) from public.product_listings),
    'listings_active', (select count(*) from public.product_listings where is_active),
    'posts_published', (select count(*) from public.blog_posts where status in ('published', 'scheduled') and published_at <= now()),
    'posts_drafts', (select count(*) from public.blog_posts where status in ('draft', 'in_review')),
    'offers_live', (select count(*) from public.offers where status = 'published' and (expires_at is null or expires_at > now())),
    'clicks_total', (select count(*) from public.affiliate_click_events where not is_suspected_bot),
    'clicks_30d', (select count(*) from public.affiliate_click_events where not is_suspected_bot and created_at > now() - interval '30 days'),
    'clicks_7d', (select count(*) from public.affiliate_click_events where not is_suspected_bot and created_at > now() - interval '7 days'),
    'users_total', (select count(*) from public.profiles),
    'subscribers_total', (select count(*) from public.newsletter_subscribers where status = 'subscribed'),
    'messages_new', (select count(*) from public.contact_messages where status = 'new')
  );
end;
$$;

create or replace function public.admin_click_trend(p_days integer default 30)
returns table (day date, clicks bigint)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select d::date as day, count(e.id) as clicks
    from generate_series(
      (now() at time zone 'Asia/Kolkata')::date - (least(greatest(p_days, 1), 365) - 1),
      (now() at time zone 'Asia/Kolkata')::date,
      interval '1 day'
    ) d
    left join public.affiliate_click_events e
      on (e.created_at at time zone 'Asia/Kolkata')::date = d::date and not e.is_suspected_bot
    group by d
    order by d;
end;
$$;

create or replace function public.admin_clicks_by_merchant(p_days integer default 30)
returns table (merchant_id uuid, merchant_name text, clicks bigint)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select m.id, m.name, count(e.id) as clicks
    from public.affiliate_click_events e
    join public.merchants m on m.id = e.merchant_id
    where e.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
      and not e.is_suspected_bot
    group by m.id, m.name
    order by clicks desc;
end;
$$;

create or replace function public.admin_top_clicked_products(p_days integer default 30, p_limit integer default 10)
returns table (product_id uuid, product_name text, product_slug text, clicks bigint)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select p.id, p.name, p.slug::text, count(e.id) as clicks
    from public.affiliate_click_events e
    join public.products p on p.id = e.product_id
    where e.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
      and not e.is_suspected_bot
    group by p.id, p.name, p.slug
    order by clicks desc
    limit least(greatest(p_limit, 1), 100);
end;
$$;

create or replace function public.admin_clicks_by_source(p_days integer default 30)
returns table (source_component text, clicks bigint)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select coalesce(e.source_component, 'unknown'), count(e.id) as clicks
    from public.affiliate_click_events e
    where e.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
      and not e.is_suspected_bot
    group by 1
    order by clicks desc;
end;
$$;

create or replace function public.admin_top_search_terms(p_days integer default 30, p_limit integer default 20)
returns table (term text, searches bigint, avg_results numeric)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select s.normalized_query, count(*) as searches, round(avg(s.results_count), 1) as avg_results
    from public.search_queries s
    where s.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
    group by s.normalized_query
    order by searches desc
    limit least(greatest(p_limit, 1), 100);
end;
$$;

create or replace function public.admin_popular_content(p_entity_type text, p_days integer default 30, p_limit integer default 10)
returns table (entity_id uuid, views bigint)
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select cv.entity_id, sum(cv.views)::bigint as views
    from public.content_views_daily cv
    where cv.entity_type = p_entity_type
      and cv.day > (now() at time zone 'Asia/Kolkata')::date - least(greatest(p_days, 1), 365)
    group by cv.entity_id
    order by views desc
    limit least(greatest(p_limit, 1), 100);
end;
$$;

revoke execute on function public.admin_overview_stats() from public, anon;
revoke execute on function public.admin_click_trend(integer) from public, anon;
revoke execute on function public.admin_clicks_by_merchant(integer) from public, anon;
revoke execute on function public.admin_top_clicked_products(integer, integer) from public, anon;
revoke execute on function public.admin_clicks_by_source(integer) from public, anon;
revoke execute on function public.admin_top_search_terms(integer, integer) from public, anon;
revoke execute on function public.admin_popular_content(text, integer, integer) from public, anon;
grant execute on function public.admin_overview_stats() to authenticated;
grant execute on function public.admin_click_trend(integer) to authenticated;
grant execute on function public.admin_clicks_by_merchant(integer) to authenticated;
grant execute on function public.admin_top_clicked_products(integer, integer) to authenticated;
grant execute on function public.admin_clicks_by_source(integer) to authenticated;
grant execute on function public.admin_top_search_terms(integer, integer) to authenticated;
grant execute on function public.admin_popular_content(text, integer, integer) to authenticated;

-- Trigger/internal functions must not be callable via the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.recently_viewed_trim() from public, anon, authenticated;
revoke execute on function public.affiliate_click_increment_counters() from public, anon, authenticated;
