-- =====================================================================
-- New Life Tagum — Seed data
-- All content is editable placeholder material (is_placeholder = true where
-- the column exists). No real staff names, bank details, contact numbers,
-- payment info, or real event dates are invented.
-- =====================================================================

-- ----- site settings --------------------------------------------------

insert into public.site_settings (key, value) values
  ('branding', jsonb_build_object(
    'churchName', 'New Life Tagum',
    'tagline', 'A welcoming family of faith in the heart of Tagum.',
    'logoUrl', null,
    'accentColor', 'brand'
  )),
  ('contact', jsonb_build_object(
    'address', '1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte',
    'email', '[placeholder] hello@example.org',
    'phone', '[placeholder] add a contact number',
    'mapsDirectionsUrl', 'https://www.google.com/maps/dir/?api=1&destination=1489+Manuel+B.+Suaybaguio+Sr.+St,+Tagum,+Davao+del+Norte'
  )),
  ('socials', jsonb_build_object(
    'facebook', '',
    'youtube', '',
    'instagram', ''
  )),
  ('serviceSummary', jsonb_build_object(
    'text', 'Sunday Worship — placeholder times below. Edit in Services.'
  )),
  ('live', jsonb_build_object(
    'isLive', false,
    'watchUrl', ''
  )),
  ('seo', jsonb_build_object(
    'defaultTitle', 'New Life Tagum',
    'titleTemplate', '%s · New Life Tagum',
    'description', 'New Life Tagum — a welcoming, Christ-centered community in Tagum, Davao del Norte.'
  ))
on conflict (key) do nothing;

-- ----- navigation (header dropdowns + footer quick links) -------------
-- Top-level header items; dropdown children reference parent_id.

with ins as (
  insert into public.navigation_items (label, href, position, location) values
    ('Home', '/', 0, 'header'),
    ('About', null, 1, 'header'),
    ('Services', '/services', 2, 'header'),
    ('Events', '/events', 3, 'header'),
    ('Ministries', '/ministries', 4, 'header'),
    ('More', null, 5, 'header')
  returning id, label
)
insert into public.navigation_items (label, href, parent_id, position, location)
select c.label, c.href, ins.id, c.position, 'header'
from ins
join (values
  ('About', 'Who We Are', '/who-we-are', 0),
  ('About', 'Mission & Vision', '/mission-vision', 1),
  ('More', 'Posts', '/posts', 0),
  ('More', 'Pledge', '/pledge', 1),
  ('More', 'Merch', '/merch', 2)
) as c(parent_label, label, href, position) on c.parent_label = ins.label;

insert into public.navigation_items (label, href, position, location) values
  ('Plan Your Visit', '/get-connected', 0, 'footer_quick'),
  ('Services', '/services', 1, 'footer_quick'),
  ('Events', '/events', 2, 'footer_quick'),
  ('Ministries', '/ministries', 3, 'footer_quick'),
  ('Posts', '/posts', 4, 'footer_quick'),
  ('Give', '/pledge', 5, 'footer_quick');

-- ----- pages + blocks -------------------------------------------------

insert into public.pages (slug, title, status, is_system, is_placeholder, seo_title, seo_description, published_at)
values
  ('home', 'Home', 'published', true, true, 'New Life Tagum', 'A welcoming, Christ-centered community in Tagum.', now()),
  ('who-we-are', 'Who We Are', 'published', false, true, 'Who We Are', 'Our story, leadership, and what we believe.', now()),
  ('mission-vision', 'Mission & Vision', 'published', false, true, 'Mission & Vision', 'Our mission, vision, and core values.', now()),
  ('services', 'Services', 'published', true, true, 'Services', 'Service times, live stream, and past sermons.', now()),
  ('events', 'Events', 'published', true, true, 'Events', 'Upcoming gatherings and events.', now()),
  ('ministries', 'Ministries', 'published', true, true, 'Ministries', 'Find your place to belong and serve.', now()),
  ('posts', 'Posts', 'published', true, true, 'Posts', 'News, stories, and updates.', now()),
  ('pledge', 'Pledge', 'published', true, true, 'Pledge & Giving', 'Support the mission of New Life Tagum.', now()),
  ('get-connected', 'Get Connected', 'published', true, true, 'Get Connected', 'New here? Let''s connect.', now()),
  ('merch', 'Merch', 'published', true, true, 'Merch', 'Fundraising merchandise catalog.', now()),
  ('privacy', 'Privacy Policy', 'published', true, true, 'Privacy Policy', 'How we handle your personal data.', now()),
  ('terms', 'Terms of Use', 'published', true, true, 'Terms of Use', 'Terms governing use of this site.', now())
on conflict (slug) do nothing;

