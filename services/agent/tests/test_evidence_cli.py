"""File-only corpus validation never prints supplied content or configuration values."""

import hashlib
import json
from pathlib import Path

import pytest
from polymatik_agent.evidence_cli import main, validate_package


def test_checked_in_example_matches_its_byte_checksum():
    path = Path(__file__).resolve().parents[3] / "tests/fixtures/evidence/corpus.json"
    index, sources = validate_package(path)
    assert index.search("amber", sources).status == "evidence"


def package(root: Path):
    text = "Synthetic amber stores daylight."
    manifest = {
        "sources": [
            {
                "source_id": "amber",
                "title": "Synthetic amber",
                "author": "Fixture author",
                "canonical_uri": "https://example.org/fixtures/amber",
                "version": "v1",
                "sha256": hashlib.sha256(text.encode()).hexdigest(),
                "visibility": "public",
                "rights": {
                    "status": "approved",
                    "mode": "full_text",
                    "reference": "Test authorship",
                    "license_label": "Synthetic fixture only",
                    "attribution_notice": "Invented test text.",
                    "changes_notice": "Original synthetic text.",
                    "reviewed_by": "test-author",
                    "reviewed_on": "2026-11-27",
                    "max_index_chars": 100,
                    "max_quote_chars": 50,
                },
            }
        ],
        "artifacts": [{"source_id": "amber", "path": "amber.txt"}],
    }
    path = root / "corpus.json"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    (root / "amber.txt").write_text(text, encoding="utf-8")
    return path, manifest


def test_package_is_file_only_bounded_and_does_not_reveal_text(tmp_path, capsys):
    path, _ = package(tmp_path)
    before = {p.name: p.read_bytes() for p in tmp_path.iterdir()}
    assert main([str(path), "--query", "amber"]) == 0
    output = json.loads(capsys.readouterr().out)
    assert output["documents"] == 1
    assert output["retrieval"]["status"] == "evidence"
    assert "daylight" not in json.dumps(output)
    assert {p.name: p.read_bytes() for p in tmp_path.iterdir()} == before


@pytest.mark.parametrize("invalid", ["../outside.txt", "https://example.org/a", "C:/secret.txt"])
def test_artifacts_cannot_escape_package_or_trigger_remote_fetch(tmp_path, invalid):
    path, manifest = package(tmp_path)
    manifest["artifacts"][0]["path"] = invalid
    path.write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError):
        validate_package(path)


def test_duplicate_artifacts_unknown_sources_and_missing_artifacts_fail(tmp_path):
    path, manifest = package(tmp_path)
    for artifacts in (
        [manifest["artifacts"][0]] * 2,
        [],
        [{"source_id": "other", "path": "amber.txt"}],
    ):
        path.write_text(json.dumps({**manifest, "artifacts": artifacts}), encoding="utf-8")
        with pytest.raises(ValueError):
            validate_package(path)


def test_errors_are_sanitized_and_have_nonzero_exit(tmp_path, capsys):
    path, manifest = package(tmp_path)
    manifest["sources"][0]["canonical_uri"] = "https://secret:credential@example.org/a"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    assert main([str(path)]) == 1
    output = capsys.readouterr()
    assert "credential" not in output.err
    assert "secret" not in output.err
    assert "CORPUS_VALIDATION_FAILED" in output.err


def test_invalid_utf8_oversized_files_and_duplicate_keys_fail(tmp_path):
    path, manifest = package(tmp_path)
    (tmp_path / "amber.txt").write_bytes(b"x" * 262145)
    with pytest.raises(ValueError):
        validate_package(path)
    path.write_bytes(b"\xff")
    with pytest.raises(ValueError):
        validate_package(path)
    path.write_text('{"sources":[],"sources":[],"artifacts":[]}', encoding="utf-8")
    with pytest.raises(ValueError):
        validate_package(path)
    path.write_bytes(b" " * 524289)
    with pytest.raises(ValueError):
        validate_package(path)
