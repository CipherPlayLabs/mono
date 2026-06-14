# CRM Website Shopify Enrichment Workflow Contract

This contract defines the n8n workflow boundary for website and email-domain enrichment. n8n connects as `crm_writer` to the `crm database`, not the `nocodb` metadata database, and writes directly to schema-native PostgreSQL tables that NocoDB exposes for review.

Do not put Cloud SQL passwords, NocoDB credentials, private domains, contact email samples, or exported workflow secrets in this file.

## Runtime Boundary

- Database: `crm`
- User: `crm_writer`
- UI reflection layer: NocoDB external data source pointed at the `crm` database
- Forbidden target: the `nocodb` metadata database
- Cadence: every 30 minutes
- Batch size: bounded batches of 25-100 rows per execution
- Domain registry: `business.websites`
- Email identity table: `person.email_addresses`
- Current Shopify state table: `web_enrichment.website_shopify_status`

## Workflow: website-email-domain-discovery

Purpose: link observed email identities to canonical Website rows.

Run every 30 minutes, or as the first phase of `website-shopify-enrichment`.

Select rows that still need a Website association:

```sql
SELECT
  id,
  email,
  split_part(email, '@', 2) AS email_domain
FROM person.email_addresses
WHERE website_id IS NULL
  AND position('@' in email) > 1
ORDER BY created_at ASC
LIMIT 100;
```

For each row:

1. Normalize `email_domain` to a lower-case registrable domain.
2. Insert or reuse a `business.websites` row where `lower(domain) = email_domain`.
3. Set `domain_type = 'email_provider'` for known provider domains such as `gmail.com`, `outlook.com`, `icloud.com`, `yahoo.com`, and `protonmail.com`; otherwise leave new rows as `unknown`.
4. Update `person.email_addresses.website_id` to the matching Website row.

This workflow creates Website rows for missing domains; it does not promote an email identity into a Person.

## Workflow: website-shopify-enrichment

Purpose: detect current Shopify usage for eligible business-domain Website rows while preserving supporting signals.

Before claiming a batch, ensure every Website has a current-state row:

```sql
INSERT INTO web_enrichment.website_shopify_status (website_id)
SELECT website.id
FROM business.websites website
ON CONFLICT (website_id) DO NOTHING;
```

Run every 30 minutes and claim a bounded batch:

```sql
WITH claimed AS (
  UPDATE web_enrichment.website_shopify_status status
  SET
    locked_at = now(),
    locked_by = $1,
    last_attempt_at = now(),
    check_attempts = status.check_attempts + 1,
    updated_at = now()
  FROM business.websites website
  WHERE status.website_id = website.id
    AND status.status = 'unknown'
    AND website.domain_type != 'email_provider'
    AND (status.next_check_at IS NULL OR status.next_check_at <= now())
    AND (
      status.locked_at IS NULL
      OR status.locked_at < now() - interval '45 minutes'
    )
    AND status.website_id IN (
      SELECT status_inner.website_id
      FROM web_enrichment.website_shopify_status status_inner
      JOIN business.websites website_inner
        ON website_inner.id = status_inner.website_id
      WHERE status_inner.status = 'unknown'
        AND website_inner.domain_type != 'email_provider'
        AND (status_inner.next_check_at IS NULL OR status_inner.next_check_at <= now())
        AND (
          status_inner.locked_at IS NULL
          OR status_inner.locked_at < now() - interval '45 minutes'
        )
      ORDER BY website_inner.created_at ASC
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    )
  RETURNING
    website.id,
    website.domain,
    status.locked_by
)
SELECT id, domain, locked_by
FROM claimed;
```

Use a unique n8n execution id for `locked_by`.

## Detection Signals

Treat Shopify as a multi-signal conclusion:

- DNS: `www.<domain>` CNAME ends in `shops.myshopify.com`.
- DNS: apex A record is in `23.227.38.x`.
- DNS: apex or host IPv6 includes `2620:0127:f00f:5::` when supported.
- HTTP: `https://<domain>/meta.json` exposes Shopify metadata.
- HTTP: `https://<domain>/cart.js` returns Shopify cart JSON.
- HTML: homepage contains `cdn.shopify.com`, `window.Shopify`, `Shopify.theme`, or `myshopify.com`.

Set `web_enrichment.website_shopify_status.status = 'true'` when at least one strong Shopify signal is present. Set status to `false` only when checks completed and no Shopify signals were found.

Failed or partial checks keep `web_enrichment.website_shopify_status.status = 'unknown'`. Store concise failure text in `detection_error`, preserve compact debug evidence in `detection_signals`, set `next_check_at` for retry, and always clear `locked_at` plus `locked_by` before the execution exits.

## Successful Update Shape

```sql
UPDATE web_enrichment.website_shopify_status
SET
  status = $2,
  checked_at = now(),
  detection_signals = $3::jsonb,
  detection_error = NULL,
  next_check_at = NULL,
  locked_at = NULL,
  locked_by = NULL,
  updated_at = now()
WHERE website_id = $1
  AND locked_by = $4;
```

## Failed Or Partial Update Shape

```sql
UPDATE web_enrichment.website_shopify_status
SET
  status = 'unknown',
  detection_signals = $2::jsonb,
  detection_error = $3,
  next_check_at = now() + interval '1 day',
  locked_at = NULL,
  locked_by = NULL,
  updated_at = now()
WHERE website_id = $1
  AND locked_by = $4;
```

## Operator Surface

NocoDB should expose schema-native tables and review views:

- `business.websites.domain`
- `business.websites.domain_type`
- `person.email_addresses.email`
- `person.email_addresses.website_id`
- `person.person_email_addresses.relationship_status`
- `person.person_email_addresses.is_primary`
- `web_enrichment.website_shopify_status.status`
- `web_enrichment.website_shopify_status.checked_at`
- `web_enrichment.website_shopify_status.detection_error`
- `business.website_shopify_review`

`detection_signals` should remain available for debugging but should not be the primary operator-facing status.

The old `public.crm_websites` and related `public.crm_*` names are read-only compatibility views during cutover. n8n must write schema-native tables only.
