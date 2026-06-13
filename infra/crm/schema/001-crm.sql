CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  first_name text,
  last_name text,
  email text,
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

CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_email_unique
  ON crm_contacts (lower(email))
  WHERE email IS NOT NULL;

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
