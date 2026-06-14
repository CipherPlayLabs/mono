# Website Contact Discovery Workflow Contract

This contract defines the n8n boundary for `CipherPlay Website Contact Discovery`. n8n connects as `crm_writer` to the `crm database`, not the `nocodb` metadata database, and writes only schema-native CRM tables.

Do not put Cloud SQL passwords, NocoDB credentials, private domains, contact samples, crawl dumps, or exported workflow secrets in this file.

## Runtime Boundary

- Workflow name: `CipherPlay Website Contact Discovery`
- Database: `crm`
- User: `crm_writer`
- Domain registry: `business.websites`
- Contact methods: `contact_methods.emails` and `contact_methods.linkedin_profiles`
- Association evidence: `contact_methods.organization_email_links`
- Attempt state: `web_enrichment.website_contact_discovery_status`
- Observation evidence: `web_enrichment.website_contact_discovery_observations`
- Scope: all discoverable same-domain HTML pages
- Excluded assets: Skip PDFs, images, video, audio, archives, fonts, scripts, stylesheets, and other binary or media assets.
- External search: Do not use external search in V1.
- LinkedIn fetches: Do not fetch LinkedIn pages. Store LinkedIn URLs found on the crawled website.

Persist a status row even when no contact methods are found. A zero-result crawl is still useful operational state.

## Claim And Load Pattern

Before claiming a batch, make sure every Website has a contact-discovery status row:

```sql
INSERT INTO web_enrichment.website_contact_discovery_status (website_id)
SELECT website.id
FROM business.websites website
ON CONFLICT (website_id) DO NOTHING;
```

Claim a small batch for production smoke:

```sql
WITH claimed AS (
  UPDATE web_enrichment.website_contact_discovery_status status
  SET
    status = 'running',
    locked_at = now(),
    locked_by = $1,
    crawl_started_at = now(),
    last_attempt_at = now(),
    check_attempts = status.check_attempts + 1,
    updated_at = now()
  FROM business.websites website
  WHERE status.website_id = website.id
    AND website.domain_type != 'email_provider'
    AND (status.next_check_at IS NULL OR status.next_check_at <= now())
    AND (
      status.locked_at IS NULL
      OR status.locked_at < now() - interval '45 minutes'
    )
    AND status.website_id IN (
      SELECT status_inner.website_id
      FROM web_enrichment.website_contact_discovery_status status_inner
      JOIN business.websites website_inner
        ON website_inner.id = status_inner.website_id
      WHERE website_inner.domain_type != 'email_provider'
        AND (status_inner.next_check_at IS NULL OR status_inner.next_check_at <= now())
        AND (
          status_inner.locked_at IS NULL
          OR status_inner.locked_at < now() - interval '45 minutes'
        )
      ORDER BY website_inner.created_at ASC
      LIMIT 5
      FOR UPDATE SKIP LOCKED
    )
  RETURNING website.id, website.domain, status.locked_by
)
SELECT id, domain, locked_by
FROM claimed;
```

Do not rely on an n8n Postgres claim node returning row payloads. After claim, explicitly load claimed rows by `locked_by = $execution.id` before HTTP or crawl work.

## Crawl Rules

Start from `https://domain/` and optionally `https://www.domain/`. Follow normalized links that remain within the same registrable domain and appear to serve HTML. Normalize fragments away and treat query strings cautiously to avoid infinite crawl variants.

Skip URLs that look like PDFs, images, video, audio, archives, fonts, scripts, stylesheets, feeds, executables, or other binary/media assets. V1 should not parse PDFs or image metadata.

Extract:

- Emails found in visible page text, `mailto:` links, and structured HTML attributes.
- LinkedIn URLs found in anchors or text.

Do not create a Person from an email address alone. Classify common function inboxes such as `hello`, `info`, `support`, `sales`, `contact`, `team`, `admin`, and `wholesale` as `role_inbox`; use `person` only when the address is strongly human-name-like; otherwise use `unknown`.

