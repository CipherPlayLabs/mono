import copy
import io
import unittest
from contextlib import redirect_stdout
from unittest import mock

from test_config import VALID_CONFIG

from research_data import __main__ as research_main


class CollectEntrypointTests(unittest.TestCase):
    def test_default_collection_run_id_is_stable_for_config_uri_and_query_mode(self):
        seen_run_ids = []

        def fake_run_collection_batch(**kwargs):
            seen_run_ids.append(kwargs["collection_run_id"])
            return {
                "collection_run_id": kwargs["collection_run_id"],
                "query_mode": kwargs["query_mode_name"],
                "threads_seen": 0,
                "threads_fetched": 0,
                "rows_written": 0,
                "skipped_outside_window": 0,
            }

        with (
            mock.patch.object(research_main, "load_collection_config", return_value=copy.deepcopy(VALID_CONFIG)),
            mock.patch.object(research_main, "load_secret_json", return_value={"client_id": "id", "client_secret": "secret"}),
            mock.patch.object(research_main, "RedditProvider", return_value=object()),
            mock.patch.object(research_main, "_snapshot_store", return_value=object()),
            mock.patch.object(research_main, "_research_store", return_value=object()),
            mock.patch.object(research_main, "run_collection_batch", side_effect=fake_run_collection_batch),
        ):
            with redirect_stdout(io.StringIO()):
                research_main.main(
                    [
                        "collect",
                        "--config-uri",
                        "gs://bucket/configs/reddit/ecommerce.json",
                        "--query-mode",
                        "new",
                    ]
                )
                research_main.main(
                    [
                        "collect",
                        "--config-uri",
                        "gs://bucket/configs/reddit/ecommerce.json",
                        "--query-mode",
                        "new",
                    ]
                )

        self.assertEqual(len(seen_run_ids), 2)
        self.assertEqual(seen_run_ids[0], seen_run_ids[1])


if __name__ == "__main__":
    unittest.main()
