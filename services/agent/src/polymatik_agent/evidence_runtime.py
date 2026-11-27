"""Explicit loopback research runtime for a reviewed, local read-only corpus.

Not a production database adapter, deployment target, or automatic source fetcher.
"""

import argparse
import asyncio
import logging
import os
from pathlib import Path

import uvicorn

from polymatik_agent.app import create_app
from polymatik_agent.evidence_cli import validate_package
from polymatik_agent.evidence_gateway import delegation_verifier
from polymatik_agent.evidence_service import EvidenceReader, EvidenceSnapshot


class PackageRepository:
    def __init__(self, manifest: Path):
        self.manifest = manifest.resolve(strict=True)
        validate_package(self.manifest)

    async def snapshot(self, resource_id: str):
        # Reload policy/artifacts each time: withdrawal or a checksum change fails
        # closed without serving a previous cached corpus. Read work is bounded by
        # the package limits; cancellation doesn't interrupt an OS file read.
        index, current = await asyncio.to_thread(validate_package, self.manifest)
        # Catalog existence/publication is independently checked by the gateway.
        # This local package is not an authoritative catalog inventory.
        return EvidenceSnapshot(resource_id, index, current)


def configured_app(manifest: Path, secret: str):
    return create_app(
        verify_bearer=delegation_verifier(secret),
        evidence_reader=EvidenceReader(PackageRepository(manifest)),
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("Invalid port")
    try:
        app = configured_app(args.manifest, os.environ.get("EVIDENCE_GATEWAY_SECRET", ""))
    except (ValueError, OSError):
        parser.exit(1, "Evidence startup failed: check the private key and reviewed package.\n")
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_config=None, access_log=False)


if __name__ == "__main__":
    main()
