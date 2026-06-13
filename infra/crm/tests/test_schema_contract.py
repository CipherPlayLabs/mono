import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPO_ROOT / "infra" / "crm" / "schema" / "001-crm.sql"
CRM_CONTEXT_PATH = REPO_ROOT / "docs" / "contexts" / "crm.md"
N8N_WORKFLOW_CONTRACT_PATH = (
    REPO_ROOT / "infra" / "n8n" / "workflows" / "crm-website-shopify-enrichment.md"
)


class CrmSchemaContractTests(unittest.TestCase):
    def setUp(self):
        self.schema = SCHEMA_PATH.read_text(encoding="utf-8")
        self.crm_context = CRM_CONTEXT_PATH.read_text(encoding="utf-8")

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

    def test_interview_source_entries_preserve_csv_and_link_to_contacts(self):
        table = self.table_block("crm_interview_source_entries")

        expected_columns = [
            ("id", "uuid PRIMARY KEY DEFAULT gen_random_uuid()"),
            ("contact_id", "uuid REFERENCES crm_contacts(id) ON DELETE SET NULL"),
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

        self.assertIn("crm_interview_source_entries_source_row_number_check", table)
        self.assertIn("source_row_number >= 1", table)
        self.assertIn("crm_interview_source_entries_source_confidence_check", table)
        self.assertIn(
            "source_confidence IN ('private-sourced', 'needs-verification')",
            table,
        )

    def test_interview_source_entries_have_import_friendly_indexes_and_trigger(self):
        expected_schema_fragments = [
            "CREATE UNIQUE INDEX IF NOT EXISTS crm_interview_source_entries_row_unique",
            "ON crm_interview_source_entries (source_row_number)",
            "CREATE INDEX IF NOT EXISTS crm_interview_source_entries_email_idx",
            "ON crm_interview_source_entries (lower(email))",
            "CREATE INDEX IF NOT EXISTS crm_interview_source_entries_linkedin_idx",
            "ON crm_interview_source_entries (lower(linkedin_url))",
            "CREATE INDEX IF NOT EXISTS crm_interview_source_entries_contact_idx",
            "ON crm_interview_source_entries (contact_id)",
            "DROP TRIGGER IF EXISTS crm_interview_source_entries_set_updated_at",
            "CREATE TRIGGER crm_interview_source_entries_set_updated_at",
            "BEFORE UPDATE ON crm_interview_source_entries",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_crm_context_mentions_interview_source_data(self):
        self.assertIn("crm_interview_source_entries", self.crm_context)
        self.assertIn("Interview Source Data", self.crm_context)

    def test_websites_table_tracks_domains_and_shopify_enrichment_state(self):
        table = self.table_block("crm_websites")

        expected_columns = [
            ("id", "uuid PRIMARY KEY DEFAULT gen_random_uuid()"),
            ("domain", "text NOT NULL"),
            ("raw_input", "text"),
            ("domain_type", "text NOT NULL DEFAULT 'unknown'"),
            ("shopify_status", "text NOT NULL DEFAULT 'unknown'"),
            ("shopify_checked_at", "timestamptz"),
            ("shopify_detection_signals", "jsonb NOT NULL DEFAULT '{}'::jsonb"),
            ("shopify_detection_error", "text"),
            ("shopify_check_attempts", "integer NOT NULL DEFAULT 0"),
            ("shopify_last_attempt_at", "timestamptz"),
            ("shopify_next_check_at", "timestamptz"),
            ("enrichment_locked_at", "timestamptz"),
            ("enrichment_locked_by", "text"),
            ("created_at", "timestamptz NOT NULL DEFAULT now()"),
            ("updated_at", "timestamptz NOT NULL DEFAULT now()"),
        ]

        for column_name, column_type in expected_columns:
            with self.subTest(column_name=column_name):
                self.assertColumn(table, column_name, column_type)

        expected_schema_fragments = [
            "domain_type IN ('unknown', 'business', 'email_provider')",
            "shopify_status IN ('unknown', 'true', 'false')",
            "shopify_check_attempts >= 0",
            "CREATE UNIQUE INDEX IF NOT EXISTS crm_websites_domain_unique",
            "ON crm_websites (lower(domain))",
            "CREATE INDEX IF NOT EXISTS crm_websites_enrichment_poll_idx",
            "ON crm_websites (shopify_status, domain_type, shopify_next_check_at, enrichment_locked_at)",
            "DROP TRIGGER IF EXISTS crm_websites_set_updated_at",
            "BEFORE UPDATE ON crm_websites",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_email_addresses_table_links_observed_email_identity_to_websites(self):
        table = self.table_block("crm_email_addresses")

        expected_columns = [
            ("id", "uuid PRIMARY KEY DEFAULT gen_random_uuid()"),
            ("email", "text NOT NULL"),
            ("local_part", "text NOT NULL"),
            ("email_domain", "text NOT NULL"),
            ("website_id", "uuid REFERENCES crm_websites(id) ON DELETE SET NULL"),
            ("source_confidence", "text NOT NULL DEFAULT 'needs-verification'"),
            ("raw_source", "text"),
            ("created_at", "timestamptz NOT NULL DEFAULT now()"),
            ("updated_at", "timestamptz NOT NULL DEFAULT now()"),
        ]

        for column_name, column_type in expected_columns:
            with self.subTest(column_name=column_name):
                self.assertColumn(table, column_name, column_type)

        expected_schema_fragments = [
            "source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')",
            "CREATE UNIQUE INDEX IF NOT EXISTS crm_email_addresses_email_unique",
            "ON crm_email_addresses (lower(email))",
            "CREATE INDEX IF NOT EXISTS crm_email_addresses_domain_idx",
            "ON crm_email_addresses (lower(email_domain))",
            "CREATE INDEX IF NOT EXISTS crm_email_addresses_website_idx",
            "ON crm_email_addresses (website_id)",
            "DROP TRIGGER IF EXISTS crm_email_addresses_set_updated_at",
            "BEFORE UPDATE ON crm_email_addresses",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_contact_email_addresses_table_replaces_contact_email_column(self):
        contacts_table = self.table_block("crm_contacts")
        contact_email_table = self.table_block("crm_contact_email_addresses")

        self.assertNotRegex(contacts_table, r"\n  email text")
        self.assertNotIn("CREATE UNIQUE INDEX IF NOT EXISTS crm_contacts_email_unique", self.schema)
        self.assertNotIn("ON crm_contacts (lower(email))", self.schema)

        expected_columns = [
            ("contact_id", "uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE"),
            (
                "email_address_id",
                "uuid NOT NULL REFERENCES crm_email_addresses(id) ON DELETE CASCADE",
            ),
            ("relationship_status", "text NOT NULL DEFAULT 'candidate'"),
            ("is_primary", "boolean NOT NULL DEFAULT false"),
            ("source_confidence", "text NOT NULL DEFAULT 'needs-verification'"),
            ("association_notes", "text"),
            ("created_at", "timestamptz NOT NULL DEFAULT now()"),
            ("updated_at", "timestamptz NOT NULL DEFAULT now()"),
        ]

        for column_name, column_type in expected_columns:
            with self.subTest(column_name=column_name):
                self.assertColumn(contact_email_table, column_name, column_type)

        expected_schema_fragments = [
            "PRIMARY KEY (contact_id, email_address_id)",
            "relationship_status IN ('candidate', 'likely', 'claimed', 'rejected')",
            "source_confidence IN ('confirmed-public', 'confirmed-user', 'private-sourced', 'needs-verification')",
            "CREATE UNIQUE INDEX IF NOT EXISTS crm_contact_email_addresses_primary_contact_unique",
            "WHERE is_primary = true AND relationship_status != 'rejected'",
            "CREATE INDEX IF NOT EXISTS crm_contact_email_addresses_email_idx",
            "ON crm_contact_email_addresses (email_address_id)",
            "DROP TRIGGER IF EXISTS crm_contact_email_addresses_set_updated_at",
            "BEFORE UPDATE ON crm_contact_email_addresses",
        ]

        for fragment in expected_schema_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, self.schema)

    def test_contact_email_migration_preserves_existing_values_before_drop(self):
        expected_ordered_fragments = [
            "CREATE TEMP TABLE IF NOT EXISTS crm_contact_email_migration_source",
            "INSERT INTO crm_websites (domain, raw_input, domain_type)",
            "INSERT INTO crm_email_addresses (email, local_part, email_domain, website_id, source_confidence, raw_source)",
            "INSERT INTO crm_contact_email_addresses (contact_id, email_address_id, relationship_status, is_primary, source_confidence, association_notes)",
            "DROP INDEX IF EXISTS crm_contacts_email_unique",
            "ALTER TABLE crm_contacts DROP COLUMN IF EXISTS email",
        ]

        last_index = -1
        for fragment in expected_ordered_fragments:
            with self.subTest(fragment=fragment):
                current_index = self.schema.find(fragment)
                self.assertNotEqual(current_index, -1, f"{fragment} should be present")
                self.assertGreater(current_index, last_index, f"{fragment} should be in migration order")
                last_index = current_index

        for provider_domain in ["gmail.com", "outlook.com", "icloud.com", "yahoo.com", "protonmail.com"]:
            with self.subTest(provider_domain=provider_domain):
                self.assertIn(provider_domain, self.schema)
        self.assertIn("domain_type = 'email_provider'", self.schema)

    def test_n8n_workflow_contract_documents_crm_database_polling_and_shopify_rules(self):
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
            "shopify_status = 'unknown'",
            "Failed or partial checks keep `shopify_status = 'unknown'`",
            "crm_websites",
            "crm_email_addresses",
        ]

        for fragment in expected_fragments:
            with self.subTest(fragment=fragment):
                self.assertIn(fragment, contract)


if __name__ == "__main__":
    unittest.main()
