import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Adopt pre-migration installations without dropping tables or losing user data.
  for (const [table, names] of Object.entries({users:['reset_password_requested_at'],products:['english_title','english_description'],categories:['english_title','english_description']})) {
    const columns = await db.all<{name:string}>(sql.raw(`PRAGMA table_info(${table})`))
    if (!columns.length) continue
    for (const name of names) if (!columns.some(column => column.name === name)) await db.run(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${name} text`))
  }
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`users\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`email\` text NOT NULL,
  	\`reset_password_token\` text,
  	\`reset_password_expiration\` text,
  	\`salt\` text,
  	\`hash\` text,
  	\`reset_password_requested_at\` text,
  	\`login_attempts\` numeric DEFAULT 0,
  	\`lock_until\` text
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`users_created_at_idx\` ON \`users\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`users_email_idx\` ON \`users\` (\`email\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`caption\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumb_url\` text,
  	\`sizes_thumb_width\` numeric,
  	\`sizes_thumb_height\` numeric,
  	\`sizes_thumb_mime_type\` text,
  	\`sizes_thumb_filesize\` numeric,
  	\`sizes_thumb_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`media_created_at_idx\` ON \`media\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`media_filename_idx\` ON \`media\` (\`filename\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`media_sizes_thumb_sizes_thumb_filename_idx\` ON \`media\` (\`sizes_thumb_filename\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`english_title\` text,
  	\`english_description\` text,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`description\` text,
  	\`sort_order\` numeric DEFAULT 100,
  	\`is_active\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`products_specifications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`value\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_specifications_order_idx\` ON \`products_specifications\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_specifications_parent_id_idx\` ON \`products_specifications\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`products\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`english_title\` text,
  	\`english_description\` text,
  	\`title\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`article_number\` text NOT NULL,
  	\`category_id\` integer NOT NULL,
  	\`short_description\` text NOT NULL,
  	\`long_description\` text,
  	\`is_active\` integer DEFAULT true,
  	\`availability_status\` text DEFAULT 'available' NOT NULL,
  	\`pricing_daily_price\` numeric NOT NULL,
  	\`pricing_three_day_price\` numeric NOT NULL,
  	\`pricing_weekly_price\` numeric NOT NULL,
  	\`pricing_minimum_rental_days\` numeric DEFAULT 1,
  	\`pricing_deposit\` numeric,
  	\`pricing_cleaning_fee\` numeric,
  	\`pricing_insurance_required\` integer DEFAULT true,
  	\`pricing_insurance_rate_override\` numeric,
  	\`pricing_price_note\` text,
  	\`pricing_consumable_cost_note\` text DEFAULT 'Preise exklusive Treibstoff und Verschleißkosten.',
  	\`seo_meta_title\` text,
  	\`seo_meta_description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`products_slug_idx\` ON \`products\` (\`slug\`);`)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`products_article_number_idx\` ON \`products\` (\`article_number\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_category_idx\` ON \`products\` (\`category_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_created_at_idx\` ON \`products\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`products_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_rels_order_idx\` ON \`products_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_rels_parent_idx\` ON \`products_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_rels_path_idx\` ON \`products_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`products_rels_media_id_idx\` ON \`products_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`requests\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`request_number\` text NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`product_id\` integer NOT NULL,
  	\`product_snapshot_title\` text NOT NULL,
  	\`product_snapshot_slug\` text NOT NULL,
  	\`product_snapshot_article_number\` text NOT NULL,
  	\`product_snapshot_prices_daily_price\` numeric NOT NULL,
  	\`product_snapshot_prices_three_day_price\` numeric NOT NULL,
  	\`product_snapshot_prices_weekly_price\` numeric NOT NULL,
  	\`customer_name\` text NOT NULL,
  	\`customer_email\` text NOT NULL,
  	\`customer_phone\` text,
  	\`rental_start\` text,
  	\`rental_end\` text,
  	\`rental_days\` numeric,
  	\`pricing_summary\` text NOT NULL,
  	\`message\` text,
  	\`email_result\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`requests_request_number_idx\` ON \`requests\` (\`request_number\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`requests_product_idx\` ON \`requests\` (\`product_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`requests_updated_at_idx\` ON \`requests\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`requests_created_at_idx\` ON \`requests\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`categories_id\` integer,
  	\`products_id\` integer,
  	\`requests_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`requests_id\`) REFERENCES \`requests\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_products_id_idx\` ON \`payload_locked_documents_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_requests_id_idx\` ON \`payload_locked_documents_rels\` (\`requests_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`rental_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`company_name\` text DEFAULT 'Alles Saniert',
  	\`hero_headline\` text,
  	\`hero_text\` text,
  	\`default_insurance_rate\` numeric DEFAULT 0.1 NOT NULL,
  	\`insurance_mandatory\` integer DEFAULT true,
  	\`request_notification_email\` text DEFAULT 'office@allessaniert.at' NOT NULL,
  	\`price_disclaimer\` text DEFAULT 'Geräteversicherung ist verpflichtend (10% der Miete). Preise exklusive Treibstoff und Verschleißkosten.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'Alles Saniert' NOT NULL,
  	\`website_url\` text DEFAULT 'https://www.allessaniert.at' NOT NULL,
  	\`default_locale\` text DEFAULT 'de' NOT NULL,
  	\`seo_meta_title_de\` text DEFAULT 'Schröder - Alles Saniert | Werkzeugverleih und Forstarbeiten',
  	\`seo_meta_description_de\` text DEFAULT 'Werkzeugverleih und Dienstleistungen von Schröder - Alles Saniert in Pernitz. Professionelle Maschinen, faire Tarife und Anfrage-Checkout ohne Online-Zahlung.',
  	\`seo_meta_title_en\` text DEFAULT 'Schröder - Alles Saniert | Tool Rental and Forestry Services',
  	\`seo_meta_description_en\` text DEFAULT 'Tool rental and services by Schröder - Alles Saniert in Pernitz, Austria. Professional equipment, transparent rates and request-based checkout.',
  	\`seo_robots_policy\` text DEFAULT 'index_follow',
  	\`tracking_gtm_id\` text,
  	\`tracking_ga4_measurement_id\` text,
  	\`homepage_popular_section_title_de\` text DEFAULT 'Beliebte Produkte',
  	\`homepage_popular_section_subtitle_de\` text DEFAULT 'Die Favoriten unserer Kunden diese Woche.',
  	\`homepage_popular_section_title_en\` text DEFAULT 'Popular Products',
  	\`homepage_popular_section_subtitle_en\` text DEFAULT 'Top picks from our customers this week.',
  	\`catalog_headline_de\` text DEFAULT 'Werkzeuge & Maschinen',
  	\`catalog_headline_en\` text DEFAULT 'Tools & Machines',
  	\`catalog_intro_de\` text DEFAULT 'Alle Inhalte werden aus Payload CMS geladen. Sie können direkt nach Kategorien und Begriffen filtern.',
  	\`catalog_intro_en\` text DEFAULT 'Find the right equipment by category or search term.',
  	\`catalog_search_placeholder_de\` text DEFAULT 'Werkzeug suchen...',
  	\`catalog_search_placeholder_en\` text DEFAULT 'Search tools...',
  	\`catalog_categories_title_de\` text DEFAULT 'Kategorien',
  	\`catalog_categories_title_en\` text DEFAULT 'Categories',
  	\`catalog_products_title_de\` text DEFAULT 'Produkte',
  	\`catalog_products_title_en\` text DEFAULT 'Products',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`site_settings_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`products_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`products_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`site_settings_rels_order_idx\` ON \`site_settings_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`site_settings_rels_parent_idx\` ON \`site_settings_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`site_settings_rels_path_idx\` ON \`site_settings_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX IF NOT EXISTS \`site_settings_rels_products_id_idx\` ON \`site_settings_rels\` (\`products_id\`);`)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`contact_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`legal_company_name\` text DEFAULT 'Willy Schröder' NOT NULL,
  	\`brand_name\` text DEFAULT 'Alles Saniert' NOT NULL,
  	\`street\` text DEFAULT 'Fotzebenweg 3' NOT NULL,
  	\`postal_code\` text DEFAULT '2763' NOT NULL,
  	\`city\` text DEFAULT 'Pernitz' NOT NULL,
  	\`country\` text DEFAULT 'Österreich' NOT NULL,
  	\`phone\` text DEFAULT '+43 650 3021328' NOT NULL,
  	\`email\` text DEFAULT 'office@allessaniert.at' NOT NULL,
  	\`inquiry_recipient_email\` text DEFAULT 'office@allessaniert.at' NOT NULL,
  	\`service_description_de\` text DEFAULT 'Werkzeugverleih sowie Dienstleistungen inklusive Forstarbeiten.',
  	\`service_description_en\` text DEFAULT 'Tool rental and service work including forestry support.',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE TABLE IF NOT EXISTS \`legal_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`impressum_de\` text DEFAULT 'Firmenname: Willy Schröder
  Adresse: Fotzebenweg 3, 2763 Pernitz, Österreich
  Telefon: +43 650 3021328
  E-Mail: office@allessaniert.at
  Tätigkeit: Werkzeugverleih sowie Dienstleistungen inklusive Forstarbeiten' NOT NULL,
  	\`impressum_en\` text DEFAULT 'Company: Willy Schröder
  Address: Fotzebenweg 3, 2763 Pernitz, Austria
  Phone: +43 650 3021328
  Email: office@allessaniert.at
  Business: Tool rental and services including forestry work' NOT NULL,
  	\`privacy_de\` text DEFAULT 'Wir verarbeiten personenbezogene Daten ausschließlich auf Grundlage der DSGVO, des DSG und des TKG in Österreich.
  Kontaktanfragen werden zur Bearbeitung und zur Erfüllung vorvertraglicher Maßnahmen verarbeitet.
  Es werden nur technisch notwendige Daten ohne Tracking verarbeitet, solange keine Einwilligung für Analytics erteilt wurde.
  Betroffene Personen haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch.' NOT NULL,
  	\`privacy_en\` text DEFAULT 'We process personal data only in accordance with the GDPR and applicable Austrian law.
  Contact requests are processed to handle inquiries and to perform pre-contractual steps.
  Only technically required data is processed unless analytics consent is provided.
  Data subjects have rights of access, rectification, erasure, restriction, portability and objection.' NOT NULL,
  	\`cookie_policy_de\` text DEFAULT 'Notwendige Cookies werden für den technischen Betrieb verwendet.
  Analytics-Cookies werden nur nach ausdrücklicher Einwilligung aktiviert.
  Sie können Ihre Einwilligung jederzeit auf der Seite Cookie-Einstellungen ändern oder widerrufen.' NOT NULL,
  	\`cookie_policy_en\` text DEFAULT 'Necessary cookies are used for technical operation.
  Analytics cookies are activated only after explicit consent.
  You can change or withdraw consent at any time on the Cookie Settings page.' NOT NULL,
  	\`accessibility_de\` text DEFAULT 'Wir arbeiten laufend daran, die Website gemäß WCAG 2.2 auf Niveau AA zu verbessern.
  Falls Sie Barrieren entdecken, senden Sie uns bitte eine Nachricht an office@allessaniert.at.' NOT NULL,
  	\`accessibility_en\` text DEFAULT 'We continuously improve this website in line with WCAG 2.2 level AA.
  If you encounter barriers, please contact us at office@allessaniert.at.' NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  throw new Error('Restore the verified SQLite backup to roll back this baseline; automatic table deletion is disabled.')
}
