CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crm_contacts (
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
  CONSTRAINT crm_contacts_relationship_stage_check CHECK (
    relationship_stage IN ('prospect', 'warm', 'active', 'committed', 'passed', 'paused')
  ),
  CONSTRAINT crm_contacts_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE TABLE IF NOT EXISTS crm_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  raw_input text,
  domain_type text NOT NULL DEFAULT 'unknown',
  shopify_status text NOT NULL DEFAULT 'unknown',
  shopify_checked_at timestamptz,
  shopify_detection_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  shopify_detection_error text,
  shopify_check_attempts integer NOT NULL DEFAULT 0,
  shopify_last_attempt_at timestamptz,
  shopify_next_check_at timestamptz,
  enrichment_locked_at timestamptz,
  enrichment_locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_websites_domain_type_check CHECK (
    domain_type IN ('unknown', 'business', 'email_provider')
  ),
  CONSTRAINT crm_websites_shopify_status_check CHECK (
    shopify_status IN ('unknown', 'true', 'false')
  ),
  CONSTRAINT crm_websites_shopify_check_attempts_check CHECK (
    shopify_check_attempts >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_websites_domain_unique
  ON crm_websites (lower(domain));

CREATE INDEX IF NOT EXISTS crm_websites_enrichment_poll_idx
  ON crm_websites (shopify_status, domain_type, shopify_next_check_at, enrichment_locked_at);

CREATE INDEX IF NOT EXISTS crm_websites_enrichment_lock_idx
  ON crm_websites (enrichment_locked_at, enrichment_locked_by)
  WHERE enrichment_locked_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_email_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  local_part text NOT NULL,
  email_domain text NOT NULL,
  website_id uuid REFERENCES crm_websites(id) ON DELETE SET NULL,
  source_confidence text NOT NULL DEFAULT 'needs-verification',
  raw_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_email_addresses_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_email_addresses_email_unique
  ON crm_email_addresses (lower(email));

CREATE INDEX IF NOT EXISTS crm_email_addresses_domain_idx
  ON crm_email_addresses (lower(email_domain));

CREATE INDEX IF NOT EXISTS crm_email_addresses_website_idx
  ON crm_email_addresses (website_id)
  WHERE website_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_contact_email_addresses (
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  email_address_id uuid NOT NULL REFERENCES crm_email_addresses(id) ON DELETE CASCADE,
  relationship_status text NOT NULL DEFAULT 'candidate',
  is_primary boolean NOT NULL DEFAULT false,
  source_confidence text NOT NULL DEFAULT 'needs-verification',
  association_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, email_address_id),
  CONSTRAINT crm_contact_email_addresses_relationship_status_check CHECK (
    relationship_status IN ('candidate', 'likely', 'claimed', 'rejected')
  ),
  CONSTRAINT crm_contact_email_addresses_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_contact_email_addresses_primary_contact_unique
  ON crm_contact_email_addresses (contact_id)
  WHERE is_primary = true AND relationship_status != 'rejected';

CREATE INDEX IF NOT EXISTS crm_contact_email_addresses_email_idx
  ON crm_contact_email_addresses (email_address_id);

CREATE TEMP TABLE IF NOT EXISTS crm_contact_email_migration_source (
  contact_id uuid NOT NULL,
  normalized_email text NOT NULL,
  local_part text NOT NULL,
  email_domain text NOT NULL,
  source_confidence text NOT NULL
);

TRUNCATE crm_contact_email_migration_source;

DO $$
DECLARE
  has_contact_email_column boolean;
  has_invalid_contact_email boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'crm_contacts'
      AND column_name = 'email'
  )
  INTO has_contact_email_column;

  IF has_contact_email_column THEN
    EXECUTE $migration_check$
      SELECT EXISTS (
        SELECT 1
        FROM crm_contacts
        WHERE email IS NOT NULL
          AND btrim(email) != ''
          AND (
            position('@' in btrim(email)) <= 1
            OR split_part(btrim(email), '@', 2) = ''
            OR split_part(btrim(email), '@', 3) != ''
          )
      )
    $migration_check$
    INTO has_invalid_contact_email;

    IF has_invalid_contact_email THEN
      RAISE EXCEPTION 'Cannot migrate crm_contacts.email because at least one non-empty value is not a simple email address';
    END IF;

    EXECUTE $migration_source$
      INSERT INTO crm_contact_email_migration_source (
        contact_id,
        normalized_email,
        local_part,
        email_domain,
        source_confidence
      )
      SELECT
        id,
        lower(btrim(email)),
        split_part(lower(btrim(email)), '@', 1),
        split_part(lower(btrim(email)), '@', 2),
        CASE
          WHEN source_confidence IN (
            'confirmed-public',
            'confirmed-user',
            'private-sourced',
            'needs-verification'
          ) THEN source_confidence
          ELSE 'confirmed-user'
        END
      FROM crm_contacts
      WHERE email IS NOT NULL
        AND btrim(email) != ''
    $migration_source$;
  END IF;
END;
$$;

INSERT INTO crm_websites (domain, raw_input, domain_type)
SELECT DISTINCT
  email_domain,
  email_domain,
  CASE
    WHEN email_domain IN (
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
FROM crm_contact_email_migration_source
ON CONFLICT (lower(domain)) DO UPDATE
SET
  raw_input = COALESCE(crm_websites.raw_input, EXCLUDED.raw_input),
  domain_type = CASE
    WHEN EXCLUDED.domain_type = 'email_provider'
      AND crm_websites.domain_type = 'unknown' THEN 'email_provider'
    ELSE crm_websites.domain_type
  END,
  updated_at = now();

UPDATE crm_websites
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

INSERT INTO crm_email_addresses (email, local_part, email_domain, website_id, source_confidence, raw_source)
SELECT DISTINCT ON (source.normalized_email)
  source.normalized_email,
  source.local_part,
  source.email_domain,
  website.id,
  source.source_confidence,
  'crm_contacts.email migration'
FROM crm_contact_email_migration_source source
JOIN crm_websites website
  ON lower(website.domain) = source.email_domain
ORDER BY source.normalized_email, source.contact_id
ON CONFLICT (lower(email)) DO UPDATE
SET
  website_id = COALESCE(crm_email_addresses.website_id, EXCLUDED.website_id),
  source_confidence = CASE
    WHEN crm_email_addresses.source_confidence = 'needs-verification'
      THEN EXCLUDED.source_confidence
    ELSE crm_email_addresses.source_confidence
  END,
  updated_at = now();

INSERT INTO crm_contact_email_addresses (contact_id, email_address_id, relationship_status, is_primary, source_confidence, association_notes)
SELECT
  source.contact_id,
  email_address.id,
  'claimed',
  true,
  source.source_confidence,
  'Migrated from crm_contacts.email'
FROM crm_contact_email_migration_source source
JOIN crm_email_addresses email_address
  ON lower(email_address.email) = source.normalized_email
ON CONFLICT (contact_id, email_address_id) DO UPDATE
SET
  relationship_status = 'claimed',
  is_primary = true,
  source_confidence = EXCLUDED.source_confidence,
  association_notes = COALESCE(
    crm_contact_email_addresses.association_notes,
    EXCLUDED.association_notes
  ),
  updated_at = now();

DROP INDEX IF EXISTS crm_contacts_email_unique;

ALTER TABLE crm_contacts DROP COLUMN IF EXISTS email;

CREATE TABLE IF NOT EXISTS crm_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  audience_type text NOT NULL DEFAULT 'investor',
  purpose text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contact_groups (
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES crm_groups(id) ON DELETE CASCADE,
  fit_score integer,
  membership_notes text,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, group_id),
  CONSTRAINT crm_contact_groups_fit_score_check CHECK (
    fit_score IS NULL OR (fit_score >= 1 AND fit_score <= 5)
  )
);

CREATE TABLE IF NOT EXISTS crm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  audience_group_id uuid REFERENCES crm_groups(id) ON DELETE SET NULL,
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
  CONSTRAINT crm_campaigns_status_check CHECK (
    status IN ('draft', 'reviewing', 'ready', 'sending', 'paused', 'completed', 'archived')
  ),
  CONSTRAINT crm_campaigns_send_mode_check CHECK (
    send_mode IN ('draft_only', 'operator_approved', 'automatic')
  )
);

