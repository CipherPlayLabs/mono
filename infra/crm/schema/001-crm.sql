CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS business;
CREATE SCHEMA IF NOT EXISTS person;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS public_sources;
CREATE SCHEMA IF NOT EXISTS web_enrichment;
CREATE SCHEMA IF NOT EXISTS migration_backup;

CREATE OR REPLACE FUNCTION public.crm_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS business.websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  raw_input text,
  domain_type text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT websites_domain_type_check CHECK (
    domain_type IN ('unknown', 'business', 'email_provider')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS websites_domain_unique
  ON business.websites (lower(domain));

CREATE TABLE IF NOT EXISTS business.website_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  purpose text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business.website_list_memberships (
  website_id uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES business.website_lists(id) ON DELETE CASCADE,
  fit_score integer,
  membership_notes text,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (website_id, list_id),
  CONSTRAINT website_list_memberships_fit_score_check CHECK (
    fit_score IS NULL OR (fit_score >= 1 AND fit_score <= 100)
  )
);

CREATE TABLE IF NOT EXISTS person.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  first_name text,
  last_name text,
  organization text,
  role_title text,
  relationship_type text NOT NULL DEFAULT 'investor',
  relationship_stage text NOT NULL DEFAULT 'prospect',
  source_confidence text NOT NULL DEFAULT 'confirmed-user',
  investor_fit text,
  check_size_range text,
  warm_intro_source text,
  last_touch_at timestamptz,
  next_follow_up_at timestamptz,
  personalization_notes text,
  private_notes text,
  do_not_contact boolean NOT NULL DEFAULT false,
  owner text NOT NULL DEFAULT 'Allan',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT people_relationship_stage_check CHECK (
    relationship_stage IN ('prospect', 'warm', 'active', 'committed', 'passed', 'paused')
  ),
  CONSTRAINT people_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE TABLE IF NOT EXISTS person.email_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  local_part text NOT NULL,
  website_id uuid REFERENCES business.websites(id) ON DELETE SET NULL,
  address_kind text NOT NULL DEFAULT 'unknown',
  source_confidence text NOT NULL DEFAULT 'needs-verification',
  raw_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_addresses_address_kind_check CHECK (
    address_kind IN ('personal', 'role', 'unknown')
  ),
  CONSTRAINT email_addresses_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS email_addresses_email_unique
  ON person.email_addresses (lower(email));

CREATE INDEX IF NOT EXISTS email_addresses_website_idx
  ON person.email_addresses (website_id)
  WHERE website_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS person.person_email_addresses (
  person_id uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE,
  email_address_id uuid NOT NULL REFERENCES person.email_addresses(id) ON DELETE CASCADE,
  relationship_status text NOT NULL DEFAULT 'candidate',
  is_primary boolean NOT NULL DEFAULT false,
  source_confidence text NOT NULL DEFAULT 'needs-verification',
  association_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, email_address_id),
  CONSTRAINT person_email_addresses_relationship_status_check CHECK (
    relationship_status IN ('candidate', 'likely', 'claimed', 'rejected')
  ),
  CONSTRAINT person_email_addresses_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS person_email_addresses_primary_person_unique
  ON person.person_email_addresses (person_id)
  WHERE is_primary = true AND relationship_status != 'rejected';

CREATE INDEX IF NOT EXISTS person_email_addresses_email_idx
  ON person.person_email_addresses (email_address_id);

CREATE TABLE IF NOT EXISTS crm.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  audience_type text NOT NULL DEFAULT 'investor',
  purpose text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm.person_group_memberships (
  person_id uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES crm.groups(id) ON DELETE CASCADE,
  fit_score integer,
  membership_notes text,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, group_id),
  CONSTRAINT person_group_memberships_fit_score_check CHECK (
    fit_score IS NULL OR (fit_score >= 1 AND fit_score <= 5)
  )
);

CREATE TABLE IF NOT EXISTS crm.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  audience_group_id uuid REFERENCES crm.groups(id) ON DELETE SET NULL,
  campaign_type text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'draft',
  goal text NOT NULL,
  sender_identity text NOT NULL DEFAULT 'Allan',
  send_mode text NOT NULL DEFAULT 'operator_approved',
  subject_line text,
  proof_points text,
  call_to_action text,
  campaign_brief text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_status_check CHECK (
    status IN ('draft', 'reviewing', 'ready', 'sending', 'paused', 'completed', 'archived')
  ),
  CONSTRAINT campaigns_send_mode_check CHECK (
    send_mode IN ('draft_only', 'operator_approved', 'automatic')
  )
);

CREATE TABLE IF NOT EXISTS crm.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES crm.campaigns(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  personalization_angle text,
  draft_subject text,
  draft_body text,
  approval_notes text,
  send_after_at timestamptz,
  sent_at timestamptz,
  replied_at timestamptz,
  last_event_at timestamptz,
  n8n_execution_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, person_id),
  CONSTRAINT campaign_recipients_status_check CHECK (
    status IN ('queued', 'draft_ready', 'approved', 'sent', 'replied', 'bounced', 'skipped', 'paused')
  )
);

CREATE TABLE IF NOT EXISTS crm.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_recipient_id uuid REFERENCES crm.campaign_recipients(id) ON DELETE SET NULL,
  person_id uuid REFERENCES person.people(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  provider text,
  provider_message_id text,
  subject text,
  body_preview text,
  raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_events_event_type_check CHECK (
    event_type IN ('draft_created', 'approved', 'sent', 'reply_received', 'bounce', 'manual_note', 'skipped')
  )
);

