"""Narrow HMAC delegation from the product API; never accept browser credentials."""

import base64
import hmac
import re
import time
from uuid import UUID

from polymatik_agent.app import Principal
from polymatik_agent.json_input import strict_json


def delegation_verifier(secret: str):
    if not re.fullmatch(r"[a-f0-9]{64}", secret):
        raise ValueError("GATEWAY_KEY")

    async def verify(token: str) -> Principal | None:
        try:
            if len(token) > 2048 or not re.fullmatch(r"[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}", token):
                return None
            payload, signature = token.split(".")
            expected = hmac.digest(
                secret.encode(), f"polymatik-evidence-v1.{payload}".encode(), "sha256"
            )
            supplied = base64.urlsafe_b64decode(signature + "=")
            if not hmac.compare_digest(expected, supplied):
                return None
            value = strict_json(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
            if not isinstance(value, dict) or set(value) != {
                "v",
                "iss",
                "aud",
                "sub",
                "scope",
                "iat",
                "exp",
                "jti",
                "body_sha256",
            }:
                return None
            now = int(time.time())
            if (
                type(value["v"]) is not int
                or value["v"] != 1
                or value["iss"] != "polymatik-api"
                or value["aud"] != "polymatik-evidence"
                or value["scope"] != "research:read"
                or not isinstance(value["sub"], str)
                or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", value["sub"])
                or type(value["iat"]) is not int
                or type(value["exp"]) is not int
                or not now - 35 <= value["iat"] <= now + 5
                or not now < value["exp"] <= value["iat"] + 30
                or value["exp"] <= value["iat"]
                or not isinstance(value["body_sha256"], str)
                or not re.fullmatch(r"[a-f0-9]{64}", value["body_sha256"])
                or not isinstance(value["jti"], str)
                or str(UUID(value["jti"])) != value["jti"]
            ):
                return None
            return Principal(value["sub"], frozenset({"research:read"}), value["body_sha256"])
        except (ValueError, TypeError, KeyError, RecursionError):
            return None

    return verify