CREATE TABLE IF NOT EXISTS crm_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
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
  UNIQUE (campaign_id, contact_id),
  CONSTRAINT crm_campaign_recipients_status_check CHECK (
    status IN ('queued', 'draft_ready', 'approved', 'sent', 'replied', 'bounced', 'skipped', 'paused')
  )
);

CREATE TABLE IF NOT EXISTS crm_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_recipient_id uuid REFERENCES crm_campaign_recipients(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  provider text,
  provider_message_id text,
  subject text,
  body_preview text,
  raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_email_events_event_type_check CHECK (
    event_type IN ('draft_created', 'approved', 'sent', 'reply_received', 'bounce', 'manual_note', 'skipped')
  )
);

CREATE TABLE IF NOT EXISTS crm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES crm_campaigns(id) ON DELETE SET NULL,
  note_type text NOT NULL DEFAULT 'relationship',
  body text NOT NULL,
  source_confidence text NOT NULL DEFAULT 'confirmed-user',
  created_by text NOT NULL DEFAULT 'Allan',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_notes_note_type_check CHECK (
    note_type IN ('relationship', 'campaign', 'call', 'email', 'research', 'todo')
  ),
  CONSTRAINT crm_notes_source_confidence_check CHECK (
    source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')
  )
);

CREATE TABLE IF NOT EXISTS crm_founder_institute_directory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
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
  CONSTRAINT crm_fi_directory_entries_identity_key_type_check CHECK (
    identity_key_type IN ('linkedin_url', 'name_organization_role')
  ),
  CONSTRAINT crm_fi_directory_entries_source_page_check CHECK (
    source_page >= 1
  ),
  CONSTRAINT crm_fi_directory_entries_source_position_check CHECK (
    source_position IS NULL OR source_position >= 1
  ),
  CONSTRAINT crm_fi_directory_entries_source_confidence_check CHECK (
    source_confidence IN ('private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_fi_directory_entries_source_unique
  ON crm_founder_institute_directory_entries (
    lower(identity_key),
    lower(specialization_name),
    lower(city_name)
  );

CREATE INDEX IF NOT EXISTS crm_fi_directory_entries_specialization_idx
  ON crm_founder_institute_directory_entries (lower(specialization_name));

CREATE INDEX IF NOT EXISTS crm_fi_directory_entries_linkedin_idx
  ON crm_founder_institute_directory_entries (lower(linkedin_url))
  WHERE linkedin_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS crm_fi_directory_entries_contact_idx
  ON crm_founder_institute_directory_entries (contact_id)
  WHERE contact_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_interview_source_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
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
  CONSTRAINT crm_interview_source_entries_source_row_number_check CHECK (
    source_row_number >= 1
  ),
  CONSTRAINT crm_interview_source_entries_source_confidence_check CHECK (
    source_confidence IN ('private-sourced', 'needs-verification')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_interview_source_entries_row_unique
  ON crm_interview_source_entries (source_row_number);

CREATE INDEX IF NOT EXISTS crm_interview_source_entries_email_idx
  ON crm_interview_source_entries (lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS crm_interview_source_entries_linkedin_idx
  ON crm_interview_source_entries (lower(linkedin_url))
  WHERE linkedin_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS crm_interview_source_entries_contact_idx
  ON crm_interview_source_entries (contact_id)
  WHERE contact_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS crm_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE CASCADE,
  campaign_recipient_id uuid REFERENCES crm_campaign_recipients(id) ON DELETE SET NULL,
  task text NOT NULL,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open',
  completed_at timestamptz,
  n8n_execution_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_follow_ups_status_check CHECK (
    status IN ('open', 'done', 'snoozed', 'canceled')
  )
);

CREATE OR REPLACE FUNCTION crm_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crm_contacts_set_updated_at ON crm_contacts;
CREATE TRIGGER crm_contacts_set_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_websites_set_updated_at ON crm_websites;
CREATE TRIGGER crm_websites_set_updated_at
  BEFORE UPDATE ON crm_websites
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_email_addresses_set_updated_at ON crm_email_addresses;
CREATE TRIGGER crm_email_addresses_set_updated_at
  BEFORE UPDATE ON crm_email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_contact_email_addresses_set_updated_at ON crm_contact_email_addresses;
CREATE TRIGGER crm_contact_email_addresses_set_updated_at
  BEFORE UPDATE ON crm_contact_email_addresses
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_groups_set_updated_at ON crm_groups;
CREATE TRIGGER crm_groups_set_updated_at
  BEFORE UPDATE ON crm_groups
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_campaigns_set_updated_at ON crm_campaigns;
CREATE TRIGGER crm_campaigns_set_updated_at
  BEFORE UPDATE ON crm_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_campaign_recipients_set_updated_at ON crm_campaign_recipients;
CREATE TRIGGER crm_campaign_recipients_set_updated_at
  BEFORE UPDATE ON crm_campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_follow_ups_set_updated_at ON crm_follow_ups;
CREATE TRIGGER crm_follow_ups_set_updated_at
  BEFORE UPDATE ON crm_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_fi_directory_entries_set_updated_at ON crm_founder_institute_directory_entries;
CREATE TRIGGER crm_fi_directory_entries_set_updated_at
  BEFORE UPDATE ON crm_founder_institute_directory_entries
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

DROP TRIGGER IF EXISTS crm_interview_source_entries_set_updated_at ON crm_interview_source_entries;
CREATE TRIGGER crm_interview_source_entries_set_updated_at
  BEFORE UPDATE ON crm_interview_source_entries
  FOR EACH ROW
  EXECUTE FUNCTION crm_set_updated_at();

INSERT INTO crm_groups (slug, name, audience_type, purpose)
VALUES (
  'potential-investors',
  'Potential Investors',
  'investor',
  'MVP group for the first 20 potential-investor email campaign.'
)
ON CONFLICT (slug) DO NOTHING;