-- Home page blocks
insert into public.page_blocks (page_id, block_type, position, data)
select p.id, b.block_type, b.position, b.data
from public.pages p
cross join (values
  ('hero', 0, jsonb_build_object(
    'eyebrow', 'Welcome to',
    'heading', 'New Life Tagum',
    'subheading', 'A welcoming family of faith in the heart of Tagum. However you arrive, you belong here.',
    'alignment', 'center',
    'primaryCta', jsonb_build_object('label', 'Plan Your Visit', 'href', '/get-connected'),
    'secondaryCta', jsonb_build_object('label', 'Watch Live', 'href', '/services')
  )),
  ('rich_text', 1, jsonb_build_object(
    'width', 'narrow',
    'html', '<h2>You''re welcome here</h2><p>This is placeholder copy. Edit this section in the admin dashboard to share a warm welcome and what a first visit looks like.</p>'
  )),
  ('schedule', 2, jsonb_build_object('heading', 'Service Times', 'intro', 'Join us this week.')),
  ('map_location', 3, jsonb_build_object(
    'heading', 'Find Us',
    'addressLine', '1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte'
  )),
  ('event_list', 4, jsonb_build_object('heading', 'Upcoming Events', 'limit', 3)),
  ('ministry_cards', 5, jsonb_build_object('heading', 'Ministries', 'intro', 'Find your place.', 'limit', 3)),
  ('post_list', 6, jsonb_build_object('heading', 'Latest Posts', 'limit', 3)),
  ('cta_banner', 7, jsonb_build_object(
    'heading', 'Take your next step',
    'body', 'We''d love to meet you. Tell us a little about yourself and we''ll be in touch.',
    'primaryCta', jsonb_build_object('label', 'Get Connected', 'href', '/get-connected')
  ))
) as b(block_type, position, data)
where p.slug = 'home';

-- Who We Are blocks
insert into public.page_blocks (page_id, block_type, position, data)
select p.id, b.block_type, b.position, b.data
from public.pages p
cross join (values
  ('hero', 0, jsonb_build_object('eyebrow', 'About', 'heading', 'Who We Are', 'alignment', 'left',
     'subheading', 'Placeholder introduction — edit in the dashboard.')),
  ('rich_text', 1, jsonb_build_object('width', 'narrow',
     'html', '<h2>Our Story</h2><p>Placeholder story copy. Replace with the history of New Life Tagum.</p><h2>What We Believe</h2><p>Placeholder beliefs and values.</p>')),
  ('cta_banner', 2, jsonb_build_object('heading', 'Come visit us',
     'primaryCta', jsonb_build_object('label', 'Get Connected', 'href', '/get-connected')))
) as b(block_type, position, data)
where p.slug = 'who-we-are';

-- Mission & Vision blocks
insert into public.page_blocks (page_id, block_type, position, data)
select p.id, b.block_type, b.position, b.data
from public.pages p
cross join (values
  ('hero', 0, jsonb_build_object('eyebrow', 'About', 'heading', 'Mission & Vision', 'alignment', 'left')),
  ('rich_text', 1, jsonb_build_object('width', 'narrow',
     'html', '<h2>Our Mission</h2><p>Placeholder mission statement.</p><h2>Our Vision</h2><p>Placeholder vision statement.</p><h2>Core Values</h2><ul><li>Placeholder value one</li><li>Placeholder value two</li><li>Placeholder value three</li></ul>')),
  ('quote', 2, jsonb_build_object('quote', 'Placeholder scripture reference — edit in the dashboard.', 'attribution', 'Scripture'))
) as b(block_type, position, data)
where p.slug = 'mission-vision';

-- Simple system page content for privacy + terms
insert into public.page_blocks (page_id, block_type, position, data)
select p.id, 'hero', 0, jsonb_build_object('heading', p.title, 'alignment', 'left')
from public.pages p where p.slug in ('privacy', 'terms');

insert into public.page_blocks (page_id, block_type, position, data)
select p.id, 'rich_text', 1, jsonb_build_object('width', 'narrow',
  'html', '<p>This is placeholder ' || p.title || ' content. Replace with your church''s policy text in the admin dashboard.</p>')
from public.pages p where p.slug in ('privacy', 'terms');

-- ----- post categories + sample posts ---------------------------------

insert into public.post_categories (slug, name, description) values
  ('news', 'News', 'Church news and announcements'),
  ('stories', 'Stories', 'Stories from our community'),
  ('teaching', 'Teaching', 'Devotionals and teaching')
on conflict (slug) do nothing;

