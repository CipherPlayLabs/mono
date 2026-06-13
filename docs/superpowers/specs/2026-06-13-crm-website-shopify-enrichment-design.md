# CRM Website Shopify Enrichment Design

Date: 2026-06-13

## Goal

Add low-coupled website and email identity tables to the CipherPlay CRM so operators can enter or discover canonical domains, preserve observed email addresses separately from contacts, and let n8n enrich website rows with Shopify detection results.

PostgreSQL remains the source of truth. NocoDB stays the operator UI. n8n reads and writes the `crm` database directly as the automation layer.

## Approved Decisions

- One `Website` means one canonical registrable domain, such as `example.com`.
- Preserve raw submitted URLs or hosts as input provenance, but do not make every URL or subdomain a first-class website row.
- Email addresses are their own canonical observed-identity table, separate from `crm_contacts`.
- Contacts link to email addresses through a join table.
- Fully migrate away from `crm_contacts.email`.
- Preserve all existing `crm_contacts.email` values and contact associations during migration.
- Every new email address should derive its email domain and link to a website row, creating the website row when missing.
- Common inbox-provider domains such as `gmail.com`, `outlook.com`, `icloud.com`, and `yahoo.com` should still get website rows for association, but should be classified as `email_provider` and skipped for Shopify enrichment.
- Website domain type should be small and operational: `unknown`, `business`, or `email_provider`.
- Shopify status should be ternary: `unknown`, `true`, or `false`.
- Detailed Shopify detection signals should be preserved as supporting/debug evidence, not as the primary operator-facing status.
- Postgres owns the data contract.
- n8n polls every 30 minutes for new or unresolved website/email enrichment work.
- Failed or partial checks should not become `false`; they should remain `unknown` with error and retry metadata.

## Glossary Additions

These terms are captured in `docs/contexts/crm.md` and should guide implementation:

- `Website`: canonical registrable domain tracked as one CRM row.
- `Website Domain Type`: `unknown`, `business`, or `email_provider`.
- `Email Address`: observed email identity separate from contacts.
- `Email Domain Website Discovery`: every new email address derives and links a website row.
- `Contact Email Address`: trusted or candidate link between a contact and an email address.
- `Shopify Website Status`: `unknown`, `true`, or `false`.
- `Website Enrichment`: n8n process that updates website rows and preserves supporting signals.

## Data Model

### `crm_websites`

Stores canonical website/domain rows.

Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `domain text NOT NULL`
- `raw_input text`
- `domain_type text NOT NULL DEFAULT 'unknown'`
- `shopify_status text NOT NULL DEFAULT 'unknown'`
- `shopify_checked_at timestamptz`
- `shopify_detection_signals jsonb NOT NULL DEFAULT '{}'::jsonb`
- `shopify_detection_error text`
- `shopify_check_attempts integer NOT NULL DEFAULT 0`
- `shopify_last_attempt_at timestamptz`
- `shopify_next_check_at timestamptz`
- `enrichment_locked_at timestamptz`
- `enrichment_locked_by text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- Unique index on `lower(domain)`.
- Check `domain_type IN ('unknown', 'business', 'email_provider')`.
- Check `shopify_status IN ('unknown', 'true', 'false')`.
- Check `shopify_check_attempts >= 0`.
- Index for enrichment polling on `shopify_status`, `domain_type`, `shopify_next_check_at`, and lock fields.

Implementation note: use text status values rather than SQL booleans so NocoDB presents the ternary state clearly.

### `crm_email_addresses`

Stores canonical observed email addresses.

Suggested columns:

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `email text NOT NULL`
- `local_part text NOT NULL`
- `email_domain text NOT NULL`
- `website_id uuid REFERENCES crm_websites(id) ON DELETE SET NULL`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `raw_source text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- Unique index on `lower(email)`.
- Index on `lower(email_domain)`.
- Index on `website_id` when not null.
- Check `source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')`.

Email normalization should lower-case the domain and the full address for identity comparisons. The raw original source can remain in source payloads or `raw_source`.

### `crm_contact_email_addresses`

Stores contact-to-email associations.

Suggested columns:

- `contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE`
- `email_address_id uuid NOT NULL REFERENCES crm_email_addresses(id) ON DELETE CASCADE`
- `relationship_status text NOT NULL DEFAULT 'candidate'`
- `is_primary boolean NOT NULL DEFAULT false`
- `source_confidence text NOT NULL DEFAULT 'needs-verification'`
- `association_notes text`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

Constraints and indexes:

