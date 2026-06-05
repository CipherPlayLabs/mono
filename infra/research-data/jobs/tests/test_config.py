import unittest

from research_data.config import ConfigValidationError, validate_collection_config


VALID_CONFIG = {
    "schema_version": "2026-06-05",
    "provider": "reddit",
    "community": {
        "platform": "reddit",
        "name": "smallbusiness",
        "display_name": "r/smallbusiness",
    },
    "lookback": {
        "mode": "one_year",
        "start_date": "2025-06-05",
        "end_date": "2026-06-05",
    },
    "collection": {
        "goal": "provider_accessible_backfill",
        "include_full_comment_tree": True,
        "respect_rate_limits": True,
        "max_requests_per_batch": 100,
        "batch_pause_seconds": 60,
    },
    "query_modes": [
        {
            "mode": "new",
            "enabled": True,
        },
        {
            "mode": "top",
            "time_filter": "year",
            "enabled": True,
        },
    ],
    "triage": {
        "enabled": True,
        "language": "en",
        "minimum_signal": {
            "minimum_total_text_characters": 500,
            "minimum_non_deleted_comments": 2,
            "allow_ai_review_below_threshold": True,
        },
    },
    "analysis": {
        "mode": "jtbd_first",
        "run_automatically_after_collection": False,
        "thread_level_only": True,
        "allow_chunking": True,
        "allow_truncation": False,
    },
    "secrets": {
        "provider_credentials_secret": "projects/cipherplay-production/secrets/reddit-api-credentials",
    },
}


class CollectionConfigTests(unittest.TestCase):
    def test_accepts_valid_json_collection_config(self):
        normalized = validate_collection_config(VALID_CONFIG)

        self.assertEqual(normalized["provider"], "reddit")
        self.assertEqual(normalized["community"]["name"], "smallbusiness")
        self.assertTrue(normalized["collection"]["include_full_comment_tree"])
        self.assertFalse(normalized["analysis"]["allow_truncation"])

    def test_rejects_configs_with_inline_provider_secrets(self):
        config = dict(VALID_CONFIG)
        config["secrets"] = {
            "provider_credentials_secret": "projects/cipherplay-production/secrets/reddit-api-credentials",
            "client_secret": "do-not-commit-this",
        }

        with self.assertRaisesRegex(ConfigValidationError, "inline secret"):
            validate_collection_config(config)

    def test_requires_full_comment_tree_and_no_truncation(self):
        config = dict(VALID_CONFIG)
        config["collection"] = dict(VALID_CONFIG["collection"], include_full_comment_tree=False)

        with self.assertRaisesRegex(ConfigValidationError, "full comment tree"):
            validate_collection_config(config)

        config = dict(VALID_CONFIG)
        config["analysis"] = dict(VALID_CONFIG["analysis"], allow_truncation=True)

        with self.assertRaisesRegex(ConfigValidationError, "truncation"):
            validate_collection_config(config)

    def test_rejects_invalid_lookback_order(self):
        config = dict(VALID_CONFIG)
        config["lookback"] = dict(
            VALID_CONFIG["lookback"],
            start_date="2026-06-05",
            end_date="2025-06-05",
        )

        with self.assertRaisesRegex(ConfigValidationError, "lookback"):
            validate_collection_config(config)


if __name__ == "__main__":
    unittest.main()
