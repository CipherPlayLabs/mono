# CRM Website Shopify Enrichment Workflow Contract

This contract defines the n8n workflow boundary for CRM website and email-domain enrichment. n8n connects as `crm_writer` to the `crm database`, not the `nocodb` metadata database, and writes directly to the PostgreSQL tables that NocoDB exposes as the operator UI.

Do not put Cloud SQL passwords, NocoDB credentials, private domains, or contact email samples in this file or in exported workflow JSON.

## Runtime Boundary

- Database: `crm`
- User: `crm_writer`
- UI reflection layer: NocoDB external data source pointed at the `crm` database
- Forbidden target: the `nocodb` metadata database
- Cadence: every 30 minutes
- Batch size: bounded batches of 25-100 rows per execution

## Workflow: website-email-domain-discovery

Purpose: link observed email identities to canonical Website rows.

Run every 30 minutes, or as the first phase of `website-shopify-enrichment`.

Select rows that still need a Website association:

```sql
SELECT id, email, email_domain
FROM crm_email_addresses
WHERE website_id IS NULL
ORDER BY created_at ASC
LIMIT 100;
```

For each row:

1. Normalize `email_domain` to the canonical lower-case registrable domain already stored on `crm_email_addresses`.
2. Insert or reuse a `crm_websites` row where `lower(domain) = email_domain`.
3. Set `domain_type = 'email_provider'` for known provider domains such as `gmail.com`, `outlook.com`, `icloud.com`, `yahoo.com`, and `protonmail.com`; otherwise leave new rows as `unknown`.
4. Update `crm_email_addresses.website_id` to the matching Website row.

This workflow creates website rows for missing domains; it does not promote an email identity into a contact.

## Workflow: website-shopify-enrichment

Purpose: detect Shopify usage for eligible business-domain Website rows while preserving supporting signals.

Run every 30 minutes and claim a bounded batch:

```sql
UPDATE crm_websites
SET
  enrichment_locked_at = now(),
  enrichment_locked_by = $1,
  shopify_last_attempt_at = now(),
  shopify_check_attempts = shopify_check_attempts + 1,
  updated_at = now()
WHERE id IN (
  SELECT id
  FROM crm_websites
  WHERE shopify_status = 'unknown'
    AND domain_type != 'email_provider'
    AND (shopify_next_check_at IS NULL OR shopify_next_check_at <= now())
    AND (
      enrichment_locked_at IS NULL
      OR enrichment_locked_at < now() - interval '45 minutes'
    )
  ORDER BY created_at ASC
  LIMIT 50
  FOR UPDATE SKIP LOCKED
)
RETURNING id, domain;
```

Use a unique n8n execution id for `enrichment_locked_by`.

## Detection Signals

Treat Shopify as a multi-signal conclusion:

- DNS: `www.<domain>` CNAME ends in `shops.myshopify.com`.
- DNS: apex A record is in `23.227.38.x`.
- DNS: apex or host IPv6 includes `2620:0127:f00f:5::` when supported.
- HTTP: `https://<domain>/meta.json` exposes Shopify metadata.
- HTTP: `https://<domain>/cart.js` returns Shopify cart JSON.
- HTML: homepage contains `cdn.shopify.com`, `window.Shopify`, `Shopify.theme`, or `myshopify.com`.

Set `shopify_status = 'true'` when at least one strong Shopify signal is present. Set `shopify_status = 'false'` only when checks completed and no Shopify signals were found.

Failed or partial checks keep `shopify_status = 'unknown'`. Store concise failure text in `shopify_detection_error`, preserve compact debug evidence in `shopify_detection_signals`, set `shopify_next_check_at` for retry, and always clear `enrichment_locked_at` plus `enrichment_locked_by` before the execution exits.

## Successful Update Shape

```sql
UPDATE crm_websites
SET
  shopify_status = $2,
  shopify_checked_at = now(),
  shopify_detection_signals = $3::jsonb,
  shopify_detection_error = NULL,
  shopify_next_check_at = NULL,
  enrichment_locked_at = NULL,
  enrichment_locked_by = NULL,
  updated_at = now()
WHERE id = $1
  AND enrichment_locked_by = $4;
```

## Failed Or Partial Update Shape

```sql
UPDATE crm_websites
SET
  shopify_status = 'unknown',
  shopify_detection_signals = $2::jsonb,
  shopify_detection_error = $3,
  shopify_next_check_at = now() + interval '1 day',
  enrichment_locked_at = NULL,
  enrichment_locked_by = NULL,
  updated_at = now()
WHERE id = $1
  AND enrichment_locked_by = $4;
```

## Operator Surface

NocoDB should expose these CRM data fields from the external `crm` data source:

- `crm_websites.domain`
- `crm_websites.domain_type`
- `crm_websites.shopify_status`
- `crm_websites.shopify_checked_at`
- `crm_websites.shopify_detection_error`
- `crm_email_addresses.email`
- `crm_email_addresses.email_domain`
- `crm_email_addresses.website_id`
- `crm_contact_email_addresses.relationship_status`
- `crm_contact_email_addresses.is_primary`

`shopify_detection_signals` should remain available for debugging but should not be the primary operator-facing status.