- Primary key on `(contact_id, email_address_id)`.
- Check `relationship_status IN ('candidate', 'likely', 'claimed', 'rejected')`.
- Check `source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')`.
- Partial unique index for one primary email per contact where `is_primary = true` and `relationship_status != 'rejected'`.
- Index on `email_address_id`.

## Migration From `crm_contacts.email`

The migration must preserve all existing production email values before dropping the old column.

Migration sequence:

1. Create `crm_websites`, `crm_email_addresses`, and `crm_contact_email_addresses`.
2. For every existing `crm_contacts.email IS NOT NULL`, normalize the address.
3. Derive `email_domain`.
4. Create or reuse `crm_websites.domain = email_domain`.
5. Classify common inbox-provider domains as `email_provider`; otherwise default to `unknown`.
6. Create or reuse `crm_email_addresses.email`.
7. Create `crm_contact_email_addresses` links with:
   - `relationship_status = 'claimed'`
   - `is_primary = true`
   - `source_confidence` copied from `crm_contacts.source_confidence` where sensible, otherwise `confirmed-user`
8. Drop `crm_contacts_email_unique`.
9. Drop `crm_contacts.email`.

The migration should be idempotent enough to survive reapplication through the existing Cloud SQL import flow. Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `INSERT ... ON CONFLICT`, and guarded `ALTER TABLE` operations.

## Website Domain Classification

Start with a small built-in provider-domain list:

- `gmail.com`
- `googlemail.com`
- `outlook.com`
- `hotmail.com`
- `live.com`
- `msn.com`
- `icloud.com`
- `me.com`
- `mac.com`
- `yahoo.com`
- `ymail.com`
- `aol.com`
- `proton.me`
- `protonmail.com`

These domains should get `domain_type = 'email_provider'`.

All other domains created from email addresses default to `unknown`. Operator review or later enrichment may set `business`.

## n8n Workflow Contracts

### `website-email-domain-discovery`

Runs every 30 minutes.

Purpose:

- Find `crm_email_addresses` where `website_id IS NULL`.
- Derive canonical `email_domain`.
- Create or reuse a matching `crm_websites` row.
- Set `domain_type = 'email_provider'` for known provider domains.
- Link `crm_email_addresses.website_id` to the website row.

This workflow may also be implemented as the first phase of the Shopify enrichment workflow if that is simpler in n8n.

Suggested select shape:

```sql
SELECT id, email, email_domain
FROM crm_email_addresses
WHERE website_id IS NULL
ORDER BY created_at ASC
LIMIT 100;
```

### `website-shopify-enrichment`

Runs every 30 minutes.

Purpose:

- Claim a bounded batch of website rows eligible for Shopify detection.
- Run DNS, HTTP, and HTML checks.
- Update `shopify_status`, timestamp, attempts, error, and detection signals.
- Release the enrichment lock after completion.

Eligibility:

- `shopify_status = 'unknown'`
- `domain_type != 'email_provider'`
- `shopify_next_check_at IS NULL OR shopify_next_check_at <= now()`
- lock is empty or stale

Use bounded batches, for example 25-100 websites per run, to avoid slow or noisy executions.

The lock fields exist to prevent overlapping n8n executions from working the same row. Use a unique execution id in `enrichment_locked_by`.

## Shopify Detection

The detector should treat Shopify as a multi-signal conclusion, not a single DNS lookup.

Signals:

- DNS: `www.<domain>` CNAME ends in `shops.myshopify.com`.
- DNS: apex A record is in `23.227.38.x`.
- DNS: apex or host IPv6 includes `2620:0127:f00f:5::` where supported.
- HTTP: `https://<domain>/meta.json` exposes Shopify metadata.
- HTTP: `https://<domain>/cart.js` returns Shopify cart JSON.
- HTML: homepage contains `cdn.shopify.com`, `window.Shopify`, `Shopify.theme`, or `myshopify.com`.

Status rules:

- Set `shopify_status = 'true'` when at least one strong Shopify signal is present.
- Set `shopify_status = 'false'` only when checks completed and no Shopify signals were found.
- Keep `shopify_status = 'unknown'` when the run fails before enough checks complete.
- Store raw signal results in `shopify_detection_signals`.
- Store concise failure text in `shopify_detection_error`.

The evidence JSON should be compact and stable enough for debugging, for example:

```json
{
  "dns": {
    "www_cname": "shops.myshopify.com",
    "apex_a": ["23.227.38.65"],
    "apex_aaaa": []
  },
  "http": {
    "meta_json": {"status": 200, "matched": true},
    "cart_js": {"status": 200, "matched": true},
    "homepage": {"status": 200, "matches": ["cdn.shopify.com", "window.Shopify"]}
  },
  "conclusion": {
    "status": "true",
    "reason": "www CNAME and cart.js matched Shopify"
  }
}
```

