import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPO_ROOT / "infra" / "crm" / "schema" / "001-crm.sql"
CRM_CONTEXT_PATH = REPO_ROOT / "docs" / "contexts" / "crm.md"
CRM_README_PATH = REPO_ROOT / "infra" / "crm" / "README.md"
N8N_README_PATH = REPO_ROOT / "infra" / "n8n" / "README.md"
BIGQUERY_QUERY_PATH = (
    REPO_ROOT / "infra" / "crm" / "bigquery" / "http_archive_shopify_domains.sql"
)
N8N_WORKFLOW_CONTRACT_PATH = (
    REPO_ROOT / "infra" / "n8n" / "workflows" / "crm-website-shopify-enrichment.md"
)
HTTP_ARCHIVE_WORKFLOW_CONTRACT_PATH = (
    REPO_ROOT / "infra" / "n8n" / "workflows" / "http-archive-shopify-daily-pipeline.md"
)


class CrmSchemaContractTests(unittest.TestCase):
    def setUp(self):
        self.schema = SCHEMA_PATH.read_text(encoding="utf-8")
        self.crm_context = CRM_CONTEXT_PATH.read_text(encoding="utf-8")
        self.crm_readme = CRM_README_PATH.read_text(encoding="utf-8")
        self.n8n_readme = N8N_README_PATH.read_text(encoding="utf-8")

    def table_block(self, table_name):
        match = re.search(
            rf"CREATE TABLE IF NOT EXISTS {re.escape(table_name)} \((.*?)\n\);",
            self.schema,
            re.DOTALL,
        )
        self.assertIsNotNone(match, f"{table_name} should be defined")
        return match.group(1)

    def assertColumn(self, table_block, column_name, column_type):
        self.assertRegex(
            table_block,
            rf"\n  {re.escape(column_name)} {re.escape(column_type)}",
            f"{column_name} should be a {column_type} column",
        )

    def test_required_domain_schemas_are_created(self):
        for schema_name in [
            "business",
            "person",
            "crm",
            "public_sources",
            "web_enrichment",
        ]:
            with self.subTest(schema_name=schema_name):
                self.assertIn(f"CREATE SCHEMA IF NOT EXISTS {schema_name};", self.schema)

    def test_business_websites_is_canonical_domain_registry_without_shopify_columns(self):
        table = self.table_block("business.websites")

        expected_columns = [
            ("id", "uuid PRIMARY KEY DEFAULT gen_random_uuid()"),
            ("domain", "text NOT NULL"),
            ("raw_input", "text"),
            ("domain_type", "text NOT NULL DEFAULT 'unknown'"),
            ("created_at", "timestamptz NOT NULL DEFAULT now()"),
            ("updated_at", "timestamptz NOT NULL DEFAULT now()"),
        ]

        for column_name, column_type in expected_columns:
            with self.subTest(column_name=column_name):
                self.assertColumn(table, column_name, column_type)

        for old_shopify_column in [
            "shopify_status",
            "shopify_checked_at",
            "shopify_detection_signals",
            "shopify_detection_error",
            "shopify_check_attempts",
            "shopify_last_attempt_at",
            "shopify_next_check_at",
            "enrichment_locked_at",
            "enrichment_locked_by",
        ]:
            with self.subTest(old_shopify_column=old_shopify_column):
                self.assertNotIn(old_shopify_column, table)

        expected_schema_fragments = [
            "domain_type IN ('unknown', 'business', 'email_provider')",
            "CREATE UNIQUE INDEX IF NOT EXISTS websites_domain_unique",
            "ON business.websites (lower(domain))",
            "DROP TRIGGER IF EXISTS websites_set_updated_at ON business.websites",
            "BEFORE UPDATE ON business.websites",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_web_enrichment_owns_current_shopify_status(self):
        table = self.table_block("web_enrichment.website_shopify_status")

        expected_columns = [
            ("website_id", "uuid PRIMARY KEY REFERENCES business.websites(id) ON DELETE CASCADE"),
            ("status", "text NOT NULL DEFAULT 'unknown'"),
            ("checked_at", "timestamptz"),
            ("check_attempts", "integer NOT NULL DEFAULT 0"),
            ("last_attempt_at", "timestamptz"),
            ("next_check_at", "timestamptz"),
            ("detection_signals", "jsonb NOT NULL DEFAULT '{}'::jsonb"),
            ("detection_error", "text"),
            ("locked_at", "timestamptz"),
            ("locked_by", "text"),
            ("created_at", "timestamptz NOT NULL DEFAULT now()"),
            ("updated_at", "timestamptz NOT NULL DEFAULT now()"),
        ]

        for column_name, column_type in expected_columns:
            with self.subTest(column_name=column_name):
                self.assertColumn(table, column_name, column_type)

        expected_schema_fragments = [
            "status IN ('unknown', 'true', 'false')",
            "check_attempts >= 0",
            "CREATE INDEX IF NOT EXISTS website_shopify_status_poll_idx",
            "ON web_enrichment.website_shopify_status (status, next_check_at, locked_at)",
            "DROP TRIGGER IF EXISTS website_shopify_status_set_updated_at ON web_enrichment.website_shopify_status",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_person_tables_store_people_email_identity_and_person_email_links(self):
        people = self.table_block("person.people")
        email_addresses = self.table_block("person.email_addresses")
        person_email_addresses = self.table_block("person.person_email_addresses")

        for column_name, column_type in [
            ("id", "uuid PRIMARY KEY DEFAULT gen_random_uuid()"),
            ("display_name", "text NOT NULL"),
            ("organization", "text"),
            ("relationship_type", "text NOT NULL DEFAULT 'investor'"),
            ("relationship_stage", "text NOT NULL DEFAULT 'prospect'"),
            ("source_confidence", "text NOT NULL DEFAULT 'confirmed-user'"),
            ("owner", "text NOT NULL DEFAULT 'Allan'"),
        ]:
            with self.subTest(table="person.people", column_name=column_name):
                self.assertColumn(people, column_name, column_type)

        for column_name, column_type in [
            ("id", "uuid PRIMARY KEY DEFAULT gen_random_uuid()"),
            ("email", "text NOT NULL"),
            ("local_part", "text NOT NULL"),
            ("website_id", "uuid REFERENCES business.websites(id) ON DELETE SET NULL"),
            ("address_kind", "text NOT NULL DEFAULT 'unknown'"),
            ("source_confidence", "text NOT NULL DEFAULT 'needs-verification'"),
        ]:
            with self.subTest(table="person.email_addresses", column_name=column_name):
                self.assertColumn(email_addresses, column_name, column_type)

        for column_name, column_type in [
            ("person_id", "uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE"),
            (
                "email_address_id",
                "uuid NOT NULL REFERENCES person.email_addresses(id) ON DELETE CASCADE",
            ),
            ("relationship_status", "text NOT NULL DEFAULT 'candidate'"),
            ("is_primary", "boolean NOT NULL DEFAULT false"),
        ]:
            with self.subTest(table="person.person_email_addresses", column_name=column_name):
                self.assertColumn(person_email_addresses, column_name, column_type)

        expected_schema_fragments = [
            "address_kind IN ('personal', 'role', 'unknown')",
            "CREATE UNIQUE INDEX IF NOT EXISTS email_addresses_email_unique",
            "ON person.email_addresses (lower(email))",
            "PRIMARY KEY (person_id, email_address_id)",
            "CREATE UNIQUE INDEX IF NOT EXISTS person_email_addresses_primary_person_unique",
            "ON person.person_email_addresses (person_id)",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_crm_groups_and_campaigns_are_people_only(self):
        groups = self.table_block("crm.groups")
        person_group_memberships = self.table_block("crm.person_group_memberships")
        campaigns = self.table_block("crm.campaigns")
        campaign_recipients = self.table_block("crm.campaign_recipients")

        self.assertColumn(groups, "audience_type", "text NOT NULL DEFAULT 'investor'")
        self.assertColumn(
            person_group_memberships,
            "person_id",
            "uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE",
        )
        self.assertColumn(
            campaign_recipients,
            "person_id",
            "uuid NOT NULL REFERENCES person.people(id) ON DELETE CASCADE",
        )
        self.assertColumn(
            campaigns,
            "audience_group_id",
            "uuid REFERENCES crm.groups(id) ON DELETE SET NULL",
        )
        crm_blocks = groups + person_group_memberships + campaigns + campaign_recipients
        self.assertNotIn("business.websites", crm_blocks)
        self.assertNotIn("website_id", crm_blocks)

    def test_public_sources_http_archive_tables_are_source_named_and_link_to_websites(self):
        runs = self.table_block("public_sources.http_archive_runs")
        observations = self.table_block("public_sources.http_archive_observations")

        for column_name, column_type in [
            ("crawl_date", "date NOT NULL"),
            ("client", "text NOT NULL DEFAULT 'desktop'"),
            ("query_name", "text NOT NULL"),
            ("query_version", "text NOT NULL"),
            ("bigquery_job_id", "text"),
            ("n8n_execution_id", "text"),
            ("status", "text NOT NULL DEFAULT 'running'"),
            ("row_count", "integer NOT NULL DEFAULT 0"),
            ("query_params", "jsonb NOT NULL DEFAULT '{}'::jsonb"),
        ]:
            with self.subTest(table="public_sources.http_archive_runs", column_name=column_name):
                self.assertColumn(runs, column_name, column_type)

        for column_name, column_type in [
            (
                "run_id",
                "uuid NOT NULL REFERENCES public_sources.http_archive_runs(id) ON DELETE CASCADE",
            ),
            (
                "website_id",
                "uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE",
            ),
            ("primary_root_page_url", "text NOT NULL"),
            ("technologies", "text[] NOT NULL DEFAULT '{}'::text[]"),
            ("evidence", "jsonb NOT NULL DEFAULT '{}'::jsonb"),
        ]:
            with self.subTest(table="public_sources.http_archive_observations", column_name=column_name):
                self.assertColumn(observations, column_name, column_type)

        self.assertNotIn("canonical_domain", observations)
        self.assertNotIn(" domain text", observations)
        self.assertIn("http_archive_runs_unique", self.schema)
        self.assertIn("http_archive_observations_website_crawl_query_unique", self.schema)

    def test_business_website_lists_hold_domain_review_cohorts(self):
        lists = self.table_block("business.website_lists")
        memberships = self.table_block("business.website_list_memberships")

        self.assertColumn(lists, "slug", "text NOT NULL UNIQUE")
        self.assertColumn(lists, "purpose", "text NOT NULL")
        self.assertColumn(
            memberships,
            "website_id",
            "uuid NOT NULL REFERENCES business.websites(id) ON DELETE CASCADE",
        )
        self.assertColumn(
            memberships,
            "list_id",
            "uuid NOT NULL REFERENCES business.website_lists(id) ON DELETE CASCADE",
        )
        self.assertIn("'http-archive-shopify-daily'", self.schema)

    def test_public_source_tables_preserve_existing_source_dataset_contracts(self):
        table = self.table_block("public_sources.interview_source_entries")

        expected_columns = [
            ("id", "uuid PRIMARY KEY DEFAULT gen_random_uuid()"),
            ("person_id", "uuid REFERENCES person.people(id) ON DELETE SET NULL"),
            ("source_row_number", "integer NOT NULL"),
            ("source_name", "text NOT NULL"),
            ("picture", "text"),
            ("linkedin_url", "text"),
            ("interview_status", "text NOT NULL"),
            ("source_date_text", "text NOT NULL"),
            ("interview_at", "timestamptz"),
            ("contact_mode", "text"),
            ("company", "text"),
            ("role_title", "text"),
            ("ecosystem_role", "text"),
            ("email", "text"),
            ("phone", "text"),
            ("about", "text"),
            ("interview_strategy", "text"),
            ("interview_notes", "text"),
            ("transcript", "text"),
            ("jtbd_analysis", "text"),
            ("industry", "text"),
            ("source_payload", "jsonb NOT NULL DEFAULT '{}'::jsonb"),
            ("source_confidence", "text NOT NULL DEFAULT 'private-sourced'"),
            ("collected_at", "timestamptz NOT NULL DEFAULT now()"),
            ("created_at", "timestamptz NOT NULL DEFAULT now()"),
            ("updated_at", "timestamptz NOT NULL DEFAULT now()"),
        ]

        for column_name, column_type in expected_columns:
            with self.subTest(column_name=column_name):
                self.assertColumn(table, column_name, column_type)

        expected_schema_fragments = [
            "CREATE UNIQUE INDEX IF NOT EXISTS interview_source_entries_row_unique",
            "ON public_sources.interview_source_entries (source_row_number)",
            "CREATE INDEX IF NOT EXISTS interview_source_entries_email_idx",
            "ON public_sources.interview_source_entries (lower(email))",
            "CREATE INDEX IF NOT EXISTS interview_source_entries_linkedin_idx",
            "ON public_sources.interview_source_entries (lower(linkedin_url))",
            "CREATE INDEX IF NOT EXISTS interview_source_entries_person_idx",
            "ON public_sources.interview_source_entries (person_id)",
            "DROP TRIGGER IF EXISTS interview_source_entries_set_updated_at ON public_sources.interview_source_entries",
            "CREATE TRIGGER interview_source_entries_set_updated_at",
            "BEFORE UPDATE ON public_sources.interview_source_entries",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_crm_context_mentions_interview_source_data(self):
        self.assertIn("public_sources.interview_source_entries", self.crm_context)
        self.assertIn("Interview Source Data", self.crm_context)

    def test_schema_native_migration_copies_existing_public_tables_and_preserves_ids(self):
        expected_ordered_fragments = [
            "CREATE SCHEMA IF NOT EXISTS migration_backup;",
            "INSERT INTO person.people",
            "SELECT",
            "legacy.id",
            "INSERT INTO business.websites",
            "INSERT INTO web_enrichment.website_shopify_status",
            "INSERT INTO person.email_addresses",
            "INSERT INTO person.person_email_addresses",
            "INSERT INTO crm.groups",
            "INSERT INTO crm.person_group_memberships",
            "INSERT INTO crm.campaigns",
            "INSERT INTO crm.campaign_recipients",
            "INSERT INTO crm.email_events",
            "INSERT INTO crm.notes",
            "INSERT INTO crm.follow_ups",
            "ALTER TABLE public.crm_contacts RENAME TO crm_contacts_legacy_backup",
            "CREATE OR REPLACE VIEW public.crm_contacts AS",
        ]

        last_index = -1
        for fragment in expected_ordered_fragments:
            with self.subTest(fragment=fragment):
                current_index = self.schema.find(fragment, last_index + 1)
                self.assertNotEqual(current_index, -1, f"{fragment} should be present")
                self.assertGreater(current_index, last_index, f"{fragment} should be in migration order")
                last_index = current_index

        for provider_domain in ["gmail.com", "outlook.com", "icloud.com", "yahoo.com", "protonmail.com"]:
            with self.subTest(provider_domain=provider_domain):
                self.assertIn(provider_domain, self.schema)
        self.assertIn("domain_type = 'email_provider'", self.schema)

    def test_compatibility_views_are_read_only_and_old_names_are_temporary(self):
        expected_fragments = [
            "CREATE OR REPLACE FUNCTION public.crm_compatibility_view_is_read_only()",
            "RAISE EXCEPTION 'public.crm_% is a read-only compatibility view; write schema-native tables instead'",
            "CREATE OR REPLACE VIEW public.crm_websites AS",
            "FROM business.websites website",
            "LEFT JOIN web_enrichment.website_shopify_status shopify",
            "CREATE TRIGGER crm_websites_read_only",
            "INSTEAD OF INSERT OR UPDATE OR DELETE ON public.crm_websites",
            "CREATE OR REPLACE VIEW public.crm_contact_groups AS",
            "FROM crm.person_group_memberships membership",
            "CREATE OR REPLACE VIEW public.crm_campaign_recipients AS",
            "person_id AS contact_id",
        ]

        for fragment in expected_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_review_views_join_schema_native_source_and_enrichment_tables(self):
        expected_fragments = [
            "CREATE OR REPLACE VIEW business.website_shopify_review AS",
            "FROM business.websites website",
            "LEFT JOIN web_enrichment.website_shopify_status status",
            "LEFT JOIN public_sources.http_archive_observations observation",
            "CREATE OR REPLACE VIEW public_sources.http_archive_shopify_review AS",
            "FROM public_sources.http_archive_runs run",
            "JOIN public_sources.http_archive_observations observation",
            "JOIN business.websites website",
            "LEFT JOIN web_enrichment.website_shopify_status shopify",
        ]

        for fragment in expected_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_http_archive_bigquery_query_is_parameterized_and_domain_rollup(self):
        self.assertTrue(BIGQUERY_QUERY_PATH.exists(), "HTTP Archive BigQuery SQL should exist")
        query = BIGQUERY_QUERY_PATH.read_text(encoding="utf-8")

        expected_fragments = [
            "`httparchive.crawl.pages`",
            "@crawl_date AS crawl_date",
            "@client AS client",
            "NET.REG_DOMAIN(root_page) AS canonical_domain",
            "t.technology IN ('Shopify', 'Shopify Plus')",
            "GROUP BY crawl_date, client, canonical_domain",
            "LIMIT @max_rows",
        ]

        for fragment in expected_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, query)

    def test_n8n_workflow_contract_documents_schema_native_polling_and_shopify_rules(self):
        self.assertTrue(
            N8N_WORKFLOW_CONTRACT_PATH.exists(),
            "n8n workflow contract doc should exist",
        )
        contract = N8N_WORKFLOW_CONTRACT_PATH.read_text(encoding="utf-8")

        expected_fragments = [
            "crm database",
            "not the `nocodb` metadata database",
            "every 30 minutes",
            "website-email-domain-discovery",
            "website-shopify-enrichment",
            "crm_writer",
            "domain_type != 'email_provider'",
            "status.status = 'unknown'",
            "Failed or partial checks keep `web_enrichment.website_shopify_status.status = 'unknown'`",
            "business.websites",
            "person.email_addresses",
            "web_enrichment.website_shopify_status",
            "locked_at",
            "locked_by",
        ]

        for fragment in expected_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, contract)

    def test_http_archive_daily_workflow_contract_documents_direct_bigquery_and_idempotent_writes(self):
        self.assertTrue(
            HTTP_ARCHIVE_WORKFLOW_CONTRACT_PATH.exists(),
            "HTTP Archive daily workflow contract doc should exist",
        )
        contract = HTTP_ARCHIVE_WORKFLOW_CONTRACT_PATH.read_text(encoding="utf-8")

        expected_fragments = [
            "CipherPlay Public Sources - HTTP Archive Shopify Daily",
            "Daily schedule",
            "manual run",
            "crawl_date",
            "client",
            "max_rows",
            "Run the BigQuery query directly from n8n",
            "production service account",
            "roles/bigquery.jobUser",
            "Do not use CSV import as the primary path",
            "business.websites",
            "public_sources.http_archive_runs",
            "public_sources.http_archive_observations",
            "web_enrichment.website_shopify_status",
            "http-archive-shopify-daily",
        ]

        for fragment in expected_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, contract)

    def test_docs_describe_schema_boundaries_and_people_only_crm_v1(self):
        for doc_name, doc in [
            ("docs/contexts/crm.md", self.crm_context),
            ("infra/crm/README.md", self.crm_readme),
            ("infra/n8n/README.md", self.n8n_readme),
        ]:
            for fragment in [
                "business.websites",
                "person.people",
                "public_sources.http_archive_observations",
                "web_enrichment.website_shopify_status",
                "people-only",
                "read-only compatibility",
            ]:
                with self.subTest(doc_name=doc_name, fragment=fragment):
                    self.assertIn(fragment, doc)


if __name__ == "__main__":
    unittest.main()