## Persistence

Upsert canonical emails:

```sql
INSERT INTO contact_methods.emails (
  email,
  local_part,
  website_id,
  address_kind,
  source_confidence,
  raw_source
)
VALUES ($1, $2, $3, $4, 'confirmed-public', $5)
ON CONFLICT (lower(email)) DO UPDATE
SET
  website_id = COALESCE(contact_methods.emails.website_id, EXCLUDED.website_id),
  address_kind = CASE
    WHEN contact_methods.emails.address_kind = 'unknown' THEN EXCLUDED.address_kind
    ELSE contact_methods.emails.address_kind
  END,
  source_confidence = EXCLUDED.source_confidence,
  raw_source = EXCLUDED.raw_source,
  updated_at = now()
RETURNING id;
```

Upsert canonical LinkedIn URLs:

```sql
INSERT INTO contact_methods.linkedin_profiles (
  linkedin_url,
  normalized_url,
  profile_kind,
  source_confidence,
  raw_source
)
VALUES ($1, $2, $3, 'confirmed-public', $4)
ON CONFLICT (lower(normalized_url)) DO UPDATE
SET
  linkedin_url = EXCLUDED.linkedin_url,
  profile_kind = CASE
    WHEN contact_methods.linkedin_profiles.profile_kind = 'unknown' THEN EXCLUDED.profile_kind
    ELSE contact_methods.linkedin_profiles.profile_kind
  END,
  source_confidence = EXCLUDED.source_confidence,
  raw_source = EXCLUDED.raw_source,
  updated_at = now()
RETURNING id;
```

Write one observation per discovered value and source URL:

```sql
INSERT INTO web_enrichment.website_contact_discovery_observations (
  website_id,
  email_id,
  linkedin_profile_id,
  source_url,
  observation_kind,
  observed_value,
  classification,
  classification_reason,
  n8n_execution_id,
  evidence
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb);
```

Link role inbox or organization-level email evidence to a reviewed `business.organizations` row only when the workflow has a defensible organization match. Do not invent an organization solely because a Website exists; Website-to-Organization links belong in `business.organization_websites` as evidence associations.

## Status Updates

Successful or partial crawls should update the status row and release the lock:

```sql
UPDATE web_enrichment.website_contact_discovery_status
SET
  status = $2,
  checked_at = now(),
  crawl_finished_at = now(),
  page_count = $3,
  found_email_count = $4,
  found_linkedin_count = $5,
  crawl_scope = $6::jsonb,
  discovery_summary = $7::jsonb,
  discovery_error = NULL,
  next_check_at = $8,
  locked_at = NULL,
  locked_by = NULL,
  updated_at = now()
WHERE website_id = $1
  AND locked_by = $9;
```

Failed crawls should keep compact error context and advance retry timing:

```sql
UPDATE web_enrichment.website_contact_discovery_status
SET
  status = 'failed',
  checked_at = now(),
  crawl_finished_at = now(),
  discovery_error = $2,
  discovery_summary = $3::jsonb,
  next_check_at = now() + interval '1 day',
  locked_at = NULL,
  locked_by = NULL,
  updated_at = now()
WHERE website_id = $1
  AND locked_by = $4;
```

## Smoke Expectations

For the first production smoke, use a batch of 5 or fewer Websites and record:

- Claimed Website count.
- Loaded Website count after the explicit load step.
- HTML page count crawled per Website.
- Emails upserted into `contact_methods.emails`.
- LinkedIn URLs upserted into `contact_methods.linkedin_profiles`.
- Observation rows inserted into `web_enrichment.website_contact_discovery_observations`.
- Status rows updated in `web_enrichment.website_contact_discovery_status`.
- Confirmation that no PDFs, media, or binary assets were fetched.

Archive temporary diagnostic workflows and write execution IDs, counts, and next steps into `HANDOFF.md` after production work.