insert into public.posts (slug, title, excerpt, content_html, status, is_featured, is_placeholder, comments_enabled, published_at)
values
  ('welcome-to-new-life-tagum', 'Welcome to New Life Tagum',
   'A placeholder post introducing our church and this website.',
   '<p>This is a placeholder post. Edit or delete it from the admin dashboard. Comments are disabled by default and can be enabled per post.</p>',
   'published', true, true, false, now() - interval '2 days'),
  ('what-to-expect-on-a-sunday', 'What to Expect on a Sunday',
   'A placeholder guide for first-time guests.',
   '<p>Placeholder content describing a typical Sunday. Replace this with real details.</p>',
   'published', false, true, false, now() - interval '5 days')
on conflict (slug) do nothing;

insert into public.post_category_assignments (post_id, category_id)
select p.id, c.id from public.posts p, public.post_categories c
where p.slug = 'welcome-to-new-life-tagum' and c.slug = 'news'
on conflict do nothing;

-- ----- service schedules (placeholder times) --------------------------

-- (service_schedules has no is_placeholder column; placeholder noted in title)
insert into public.service_schedules (title, day_of_week, start_time, end_time, location, audience, position)
values
  ('Sunday Worship (Placeholder)', 0, '09:00', '10:30', 'Main Auditorium', 'Everyone', 0),
  ('Sunday Worship (Placeholder)', 0, '16:00', '17:30', 'Main Auditorium', 'Everyone', 1),
  ('Midweek Gathering (Placeholder)', 3, '18:30', '20:00', 'Main Auditorium', 'Everyone', 2);

-- ----- sermons (placeholder) ------------------------------------------

insert into public.sermons (slug, title, speaker, preached_on, provider, video_url, published, position)
values
  ('placeholder-sermon-1', 'Placeholder Sermon Title', '[Placeholder Speaker]', current_date - 7, 'youtube', '', true, 0),
  ('placeholder-sermon-2', 'Another Placeholder Sermon', '[Placeholder Speaker]', current_date - 14, 'youtube', '', true, 1);

-- ----- events (placeholder, relative future dates) --------------------

insert into public.events (slug, title, description_html, start_at, end_at, venue, address, is_public, rsvp_enabled, guest_rsvp_allowed, rsvp_capacity, category, is_featured, status, is_placeholder)
values
  ('placeholder-community-night', 'Community Night (Placeholder)',
   '<p>Placeholder event description. Edit in the dashboard.</p>',
   now() + interval '10 days', now() + interval '10 days' + interval '2 hours',
   'Main Auditorium', '1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte',
   true, true, true, 100, 'Gathering', true, 'published', true),
  ('placeholder-prayer-morning', 'Prayer Morning (Placeholder)',
   '<p>Placeholder event description.</p>',
   now() + interval '24 days', now() + interval '24 days' + interval '90 minutes',
   'Prayer Room', '1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte',
   true, false, false, null, 'Prayer', false, 'published', true)
on conflict (slug) do nothing;

-- ----- NLT Anniversary 2026 (reserved-seating event) ------------------
-- Real event with the seat map enabled. guest_rsvp_allowed doubles as
-- "allow non-members to book"; seating_enabled turns on the seat picker.

insert into public.events (
  slug, title, description_html, start_at, end_at, venue, address,
  is_public, rsvp_enabled, guest_rsvp_allowed, seating_enabled,
  category, is_featured, status, is_placeholder
)
values
  ('nlt-anniversary-2026', 'NLT Anniversary 2026',
   '<p>Celebrate another year of God''s faithfulness with the New Life Tagum family. Join us for a night of worship, testimony, and thanksgiving as we mark our church anniversary together.</p><p>Seating is reserved — pick your seat below to secure your spot. Payment is settled at the venue for now.</p>',
   timestamptz '2026-09-20 17:00:00+08', timestamptz '2026-09-20 20:00:00+08',
   'Main Auditorium', '1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte',
   true, false, true, true,
   'Anniversary', true, 'published', false)
on conflict (slug) do nothing;

-- ----- ministries -----------------------------------------------------

insert into public.ministries (slug, name, short_description, long_description_html, leader_name, meeting_schedule, location, published, is_placeholder, position)
values
  ('young-adults', 'Young Adults', 'Community for young adults navigating faith, work, and life.',
   '<p>Placeholder description for the Young Adults ministry.</p>', '[Placeholder Leader]', 'Placeholder schedule', 'Main Campus', true, true, 0),
  ('kids', 'Kids', 'A safe, fun place for children to learn about Jesus.',
   '<p>Placeholder description for Kids ministry.</p>', '[Placeholder Leader]', 'Sundays during service', 'Kids Room', true, true, 1),
  ('youth', 'Youth', 'Helping teenagers grow in faith and friendship.',
   '<p>Placeholder description for Youth ministry.</p>', '[Placeholder Leader]', 'Placeholder schedule', 'Youth Room', true, true, 2)
on conflict (slug) do nothing;

-- ----- pledge campaign + bank account (clearly placeholder) -----------

