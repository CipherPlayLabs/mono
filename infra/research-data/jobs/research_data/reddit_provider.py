import base64
import json
import time
import urllib.parse
import urllib.request
from typing import Any


class RedditProvider:
    AUTH_URL = "https://www.reddit.com/api/v1/access_token"
    API_BASE = "https://oauth.reddit.com"

    def __init__(self, credentials: dict[str, Any], *, sleep=time.sleep):
        self.credentials = credentials
        self.sleep = sleep
        self.user_agent = credentials.get("user_agent") or "CipherPlayResearchData/0.1"
        self._token: str | None = None
        self._last_rate_limit: dict[str, Any] = {}

    def list_thread_refs(self, config: dict[str, Any], checkpoint: dict[str, Any] | None, limit: int) -> dict[str, Any]:
        mode = _first_enabled_mode(config)
        params: dict[str, Any] = {"limit": min(limit, 100)}
        if checkpoint and checkpoint.get("after"):
            params["after"] = checkpoint["after"]
        community = config["community"]["name"]

        if mode["mode"] == "new":
            path = f"/r/{community}/new.json"
        elif mode["mode"] == "top":
            path = f"/r/{community}/top.json"
            params["t"] = mode.get("time_filter", "year")
        elif mode["mode"] == "search":
            path = f"/r/{community}/search.json"
            params["restrict_sr"] = "on"
            params["sort"] = mode.get("sort", "new")
            params["t"] = mode.get("time_filter", "year")
            params["q"] = " OR ".join(mode.get("queries") or ["*"])
        else:
            raise ValueError(f"unsupported Reddit query mode {mode['mode']}")

        payload = self._api_json("GET", path, params)
        children = payload.get("data", {}).get("children", [])
        refs = []
        for child in children:
            data = child.get("data", {})
            if not data.get("id"):
                continue
            refs.append(
                {
                    "provider_thread_id": data["id"],
                    "provider_fullname": data.get("name") or f"t3_{data['id']}",
                    "created_utc": data.get("created_utc"),
                    "permalink": data.get("permalink"),
                }
            )
        return {
            "refs": refs,
            "checkpoint": {
                "query_mode": mode["mode"],
                "after": payload.get("data", {}).get("after"),
            },
            "coverage_gaps": [
                {
                    "gap_type": "provider_listing_mode",
                    "description": f"Collected provider-accessible Reddit listing via {mode['mode']} mode.",
                    "severity": "note",
                    "mode_json": mode,
                    "rate_limit_json": self._last_rate_limit,
                }
            ],
        }

    def fetch_thread(self, thread_ref: dict[str, Any]) -> dict[str, Any]:
        thread_id = thread_ref["provider_thread_id"]
        payload = self._api_json("GET", f"/comments/{thread_id}.json", {"limit": 500, "raw_json": 1})
        if not isinstance(payload, list) or len(payload) < 2:
            raise ValueError(f"unexpected Reddit comments response for {thread_id}")
        thread_listing = payload[0].get("data", {}).get("children", [{}])[0]
        comments_listing = payload[1]
        morechildren = self._expand_morechildren(thread_listing, comments_listing)
        return {
            "thread_listing": thread_listing,
            "comments_listing": comments_listing,
            "morechildren": morechildren,
            "fetch_metadata": {
                "provider": "reddit",
                "fetched_via": "oauth_json_api",
                "rate_limit": self._last_rate_limit,
            },
        }

    def _expand_morechildren(self, thread_listing: dict[str, Any], comments_listing: dict[str, Any]) -> list[dict[str, Any]]:
        link_fullname = thread_listing.get("data", {}).get("name")
        children = _collect_morechildren(comments_listing.get("data", {}).get("children", []))
        responses = []
        for index in range(0, len(children), 100):
            batch = children[index : index + 100]
            params = {
                "api_type": "json",
                "link_id": link_fullname,
                "children": ",".join(batch),
            }
            response = self._api_json("GET", "/api/morechildren.json", params)
            responses.append(
                {
                    "request": {
                        "children": batch,
                        "link_id": link_fullname,
                    },
                    "response": response,
                }
            )
        return responses

    def _api_json(self, method: str, path: str, params: dict[str, Any] | None = None) -> Any:
        token = self._access_token()
        query = urllib.parse.urlencode(params or {})
        url = f"{self.API_BASE}{path}"
        if query:
            url = f"{url}?{query}"
        request = urllib.request.Request(url, method=method)
        request.add_header("Authorization", f"Bearer {token}")
        request.add_header("User-Agent", self.user_agent)
        with urllib.request.urlopen(request, timeout=30) as response:
            self._record_rate_limit(response.headers)
            payload = json.loads(response.read().decode("utf-8"))
        self._respect_rate_limit()
        return payload

    def _access_token(self) -> str:
        if self._token:
            return self._token
        client_id = self.credentials["client_id"]
        client_secret = self.credentials["client_secret"]
        body: dict[str, str]
        if self.credentials.get("username") and self.credentials.get("password"):
            body = {
                "grant_type": "password",
                "username": self.credentials["username"],
                "password": self.credentials["password"],
            }
        else:
            body = {"grant_type": "client_credentials"}
        encoded = urllib.parse.urlencode(body).encode("utf-8")
        request = urllib.request.Request(self.AUTH_URL, data=encoded, method="POST")
        basic = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
        request.add_header("Authorization", f"Basic {basic}")
        request.add_header("User-Agent", self.user_agent)
        request.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
        self._token = payload["access_token"]
        return self._token

    def _record_rate_limit(self, headers: Any) -> None:
        self._last_rate_limit = {
            "used": headers.get("x-ratelimit-used"),
            "remaining": headers.get("x-ratelimit-remaining"),
            "reset_seconds": headers.get("x-ratelimit-reset"),
        }

    def _respect_rate_limit(self) -> None:
        try:
            remaining = float(self._last_rate_limit.get("remaining") or 2)
            reset_seconds = float(self._last_rate_limit.get("reset_seconds") or 0)
        except ValueError:
            return
        if remaining <= 1 and reset_seconds > 0:
            self.sleep(reset_seconds)


def _first_enabled_mode(config: dict[str, Any]) -> dict[str, Any]:
    for mode in config["query_modes"]:
        if mode.get("enabled"):
            return mode
    raise ValueError("no enabled query mode")


def _collect_morechildren(children: list[dict[str, Any]]) -> list[str]:
    found: list[str] = []
    for child in children:
        kind = child.get("kind")
        data = child.get("data", {})
        if kind == "more":
            found.extend(data.get("children") or [])
        elif kind == "t1":
            replies = data.get("replies")
            if isinstance(replies, dict):
                found.extend(_collect_morechildren(replies.get("data", {}).get("children", [])))
    return found