CREATE TABLE IF NOT EXISTS crm.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES person.people(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES crm.campaigns(id) ON DELETE SET NULL,
  note_type text NOT NULL DEFAULT 'relationship',
  body text NOT NULL,
  source_confidence text NOT NULL DEFAULT 'confirmed-user',
  created_by text NOT NULL DEFAULT 'Allan',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notes_note_type_check CHECK (
    note_type IN ('relationship', 'campaign', 'call', 'email', 'research', 'todo')
  ),
  CONSTRAINT notes_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE TABLE IF NOT EXISTS crm.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES person.people(id) ON DELETE CASCADE,
  campaign_recipient_id uuid REFERENCES crm.campaign_recipients(id) ON DELETE SET NULL,
  task text NOT NULL,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  n8n_execution_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follow_ups_status_check CHECK (
    status IN ('open', 'done', 'snoozed', 'canceled')
  )
);

CREATE TABLE IF NOT EXISTS public_sources.founder_institute_directory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES person.people(id) ON DELETE SET NULL,
  identity_key text NOT NULL,
  identity_key_type text NOT NULL,
  display_name text NOT NULL,
  first_name text,
  last_name text,
  organization text,
  role_title text,
  linkedin_url text,
  profile_image_url text,
  specialization_name text NOT NULL,
  city_name text NOT NULL DEFAULT 'All',
  source_url text NOT NULL,
  source_page integer NOT NULL,
  source_position integer,
  card_text text,
  mentor_notes text,
  raw_card jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_confidence text NOT NULL DEFAULT 'private-sourced',
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fi_directory_entries_identity_key_type_check CHECK (
    identity_key_type IN ('linkedin_url', 'name_organization_role')
  ),
  CONSTRAINT fi_directory_entries_source_page_check CHECK (
    source_page >= 1
  ),
  CONSTRAINT fi_directory_entries_source_position_check CHECK (
    source_position IS NULL OR source_position >= 1
  ),
  CONSTRAINT fi_directory_entries_source_confidence_check CHECK (
    source_confidence IN ('private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS fi_directory_entries_source_unique
  ON public_sources.founder_institute_directory_entries (
    lower(identity_key),
    lower(specialization_name),
    lower(city_name)
  );

CREATE INDEX IF NOT EXISTS fi_directory_entries_specialization_idx
  ON public_sources.founder_institute_directory_entries (lower(specialization_name));

CREATE INDEX IF NOT EXISTS fi_directory_entries_linkedin_idx
  ON public_sources.founder_institute_directory_entries (lower(linkedin_url))
  WHERE linkedin_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS fi_directory_entries_person_idx
  ON public_sources.founder_institute_directory_entries (person_id)
  WHERE person_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public_sources.interview_source_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES person.people(id) ON DELETE SET NULL,
  source_row_number integer NOT NULL,
  source_name text NOT NULL,
  picture text,
  linkedin_url text,
  interview_status text NOT NULL,
  source_date_text text NOT NULL,
  interview_at timestamptz,
  contact_mode text,
  company text,
  role_title text,
  ecosystem_role text,
  email text,
  phone text,
  about text,
  interview_strategy text,
  interview_notes text,
  transcript text,
  jtbd_analysis text,
  industry text,
  source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_confidence text NOT NULL DEFAULT 'private-sourced',
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interview_source_entries_source_row_number_check CHECK (
    source_row_number >= 1
  ),
  CONSTRAINT interview_source_entries_source_confidence_check CHECK (
    source_confidence IN ('private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS interview_source_entries_row_unique
  ON public_sources.interview_source_entries (source_row_number);

CREATE INDEX IF NOT EXISTS interview_source_entries_email_idx
  ON public_sources.interview_source_entries (lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS interview_source_entries_linkedin_idx
  ON public_sources.interview_source_entries (lower(linkedin_url))
  WHERE linkedin_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS interview_source_entries_person_idx
  ON public_sources.interview_source_entries (person_id)
  WHERE person_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public_sources.http_archive_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_date date NOT NULL,
  client text NOT NULL DEFAULT 'desktop',
  query_name text NOT NULL,
  query_version text NOT NULL,
  bigquery_job_id text,
  n8n_execution_id text,
  status text NOT NULL DEFAULT 'running',
  row_count integer NOT NULL DEFAULT 0,
  query_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT http_archive_runs_client_check CHECK (
    client IN ('desktop', 'mobile')
  ),
  CONSTRAINT http_archive_runs_status_check CHECK (
    status IN ('running', 'completed', 'failed', 'archived')
  ),
  CONSTRAINT http_archive_runs_row_count_check CHECK (
    row_count >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS http_archive_runs_unique
  ON public_sources.http_archive_runs (crawl_date, client, lower(query_name), lower(query_version));

CREATE TABLE IF NOT EXISTS public_sources.http_archive_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public_sources.http_archive_runs(id) ON DELETE CASCADE,
  website_id uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE,
  query_name text NOT NULL,
  crawl_date date NOT NULL,
  client text NOT NULL DEFAULT 'desktop',
  primary_root_page_url text NOT NULL,
  best_rank integer,
  detected_origins integer NOT NULL DEFAULT 0,
  detected_pages integer NOT NULL DEFAULT 0,
  technologies text[] NOT NULL DEFAULT '{}'::text[],
  technology_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  technology_info jsonb NOT NULL DEFAULT '[]'::jsonb,
  sample_root_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  sample_pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT http_archive_observations_client_check CHECK (
    client IN ('desktop', 'mobile')
  ),
  CONSTRAINT http_archive_observations_counts_check CHECK (
    detected_origins >= 0 AND detected_pages >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS http_archive_observations_website_crawl_query_unique
  ON public_sources.http_archive_observations (
    website_id,
    crawl_date,
    client,
    lower(query_name)
  );

CREATE TABLE IF NOT EXISTS web_enrichment.website_shopify_status (
  website_id uuid PRIMARY KEY REFERENCES business.websites(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'unknown',
  checked_at timestamptz,
  check_attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  next_check_at timestamptz,
  detection_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  detection_error text,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT website_shopify_status_check CHECK (
    status IN ('unknown', 'true', 'false')
  ),
  CONSTRAINT website_shopify_status_attempts_check CHECK (
    check_attempts >= 0
  )
);

CREATE INDEX IF NOT EXISTS website_shopify_status_poll_idx
  ON web_enrichment.website_shopify_status (status, next_check_at, locked_at);

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_contacts'), to_regclass('public.crm_contacts_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_people$
      INSERT INTO person.people (
        id,
        display_name,
        first_name,
        last_name,
        organization,
        role_title,
        relationship_type,
        relationship_stage,
        source_confidence,
        investor_fit,
        check_size_range,
        warm_intro_source,
        last_touch_at,
        next_follow_up_at,
        personalization_notes,
        private_notes,
        do_not_contact,
        owner,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.display_name,
        legacy.first_name,
        legacy.last_name,
        legacy.organization,
        legacy.role_title,
        legacy.relationship_type,
        legacy.relationship_stage,
        legacy.source_confidence,
        legacy.investor_fit,
        legacy.check_size_range,
        legacy.warm_intro_source,
        legacy.last_touch_at,
        legacy.next_follow_up_at,
        legacy.personalization_notes,
        legacy.private_notes,
        legacy.do_not_contact,
        legacy.owner,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        organization = EXCLUDED.organization,
        role_title = EXCLUDED.role_title,
        relationship_type = EXCLUDED.relationship_type,
        relationship_stage = EXCLUDED.relationship_stage,
        source_confidence = EXCLUDED.source_confidence,
        investor_fit = EXCLUDED.investor_fit,
        check_size_range = EXCLUDED.check_size_range,
        warm_intro_source = EXCLUDED.warm_intro_source,
        last_touch_at = EXCLUDED.last_touch_at,
        next_follow_up_at = EXCLUDED.next_follow_up_at,
        personalization_notes = EXCLUDED.personalization_notes,
        private_notes = EXCLUDED.private_notes,
        do_not_contact = EXCLUDED.do_not_contact,
        owner = EXCLUDED.owner,
        updated_at = EXCLUDED.updated_at
    $copy_people$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_websites'), to_regclass('public.crm_websites_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_websites$
      INSERT INTO business.websites (
        id,
        domain,
        raw_input,
        domain_type,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.domain,
        legacy.raw_input,
        legacy.domain_type,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        domain = EXCLUDED.domain,
        raw_input = EXCLUDED.raw_input,
        domain_type = EXCLUDED.domain_type,
        updated_at = EXCLUDED.updated_at
    $copy_websites$, legacy_table);

    EXECUTE format($copy_shopify_status$
      INSERT INTO web_enrichment.website_shopify_status (
        website_id,
        status,
        checked_at,
        check_attempts,
        last_attempt_at,
        next_check_at,
        detection_signals,
        detection_error,
        locked_at,
        locked_by,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.shopify_status,
        legacy.shopify_checked_at,
        legacy.shopify_check_attempts,
        legacy.shopify_last_attempt_at,
        legacy.shopify_next_check_at,
        legacy.shopify_detection_signals,
        legacy.shopify_detection_error,
        legacy.enrichment_locked_at,
        legacy.enrichment_locked_by,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (website_id) DO UPDATE
      SET
        status = EXCLUDED.status,
        checked_at = EXCLUDED.checked_at,
        check_attempts = EXCLUDED.check_attempts,
        last_attempt_at = EXCLUDED.last_attempt_at,
        next_check_at = EXCLUDED.next_check_at,
        detection_signals = EXCLUDED.detection_signals,
        detection_error = EXCLUDED.detection_error,
        locked_at = EXCLUDED.locked_at,
        locked_by = EXCLUDED.locked_by,
        updated_at = EXCLUDED.updated_at
    $copy_shopify_status$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_email_addresses'), to_regclass('public.crm_email_addresses_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_email_domains$
      INSERT INTO business.websites AS website (domain, raw_input, domain_type)
      SELECT DISTINCT
        legacy.email_domain,
        legacy.email_domain,
        CASE
          WHEN lower(legacy.email_domain) IN (
            'gmail.com',
            'googlemail.com',
            'outlook.com',
            'hotmail.com',
            'live.com',
            'msn.com',
            'icloud.com',
            'me.com',
            'mac.com',
            'yahoo.com',
            'ymail.com',
            'aol.com',
            'proton.me',
            'protonmail.com'
          ) THEN 'email_provider'
          ELSE 'unknown'
        END
      FROM %s legacy
      WHERE legacy.email_domain IS NOT NULL
        AND btrim(legacy.email_domain) != ''
      ON CONFLICT (lower(domain)) DO UPDATE
      SET
        raw_input = COALESCE(website.raw_input, EXCLUDED.raw_input),
        domain_type = CASE
          WHEN EXCLUDED.domain_type = 'email_provider'
            AND website.domain_type = 'unknown' THEN 'email_provider'
          ELSE website.domain_type
        END,
        updated_at = now()
    $copy_email_domains$, legacy_table);

    EXECUTE format($copy_email_addresses$
      INSERT INTO person.email_addresses (
        id,
        email,
        local_part,
        website_id,
        address_kind,
        source_confidence,
        raw_source,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.email,
        legacy.local_part,
        COALESCE(legacy.website_id, website.id),
        CASE
          WHEN legacy.local_part IN ('hello', 'info', 'support', 'sales', 'contact', 'team', 'admin', 'wholesale')
            THEN 'role'
          ELSE 'unknown'
        END,
        legacy.source_confidence,
        legacy.raw_source,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      LEFT JOIN business.websites website
        ON lower(website.domain) = lower(legacy.email_domain)
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        local_part = EXCLUDED.local_part,
        website_id = EXCLUDED.website_id,
        address_kind = EXCLUDED.address_kind,
        source_confidence = EXCLUDED.source_confidence,
        raw_source = EXCLUDED.raw_source,
        updated_at = EXCLUDED.updated_at
    $copy_email_addresses$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_contact_email_addresses'), to_regclass('public.crm_contact_email_addresses_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_person_email_addresses$
      INSERT INTO person.person_email_addresses (
        person_id,
        email_address_id,
        relationship_status,
        is_primary,
        source_confidence,
        association_notes,
        created_at,
        updated_at
      )
      SELECT
        legacy.contact_id,
        legacy.email_address_id,
        legacy.relationship_status,
        legacy.is_primary,
        legacy.source_confidence,
        legacy.association_notes,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (person_id, email_address_id) DO UPDATE
      SET
        relationship_status = EXCLUDED.relationship_status,
        is_primary = EXCLUDED.is_primary,
        source_confidence = EXCLUDED.source_confidence,
        association_notes = EXCLUDED.association_notes,
        updated_at = EXCLUDED.updated_at
    $copy_person_email_addresses$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_groups'), to_regclass('public.crm_groups_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_groups$
      INSERT INTO crm.groups (
        id,
        slug,
        name,
        audience_type,
        purpose,
        is_active,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.slug,
        legacy.name,
        legacy.audience_type,
        legacy.purpose,
        legacy.is_active,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        audience_type = EXCLUDED.audience_type,
        purpose = EXCLUDED.purpose,
        is_active = EXCLUDED.is_active,
        updated_at = EXCLUDED.updated_at
    $copy_groups$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_contact_groups'), to_regclass('public.crm_contact_groups_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_person_group_memberships$
      INSERT INTO crm.person_group_memberships (
        person_id,
        group_id,
        fit_score,
        membership_notes,
        added_at
      )
      SELECT
        legacy.contact_id,
        legacy.group_id,
        legacy.fit_score,
        legacy.membership_notes,
        legacy.added_at
      FROM %s legacy
      ON CONFLICT (person_id, group_id) DO UPDATE
      SET
        fit_score = EXCLUDED.fit_score,
        membership_notes = EXCLUDED.membership_notes
    $copy_person_group_memberships$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_campaigns'), to_regclass('public.crm_campaigns_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_campaigns$
      INSERT INTO crm.campaigns (
        id,
        slug,
        name,
        audience_group_id,
        campaign_type,
        status,
        goal,
        sender_identity,
        send_mode,
        subject_line,
        proof_points,
        call_to_action,
        campaign_brief,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.slug,
        legacy.name,
        legacy.audience_group_id,
        legacy.campaign_type,
        legacy.status,
        legacy.goal,
        legacy.sender_identity,
        legacy.send_mode,
        legacy.subject_line,
        legacy.proof_points,
        legacy.call_to_action,
        legacy.campaign_brief,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        audience_group_id = EXCLUDED.audience_group_id,
        campaign_type = EXCLUDED.campaign_type,
        status = EXCLUDED.status,
        goal = EXCLUDED.goal,
        sender_identity = EXCLUDED.sender_identity,
        send_mode = EXCLUDED.send_mode,
        subject_line = EXCLUDED.subject_line,
        proof_points = EXCLUDED.proof_points,
        call_to_action = EXCLUDED.call_to_action,
        campaign_brief = EXCLUDED.campaign_brief,
        updated_at = EXCLUDED.updated_at
    $copy_campaigns$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_campaign_recipients'), to_regclass('public.crm_campaign_recipients_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_campaign_recipients$
      INSERT INTO crm.campaign_recipients (
        id,
        campaign_id,
        person_id,
        status,
        personalization_angle,
        draft_subject,
        draft_body,
        approval_notes,
        send_after_at,
        sent_at,
        replied_at,
        last_event_at,
        n8n_execution_id,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.campaign_id,
        legacy.contact_id,
        legacy.status,
        legacy.personalization_angle,
        legacy.draft_subject,
        legacy.draft_body,
        legacy.approval_notes,
        legacy.send_after_at,
        legacy.sent_at,
        legacy.replied_at,
        legacy.last_event_at,
        legacy.n8n_execution_id,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        campaign_id = EXCLUDED.campaign_id,
        person_id = EXCLUDED.person_id,
        status = EXCLUDED.status,
        personalization_angle = EXCLUDED.personalization_angle,
        draft_subject = EXCLUDED.draft_subject,
        draft_body = EXCLUDED.draft_body,
        approval_notes = EXCLUDED.approval_notes,
        send_after_at = EXCLUDED.send_after_at,
        sent_at = EXCLUDED.sent_at,
        replied_at = EXCLUDED.replied_at,
        last_event_at = EXCLUDED.last_event_at,
        n8n_execution_id = EXCLUDED.n8n_execution_id,
        updated_at = EXCLUDED.updated_at
    $copy_campaign_recipients$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_email_events'), to_regclass('public.crm_email_events_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_email_events$
      INSERT INTO crm.email_events (
        id,
        campaign_recipient_id,
        person_id,
        event_type,
        event_at,
        provider,
        provider_message_id,
        subject,
        body_preview,
        raw_metadata,
        created_at
      )
      SELECT
        legacy.id,
        legacy.campaign_recipient_id,
        legacy.contact_id,
        legacy.event_type,
        legacy.event_at,
        legacy.provider,
        legacy.provider_message_id,
        legacy.subject,
        legacy.body_preview,
        legacy.raw_metadata,
        legacy.created_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        campaign_recipient_id = EXCLUDED.campaign_recipient_id,
        person_id = EXCLUDED.person_id,
        event_type = EXCLUDED.event_type,
        event_at = EXCLUDED.event_at,
        provider = EXCLUDED.provider,
        provider_message_id = EXCLUDED.provider_message_id,
        subject = EXCLUDED.subject,
        body_preview = EXCLUDED.body_preview,
        raw_metadata = EXCLUDED.raw_metadata
    $copy_email_events$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_notes'), to_regclass('public.crm_notes_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_notes$
      INSERT INTO crm.notes (
        id,
        person_id,
        campaign_id,
        note_type,
        body,
        source_confidence,
        created_by,
        created_at
      )
      SELECT
        legacy.id,
        legacy.contact_id,
        legacy.campaign_id,
        legacy.note_type,
        legacy.body,
        legacy.source_confidence,
        legacy.created_by,
        legacy.created_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        person_id = EXCLUDED.person_id,
        campaign_id = EXCLUDED.campaign_id,
        note_type = EXCLUDED.note_type,
        body = EXCLUDED.body,
        source_confidence = EXCLUDED.source_confidence,
        created_by = EXCLUDED.created_by
    $copy_notes$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_follow_ups'), to_regclass('public.crm_follow_ups_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_follow_ups$
      INSERT INTO crm.follow_ups (
        id,
        person_id,
        campaign_recipient_id,
        task,
        due_at,
        status,
        completed_at,
        n8n_execution_id,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.contact_id,
        legacy.campaign_recipient_id,
        legacy.task,
        legacy.due_at,
        legacy.status,
        legacy.completed_at,
        legacy.n8n_execution_id,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        person_id = EXCLUDED.person_id,
        campaign_recipient_id = EXCLUDED.campaign_recipient_id,
        task = EXCLUDED.task,
        due_at = EXCLUDED.due_at,
        status = EXCLUDED.status,
        completed_at = EXCLUDED.completed_at,
        n8n_execution_id = EXCLUDED.n8n_execution_id,
        updated_at = EXCLUDED.updated_at
    $copy_follow_ups$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_founder_institute_directory_entries'), to_regclass('public.crm_founder_institute_directory_entries_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_fi_entries$
      INSERT INTO public_sources.founder_institute_directory_entries (
        id,
        person_id,
        identity_key,
        identity_key_type,
        display_name,
        first_name,
        last_name,
        organization,
        role_title,
        linkedin_url,
        profile_image_url,
        specialization_name,
        city_name,
        source_url,
        source_page,
        source_position,
        card_text,
        mentor_notes,
        raw_card,
        source_confidence,
        collected_at,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.contact_id,
        legacy.identity_key,
        legacy.identity_key_type,
        legacy.display_name,
        legacy.first_name,
        legacy.last_name,
        legacy.organization,
        legacy.role_title,
        legacy.linkedin_url,
        legacy.profile_image_url,
        legacy.specialization_name,
        legacy.city_name,
        legacy.source_url,
        legacy.source_page,
        legacy.source_position,
        legacy.card_text,
        legacy.mentor_notes,
        legacy.raw_card,
        legacy.source_confidence,
        legacy.collected_at,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        person_id = EXCLUDED.person_id,
        identity_key = EXCLUDED.identity_key,
        identity_key_type = EXCLUDED.identity_key_type,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        organization = EXCLUDED.organization,
        role_title = EXCLUDED.role_title,
        linkedin_url = EXCLUDED.linkedin_url,
        profile_image_url = EXCLUDED.profile_image_url,
        specialization_name = EXCLUDED.specialization_name,
        city_name = EXCLUDED.city_name,
        source_url = EXCLUDED.source_url,
        source_page = EXCLUDED.source_page,
        source_position = EXCLUDED.source_position,
        card_text = EXCLUDED.card_text,
        mentor_notes = EXCLUDED.mentor_notes,
        raw_card = EXCLUDED.raw_card,
        source_confidence = EXCLUDED.source_confidence,
        collected_at = EXCLUDED.collected_at,
        updated_at = EXCLUDED.updated_at
    $copy_fi_entries$, legacy_table);
  END IF;
END;
$$;

DO $$
DECLARE
  legacy_table regclass;
BEGIN
  legacy_table := COALESCE(to_regclass('public.crm_interview_source_entries'), to_regclass('public.crm_interview_source_entries_legacy_backup'));
  IF legacy_table IS NOT NULL THEN
    EXECUTE format($copy_interview_entries$
      INSERT INTO public_sources.interview_source_entries (
        id,
        person_id,
        source_row_number,
        source_name,
        picture,
        linkedin_url,
        interview_status,
        source_date_text,
        interview_at,
        contact_mode,
        company,
        role_title,
        ecosystem_role,
        email,
        phone,
        about,
        interview_strategy,
        interview_notes,
        transcript,
        jtbd_analysis,
        industry,
        source_payload,
        source_confidence,
        collected_at,
        created_at,
        updated_at
      )
      SELECT
        legacy.id,
        legacy.contact_id,
        legacy.source_row_number,
        legacy.source_name,
        legacy.picture,
        legacy.linkedin_url,
        legacy.interview_status,
        legacy.source_date_text,
        legacy.interview_at,
        legacy.contact_mode,
        legacy.company,
        legacy.role_title,
        legacy.ecosystem_role,
        legacy.email,
        legacy.phone,
        legacy.about,
        legacy.interview_strategy,
        legacy.interview_notes,
        legacy.transcript,
        legacy.jtbd_analysis,
        legacy.industry,
        legacy.source_payload,
        legacy.source_confidence,
        legacy.collected_at,
        legacy.created_at,
        legacy.updated_at
      FROM %s legacy
      ON CONFLICT (id) DO UPDATE
      SET
        person_id = EXCLUDED.person_id,
        source_row_number = EXCLUDED.source_row_number,
        source_name = EXCLUDED.source_name,
        picture = EXCLUDED.picture,
        linkedin_url = EXCLUDED.linkedin_url,
        interview_status = EXCLUDED.interview_status,
        source_date_text = EXCLUDED.source_date_text,
        interview_at = EXCLUDED.interview_at,
        contact_mode = EXCLUDED.contact_mode,
        company = EXCLUDED.company,
        role_title = EXCLUDED.role_title,
        ecosystem_role = EXCLUDED.ecosystem_role,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        about = EXCLUDED.about,
        interview_strategy = EXCLUDED.interview_strategy,
        interview_notes = EXCLUDED.interview_notes,
        transcript = EXCLUDED.transcript,
        jtbd_analysis = EXCLUDED.jtbd_analysis,
        industry = EXCLUDED.industry,
        source_payload = EXCLUDED.source_payload,
        source_confidence = EXCLUDED.source_confidence,
        collected_at = EXCLUDED.collected_at,
        updated_at = EXCLUDED.updated_at
    $copy_interview_entries$, legacy_table);
  END IF;
END;
$$;

UPDATE business.websites
SET
  domain_type = 'email_provider',
  updated_at = now()
WHERE lower(domain) IN (
    'gmail.com',
    'googlemail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'yahoo.com',
    'ymail.com',
    'aol.com',
    'proton.me',
    'protonmail.com'
  )
  AND domain_type != 'email_provider';

INSERT INTO crm.groups (slug, name, audience_type, purpose)
VALUES (
  'potential-investors',
  'Potential Investors',
  'investor',
  'MVP group for the first 20 potential-investor email campaign.'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO business.website_lists (slug, name, purpose)
VALUES (
  'http-archive-shopify-daily',
  'HTTP Archive Shopify Daily',
  'Daily review cohort for domains observed with Shopify technologies in HTTP Archive.'
)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE VIEW business.website_shopify_review AS
SELECT
  website.id AS website_id,
  website.domain,
  website.domain_type,
  status.status AS shopify_status,
  status.checked_at AS shopify_checked_at,
  status.detection_error AS shopify_detection_error,
  observation.crawl_date AS http_archive_crawl_date,
  observation.best_rank AS http_archive_best_rank,
  observation.technologies AS http_archive_technologies,
  observation.primary_root_page_url AS http_archive_primary_root_page_url
FROM business.websites website
LEFT JOIN web_enrichment.website_shopify_status status
  ON status.website_id = website.id
LEFT JOIN public_sources.http_archive_observations observation
  ON observation.website_id = website.id;

CREATE OR REPLACE VIEW public_sources.http_archive_shopify_review AS
SELECT
  run.id AS run_id,
  run.crawl_date,
  run.client,
  run.query_name,
  website.id AS website_id,
  website.domain,
  observation.best_rank,
  observation.detected_pages,
  observation.technologies,
  shopify.status AS live_shopify_status,
  shopify.checked_at AS live_shopify_checked_at
FROM public_sources.http_archive_runs run
JOIN public_sources.http_archive_observations observation
  ON observation.run_id = run.id
JOIN business.websites website
  ON website.id = observation.website_id
LEFT JOIN web_enrichment.website_shopify_status shopify
  ON shopify.website_id = website.id;

DROP TRIGGER IF EXISTS websites_set_updated_at ON business.websites;
CREATE TRIGGER websites_set_updated_at
  BEFORE UPDATE ON business.websites
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS website_lists_set_updated_at ON business.website_lists;
CREATE TRIGGER website_lists_set_updated_at
  BEFORE UPDATE ON business.website_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS people_set_updated_at ON person.people;
CREATE TRIGGER people_set_updated_at
  BEFORE UPDATE ON person.people
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS email_addresses_set_updated_at ON person.email_addresses;
CREATE TRIGGER email_addresses_set_updated_at
  BEFORE UPDATE ON person.email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS person_email_addresses_set_updated_at ON person.person_email_addresses;
CREATE TRIGGER person_email_addresses_set_updated_at
  BEFORE UPDATE ON person.person_email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS groups_set_updated_at ON crm.groups;
CREATE TRIGGER groups_set_updated_at
  BEFORE UPDATE ON crm.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS campaigns_set_updated_at ON crm.campaigns;
CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON crm.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS campaign_recipients_set_updated_at ON crm.campaign_recipients;
CREATE TRIGGER campaign_recipients_set_updated_at
  BEFORE UPDATE ON crm.campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS follow_ups_set_updated_at ON crm.follow_ups;
CREATE TRIGGER follow_ups_set_updated_at
  BEFORE UPDATE ON crm.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS fi_directory_entries_set_updated_at ON public_sources.founder_institute_directory_entries;
CREATE TRIGGER fi_directory_entries_set_updated_at
  BEFORE UPDATE ON public_sources.founder_institute_directory_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS interview_source_entries_set_updated_at ON public_sources.interview_source_entries;
CREATE TRIGGER interview_source_entries_set_updated_at
  BEFORE UPDATE ON public_sources.interview_source_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS http_archive_runs_set_updated_at ON public_sources.http_archive_runs;
CREATE TRIGGER http_archive_runs_set_updated_at
  BEFORE UPDATE ON public_sources.http_archive_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS http_archive_observations_set_updated_at ON public_sources.http_archive_observations;
CREATE TRIGGER http_archive_observations_set_updated_at
  BEFORE UPDATE ON public_sources.http_archive_observations
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DROP TRIGGER IF EXISTS website_shopify_status_set_updated_at ON web_enrichment.website_shopify_status;
CREATE TRIGGER website_shopify_status_set_updated_at
  BEFORE UPDATE ON web_enrichment.website_shopify_status
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_set_updated_at();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_contacts' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_contacts_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_contacts RENAME TO crm_contacts_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_websites' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_websites_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_websites RENAME TO crm_websites_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_email_addresses' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_email_addresses_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_email_addresses RENAME TO crm_email_addresses_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_contact_email_addresses' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_contact_email_addresses_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_contact_email_addresses RENAME TO crm_contact_email_addresses_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_groups' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_groups_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_groups RENAME TO crm_groups_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_contact_groups' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_contact_groups_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_contact_groups RENAME TO crm_contact_groups_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_campaigns' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_campaigns_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_campaigns RENAME TO crm_campaigns_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_campaign_recipients' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_campaign_recipients_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_campaign_recipients RENAME TO crm_campaign_recipients_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_email_events' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_email_events_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_email_events RENAME TO crm_email_events_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_notes' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_notes_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_notes RENAME TO crm_notes_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_follow_ups' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_follow_ups_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_follow_ups RENAME TO crm_follow_ups_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_founder_institute_directory_entries' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_founder_institute_directory_entries_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_founder_institute_directory_entries RENAME TO crm_founder_institute_directory_entries_legacy_backup;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'crm_interview_source_entries' AND c.relkind IN ('r', 'p')) AND to_regclass('public.crm_interview_source_entries_legacy_backup') IS NULL THEN
    ALTER TABLE public.crm_interview_source_entries RENAME TO crm_interview_source_entries_legacy_backup;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_compatibility_view_is_read_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'public.crm_% is a read-only compatibility view; write schema-native tables instead',
    regexp_replace(TG_TABLE_NAME, '^crm_', '');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW public.crm_contacts AS
SELECT
  id,
  display_name,
  first_name,
  last_name,
  organization,
  role_title,
  relationship_type,
  relationship_stage,
  source_confidence,
  investor_fit,
  check_size_range,
  warm_intro_source,
  last_touch_at,
  next_follow_up_at,
  personalization_notes,
  private_notes,
  do_not_contact,
  owner,
  created_at,
  updated_at
FROM person.people;

CREATE OR REPLACE VIEW public.crm_websites AS
SELECT
  website.id,
  website.domain,
  website.raw_input,
  website.domain_type,
  COALESCE(shopify.status, 'unknown') AS shopify_status,
  shopify.checked_at AS shopify_checked_at,
  COALESCE(shopify.detection_signals, '{}'::jsonb) AS shopify_detection_signals,
  shopify.detection_error AS shopify_detection_error,
  COALESCE(shopify.check_attempts, 0) AS shopify_check_attempts,
  shopify.last_attempt_at AS shopify_last_attempt_at,
  shopify.next_check_at AS shopify_next_check_at,
  shopify.locked_at AS enrichment_locked_at,
  shopify.locked_by AS enrichment_locked_by,
  website.created_at,
  website.updated_at
FROM business.websites website
LEFT JOIN web_enrichment.website_shopify_status shopify
  ON shopify.website_id = website.id;

CREATE OR REPLACE VIEW public.crm_email_addresses AS
SELECT
  id,
  email,
  local_part,
  split_part(email, '@', 2) AS email_domain,
  website_id,
  source_confidence,
  raw_source,
  created_at,
  updated_at
FROM person.email_addresses;

CREATE OR REPLACE VIEW public.crm_contact_email_addresses AS
SELECT
  person_id AS contact_id,
  email_address_id,
  relationship_status,
  is_primary,
  source_confidence,
  association_notes,
  created_at,
  updated_at
FROM person.person_email_addresses;

CREATE OR REPLACE VIEW public.crm_groups AS
SELECT
  id,
  slug,
  name,
  audience_type,
  purpose,
  is_active,
  created_at,
  updated_at
FROM crm.groups;

CREATE OR REPLACE VIEW public.crm_contact_groups AS
SELECT
  person_id AS contact_id,
  group_id,
  fit_score,
  membership_notes,
  added_at
FROM crm.person_group_memberships membership;

CREATE OR REPLACE VIEW public.crm_campaigns AS
SELECT
  id,
  slug,
  name,
  audience_group_id,
  campaign_type,
  status,
  goal,
  sender_identity,
  send_mode,
  subject_line,
  proof_points,
  call_to_action,
  campaign_brief,
  created_at,
  updated_at
FROM crm.campaigns;

CREATE OR REPLACE VIEW public.crm_campaign_recipients AS
SELECT
  id,
  campaign_id,
  person_id AS contact_id,
  status,
  personalization_angle,
  draft_subject,
  draft_body,
  approval_notes,
  send_after_at,
  sent_at,
  replied_at,
  last_event_at,
  n8n_execution_id,
  created_at,
  updated_at
FROM crm.campaign_recipients;

CREATE OR REPLACE VIEW public.crm_email_events AS
SELECT
  id,
  campaign_recipient_id,
  person_id AS contact_id,
  event_type,
  event_at,
  provider,
  provider_message_id,
  subject,
  body_preview,
  raw_metadata,
  created_at
FROM crm.email_events;

CREATE OR REPLACE VIEW public.crm_notes AS
SELECT
  id,
  person_id AS contact_id,
  campaign_id,
  note_type,
  body,
  source_confidence,
  created_by,
  created_at
FROM crm.notes;

CREATE OR REPLACE VIEW public.crm_follow_ups AS
SELECT
  id,
  person_id AS contact_id,
  campaign_recipient_id,
  task,
  due_at,
  status,
  completed_at,
  n8n_execution_id,
  created_at,
  updated_at
FROM crm.follow_ups;

CREATE OR REPLACE VIEW public.crm_founder_institute_directory_entries AS
SELECT
  id,
  person_id AS contact_id,
  identity_key,
  identity_key_type,
  display_name,
  first_name,
  last_name,
  organization,
  role_title,
  linkedin_url,
  profile_image_url,
  specialization_name,
  city_name,
  source_url,
  source_page,
  source_position,
  card_text,
  mentor_notes,
  raw_card,
  source_confidence,
  collected_at,
  created_at,
  updated_at
FROM public_sources.founder_institute_directory_entries;

CREATE OR REPLACE VIEW public.crm_interview_source_entries AS
SELECT
  id,
  person_id AS contact_id,
  source_row_number,
  source_name,
  picture,
  linkedin_url,
  interview_status,
  source_date_text,
  interview_at,
  contact_mode,
  company,
  role_title,
  ecosystem_role,
  email,
  phone,
  about,
  interview_strategy,
  interview_notes,
  transcript,
  jtbd_analysis,
  industry,
  source_payload,
  source_confidence,
  collected_at,
  created_at,
  updated_at
FROM public_sources.interview_source_entries;

DROP TRIGGER IF EXISTS crm_contacts_read_only ON public.crm_contacts;
CREATE TRIGGER crm_contacts_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_websites_read_only ON public.crm_websites;
CREATE TRIGGER crm_websites_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_websites
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_email_addresses_read_only ON public.crm_email_addresses;
CREATE TRIGGER crm_email_addresses_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_contact_email_addresses_read_only ON public.crm_contact_email_addresses;
CREATE TRIGGER crm_contact_email_addresses_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_contact_email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_groups_read_only ON public.crm_groups;
CREATE TRIGGER crm_groups_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_contact_groups_read_only ON public.crm_contact_groups;
CREATE TRIGGER crm_contact_groups_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_contact_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_campaigns_read_only ON public.crm_campaigns;
CREATE TRIGGER crm_campaigns_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_campaign_recipients_read_only ON public.crm_campaign_recipients;
CREATE TRIGGER crm_campaign_recipients_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_email_events_read_only ON public.crm_email_events;
CREATE TRIGGER crm_email_events_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_email_events
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_notes_read_only ON public.crm_notes;
CREATE TRIGGER crm_notes_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_follow_ups_read_only ON public.crm_follow_ups;
CREATE TRIGGER crm_follow_ups_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_founder_institute_directory_entries_read_only ON public.crm_founder_institute_directory_entries;
CREATE TRIGGER crm_founder_institute_directory_entries_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_founder_institute_directory_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();

DROP TRIGGER IF EXISTS crm_interview_source_entries_read_only ON public.crm_interview_source_entries;
CREATE TRIGGER crm_interview_source_entries_read_only
  INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_interview_source_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_compatibility_view_is_read_only();