insert into public.pledge_campaigns (slug, title, description_html, goal_amount, start_date, end_date, status, is_featured, is_placeholder, position)
values
  ('building-fund', 'Building Fund (Placeholder)',
   '<p>Placeholder campaign description. Edit goal, dates, and details in the dashboard.</p>',
   1000000, current_date - 30, current_date + 120, 'active', true, true, 0)
on conflict (slug) do nothing;

insert into public.bank_accounts (bank_name, account_name, account_number, instructions, active, is_placeholder, position)
values
  ('[Placeholder Bank]', '[Placeholder Account Name]', '0000-0000-0000',
   'Placeholder instructions. Replace with real bank transfer details in the dashboard. Payments are never automatically verified.',
   true, true, 0);

-- ----- connection (Get Connected) forms -------------------------------

with f as (
  insert into public.connection_forms (slug, title, intro, success_message, store_submissions, enabled, position) values
    ('im-new', 'I''m New', 'Tell us a little about yourself and we''ll reach out.', 'Thanks! We''ll be in touch soon.', true, true, 0),
    ('prayer-request', 'Prayer Request', 'We''d be honored to pray with you.', 'Thank you. Our team will be praying.', true, true, 1),
    ('volunteer', 'Volunteer Interest', 'Interested in serving? Let us know.', 'Thanks for your heart to serve!', true, true, 2),
    ('join-ministry', 'Join a Ministry', 'Find your place to belong.', 'Thanks! We''ll connect you with a leader.', true, true, 3),
    ('contact', 'General Contact', 'Questions? Send us a message.', 'Thanks for reaching out!', true, true, 4)
  returning id, slug
)
insert into public.connection_form_fields (form_id, label, field_key, field_type, required, position, options)
select f.id, x.label, x.field_key, x.field_type::public.form_field_type, x.required, x.position, x.options
from f
join (values
  ('im-new', 'Full name', 'full_name', 'short_text', true, 0, '[]'::jsonb),
  ('im-new', 'Email', 'email', 'email', true, 1, '[]'::jsonb),
  ('im-new', 'Phone', 'phone', 'phone', false, 2, '[]'::jsonb),
  ('im-new', 'Anything you''d like us to know?', 'message', 'long_text', false, 3, '[]'::jsonb),
  ('im-new', 'I agree to be contacted', 'consent', 'consent', true, 4, '[]'::jsonb),
  ('prayer-request', 'Full name', 'full_name', 'short_text', false, 0, '[]'::jsonb),
  ('prayer-request', 'Email', 'email', 'email', false, 1, '[]'::jsonb),
  ('prayer-request', 'Your prayer request', 'message', 'long_text', true, 2, '[]'::jsonb),
  ('prayer-request', 'Keep this private to the prayer team', 'private', 'checkbox', false, 3, '[]'::jsonb),
  ('volunteer', 'Full name', 'full_name', 'short_text', true, 0, '[]'::jsonb),
  ('volunteer', 'Email', 'email', 'email', true, 1, '[]'::jsonb),
  ('volunteer', 'Area of interest', 'area', 'select', false, 2, '["Hospitality","Kids","Youth","Worship","Media","Prayer"]'::jsonb),
  ('volunteer', 'I agree to be contacted', 'consent', 'consent', true, 3, '[]'::jsonb),
  ('join-ministry', 'Full name', 'full_name', 'short_text', true, 0, '[]'::jsonb),
  ('join-ministry', 'Email', 'email', 'email', true, 1, '[]'::jsonb),
  ('join-ministry', 'Which ministry?', 'ministry', 'select', true, 2, '["Young Adults","Kids","Youth"]'::jsonb),
  ('join-ministry', 'I agree to be contacted', 'consent', 'consent', true, 3, '[]'::jsonb),
  ('contact', 'Full name', 'full_name', 'short_text', true, 0, '[]'::jsonb),
  ('contact', 'Email', 'email', 'email', true, 1, '[]'::jsonb),
  ('contact', 'Message', 'message', 'long_text', true, 2, '[]'::jsonb)
) as x(form_slug, label, field_key, field_type, required, position, options) on x.form_slug = f.slug;

-- ----- merch (placeholder) --------------------------------------------

insert into public.merch_items (slug, title, description_html, price_display, suggested_donation, category, availability_label, contact_to_order, status, is_placeholder, position)
values
  ('placeholder-tee', 'New Life Tee (Placeholder)', '<p>Placeholder product description.</p>', '₱350 suggested donation', 350, 'Apparel', 'Available', true, 'published', true, 0),
  ('placeholder-mug', 'New Life Mug (Placeholder)', '<p>Placeholder product description.</p>', '₱200 suggested donation', 200, 'Drinkware', 'Limited', true, 'published', true, 1)
on conflict (slug) do nothing;
