"""Read-only staging inventory; catalog permission labels never approve evidence text."""

import argparse
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

from polymatik_agent.json_input import strict_json

LABELS = ("explicit_permission_verified", "needs_recheck", "unknown", "restricted")


def review_catalog(path: Path) -> dict:
    if not path.is_file():
        raise ValueError("CATALOG_NOT_FILE")
    with path.open("rb") as stream:
        raw = stream.read(2097153)
    if len(raw) > 2097152:
        raise ValueError("CATALOG_BUDGET")
    catalog = strict_json(raw)
    if (
        not isinstance(catalog, dict)
        or catalog.get("schema_version") != "catalog-staging-v1"
        or not isinstance(catalog.get("items"), list)
        or not 1 <= len(catalog["items"]) <= 1000
    ):
        raise ValueError("CATALOG_SCHEMA")
    rows = []
    seen = set()
    for item in catalog["items"]:
        if not isinstance(item, dict):
            raise ValueError("CATALOG_ITEM")
        identity, label = item.get("id"), item.get("rights_status")
        if (
            not isinstance(identity, str)
            or not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,79}", identity)
            or identity in seen
            or label not in LABELS
        ):
            raise ValueError("CATALOG_ITEM")
        seen.add(identity)
        rows.append(
            {
                "resource_id": identity,
                "catalog_rights_status": label,
                "evidence_status": "review_required",
            }
        )
    rows.sort(key=lambda row: (LABELS.index(row["catalog_rights_status"]), row["resource_id"]))
    return {
        "protocol_version": "catalog-evidence-review-v1",
        "scope": "staging-file inventory, not live publication state",
        "catalog_sha256": hashlib.sha256(raw).hexdigest(),
        "staging_records": len(rows),
        "catalog_labels": dict(sorted(Counter(r["catalog_rights_status"] for r in rows).items())),
        "evidence_approved": 0,
        "approval_inference": "No approvals inferred; evidence registries are outside this report.",
        "required_review": [
            "source identity and catalog association",
            "canonical source/version/date",
            "license or permission reference and reviewer/date",
            "explicit indexing, embedding, quotation and redistribution grants",
            "artifact checksum and normalized passage locators",
            "per-source index and cumulative quote budgets",
        ],
        "items": rows,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("catalog", type=Path)
    args = parser.parse_args(argv)
    try:
        print(json.dumps(review_catalog(args.catalog), indent=2))
        return 0
    except (ValueError, OSError, RecursionError):
        print(
            "CATALOG_REVIEW_FAILED: inspect staging schema, bounds and unique identities.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