## NocoDB Operator View

NocoDB should expose the new CRM data tables from the `crm` database, not from the `nocodb` metadata database.

Operator-friendly visible fields:

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

Raw JSON detection signals should remain available but not be the primary operator surface.

## Repository Changes

Expected implementation changes:

- Update `infra/crm/schema/001-crm.sql`.
- Update `infra/crm/tests/test_schema_contract.py`.
- Add tests for website/email table contracts and migration expectations.
- Add a repo-owned n8n workflow contract doc under `infra/n8n/`, for example `infra/n8n/workflows/crm-website-shopify-enrichment.md`.
- Update `infra/crm/README.md`.
- Update `docs/contexts/crm.md` if implementation sharpens any term further.

Do not commit real contact data, email addresses, private domains, n8n credentials, Cloud SQL passwords, or NocoDB screenshots.

## Verification

Local verification:

```bash
python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer
```

Schema checks should verify:

- `crm_websites` exists with domain uniqueness, domain type check, Shopify status check, enrichment metadata, and updated-at trigger.
- `crm_email_addresses` exists with normalized email indexes and website linkage.
- `crm_contact_email_addresses` exists with contact/email foreign keys and association status checks.
- `crm_contacts.email` is absent.
- `crm_contacts_email_unique` is absent.
- Existing source tables still retain their low-coupled contact linkage.

Workflow contract checks should verify:

- n8n never writes to the `nocodb` metadata database.
- n8n polling cadence is 30 minutes.
- Email-domain discovery creates website rows for missing domains.
- Email-provider domains are skipped for Shopify enrichment.
- Failed Shopify checks keep status `unknown`.

Production deployment verification:

- Apply the schema through the existing `crm-schema-apply.yml` production-gated workflow.
- Confirm the `crm` database remains the import target.
- Confirm NocoDB can show the new tables from the external `crm` data source.
- Confirm n8n can connect to the `crm` database as `crm_writer`.
- Add test rows in NocoDB and confirm the next 30-minute n8n poll updates website associations and Shopify status.

## Risks And Mitigations

- **Dropping `crm_contacts.email` can lose data if migration order is wrong.** Mitigate by inserting email rows and contact associations before dropping the column, and by testing the migration SQL with representative rows.
- **Public website checks can be slow or flaky.** Mitigate with bounded batches, timeouts, retry metadata, and `unknown` for incomplete checks.
- **Email provider domains can pollute ecommerce prospecting.** Mitigate with `domain_type = 'email_provider'` and skip Shopify enrichment for those rows.
- **Polling can duplicate work if executions overlap.** Mitigate with lock fields and stale-lock recovery.
- **A DNS-only Shopify conclusion can be wrong.** Mitigate with multi-signal detection and preserved evidence.
- **n8n workflow JSON can drift from schema docs.** Mitigate by keeping a workflow contract doc in the repo before or alongside actual n8n workflow creation.

## Next Agent Prompt

Use this prompt to start implementation:

```text
You are working in C:\Users\allan\Documents\CipherPlay\mono. Implement the CRM website Shopify enrichment design documented at docs/superpowers/specs/2026-06-13-crm-website-shopify-enrichment-design.md.

Important constraints:
- Read AGENTS.md, docs/contexts/crm.md, infra/crm/README.md, infra/crm/schema/001-crm.sql, infra/crm/tests/test_schema_contract.py, and infra/n8n/README.md before editing.
- PostgreSQL owns the CRM data contract. NocoDB is the UI. n8n writes directly to the `crm` database as `crm_writer`.
- Add canonical website and email identity tables: crm_websites, crm_email_addresses, and crm_contact_email_addresses.
- Fully migrate away from crm_contacts.email while preserving every existing email and contact association.
- One Website row means one canonical registrable domain.
- Shopify status is ternary text: unknown, true, false.
- Domain type is text: unknown, business, email_provider.
- New email addresses should derive/link/create website rows from their email domains.
- Common email-provider domains should get website rows but skip Shopify enrichment.
- n8n should poll every 30 minutes, not rely on database triggers or NocoDB API coupling.
- Preserve Shopify detection evidence in JSON while keeping the main operator status simple.
- Keep all private contact/email/domain data and secrets out of git.
- Use apply_patch for manual edits.
- Add or update tests before/with schema implementation.
- Run `python -m unittest infra.crm.tests.test_schema_contract infra.crm.tests.test_founder_institute_importer` from the mono repo before handing back.
```
