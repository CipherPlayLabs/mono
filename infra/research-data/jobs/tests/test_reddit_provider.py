import unittest

from test_config import VALID_CONFIG

from research_data.reddit_provider import RedditProvider


class RedditProviderTests(unittest.TestCase):
    def test_list_thread_refs_uses_selected_query_mode(self):
        provider = RedditProvider({"client_id": "id", "client_secret": "secret"})
        calls = []

        def fake_api_json(method, path, params):
            calls.append((method, path, params))
            return {
                "data": {
                    "after": "t3_abc123",
                    "children": [
                        {
                            "data": {
                                "id": "abc123",
                                "name": "t3_abc123",
                                "created_utc": 1750000000,
                                "permalink": "/r/smallbusiness/comments/abc123/thread/",
                            }
                        }
                    ],
                }
            }

        provider._api_json = fake_api_json  # type: ignore[method-assign]

        result = provider.list_thread_refs(
            VALID_CONFIG,
            checkpoint=None,
            limit=25,
            query_mode={"mode": "top", "time_filter": "year", "enabled": True},
        )

        self.assertEqual(calls[0][1], "/r/smallbusiness/top.json")
        self.assertEqual(calls[0][2]["t"], "year")
        self.assertEqual(result["checkpoint"]["query_mode"], "top")


if __name__ == "__main__":
    unittest.main()
