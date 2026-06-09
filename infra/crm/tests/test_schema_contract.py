import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPO_ROOT / "infra" / "crm" / "schema" / "001-crm.sql"
CRM_CONTEXT_PATH = REPO_ROOT / "docs" / "contexts" / "crm.md"


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


if __name__ == "__main__":
    unittest.main()
