"""Validate an explicit local corpus package without indexing or publishing it."""

import argparse
import json
import sys
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Annotated

from pydantic import Field

from polymatik_agent.evidence import (
    MAX_SOURCES,
    MAX_TEXT_BYTES,
    EvidenceIndex,
    Identifier,
    Record,
    SourceRegistry,
    ingest,
)
from polymatik_agent.json_input import strict_json


class Artifact(Record):
    source_id: Identifier
    path: Annotated[str, Field(min_length=1, max_length=240)]


class Package(SourceRegistry):
    artifacts: Annotated[tuple[Artifact, ...], Field(max_length=MAX_SOURCES)]


def _read(path: Path, limit: int) -> bytes:
    if not path.is_file():
        raise ValueError("ARTIFACT_NOT_FILE")
    with path.open("rb") as stream:
        data = stream.read(limit + 1)
    if len(data) > limit:
        raise ValueError("FILE_BUDGET")
    return data


def validate_package(path: Path) -> tuple[EvidenceIndex, SourceRegistry]:
    """All artifacts must be .txt files beneath the manifest, with no symlink escape."""
    path = path.resolve(strict=True)
    root = path.parent
    raw = _read(path, 524288)
    strict_json(raw)
    manifest = Package.model_validate_json(raw)
    sources = SourceRegistry(sources=manifest.sources)
    expected = {
        s.source_id
        for s in sources.sources
        if s.visibility == "public"
        and s.rights.status == "approved"
        and s.rights.mode != "metadata_only"
    }
    ids = [artifact.source_id for artifact in manifest.artifacts]
    if len(set(ids)) != len(ids) or set(ids) != expected:
        raise ValueError("ARTIFACT_SOURCE_MISMATCH")
    documents = []
    seen_paths = set()
    for artifact in manifest.artifacts:
        relative = PurePosixPath(artifact.path)
        windows = PureWindowsPath(artifact.path)
        if (
            relative.is_absolute()
            or windows.drive
            or "\\" in artifact.path
            or ":" in artifact.path
            or ".." in relative.parts
            or relative.suffix != ".txt"
        ):
            raise ValueError("ARTIFACT_PATH")
        resolved = (root / artifact.path).resolve(strict=True)
        if not resolved.is_relative_to(root) or resolved in seen_paths:
            raise ValueError("ARTIFACT_PATH")
        seen_paths.add(resolved)
        documents.append(ingest(sources.get(artifact.source_id), _read(resolved, MAX_TEXT_BYTES)))
    return EvidenceIndex(tuple(documents)), sources


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--query", help="Optional offline lexical check; prints IDs, never text.")
    args = parser.parse_args(argv)
    try:
        index, sources = validate_package(args.manifest)
        result = {
            "mode": "local-validation-only",
            "sources": len(sources.sources),
            "documents": len(index.documents),
            "passages": sum(len(d.passages) for d in index.documents),
            "network_calls": 0,
            "writes": 0,
            "published": False,
        }
        if args.query is not None:
            retrieved = index.search(args.query, sources)
            result["retrieval"] = {
                "status": retrieved.status,
                "passage_ids": [p.id for p in retrieved.passages],
                "version": retrieved.retriever_version,
            }
        print(json.dumps(result, sort_keys=True))
        return 0
    except (ValueError, OSError, RecursionError):
        print(
            "CORPUS_VALIDATION_FAILED: inspect the manifest, rights and artifact bytes.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
