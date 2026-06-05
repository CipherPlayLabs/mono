import json
from typing import Any


def load_secret_json(secret_resource: str) -> dict[str, Any]:
    from google.cloud import secretmanager  # type: ignore

    client = secretmanager.SecretManagerServiceClient()
    name = secret_resource if "/versions/" in secret_resource else f"{secret_resource}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    payload = response.payload.data.decode("utf-8")
    return json.loads(payload)
