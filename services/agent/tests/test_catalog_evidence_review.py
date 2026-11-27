"""Catalog labels alone cannot approve text indexing, embedding or redistribution."""

import json
from pathlib import Path

import pytest
from polymatik_agent.catalog_evidence_review import main, review_catalog


def catalog(path, items):
    path.write_text(
        json.dumps({"schema_version": "catalog-staging-v1", "items": items}), encoding="utf-8"
    )


def test_catalog_permission_label_never_becomes_text_permission(tmp_path, capsys):
    path = tmp_path / "catalog.json"
    catalog(
        path,
        [
            {
                "id": "math",
                "rights_status": "explicit_permission_verified",
                "url": "https://example.org/private?token=secret",
                "license": "CC-BY",
            }
        ],
    )
    before = path.read_bytes()
    assert main([str(path)]) == 0
    output = capsys.readouterr().out
    report = json.loads(output)
    assert report["evidence_approved"] == 0
    assert report["items"][0]["evidence_status"] == "review_required"
    assert "secret" not in output
    assert path.read_bytes() == before


def test_actual_staging_inventory_is_counted_without_changing_immutable_inputs():
    path = Path(__file__).resolve().parents[3] / "assets/catalog_staging.json"
    before = path.read_bytes()
    result = review_catalog(path)
    assert result["staging_records"] == 60
    assert result["catalog_labels"]["explicit_permission_verified"] == 10
    assert result["evidence_approved"] == 0
    assert len(result["items"]) == 60
    assert path.read_bytes() == before


@pytest.mark.parametrize(
    "items",
    [
        [{"id": "a", "rights_status": "unknown"}] * 2,
        [{"id": "../bad", "rights_status": "unknown"}],
        [{"id": "a", "rights_status": "new-unreviewed-label"}],
    ],
)
def test_ambiguous_catalog_data_fails_closed(tmp_path, items):
    path = tmp_path / "catalog.json"
    catalog(path, items)
    with pytest.raises(ValueError):
        review_catalog(path)


def test_invalid_catalog_diagnostics_do_not_echo_values(tmp_path, capsys):
    path = tmp_path / "catalog.json"
    path.write_text('{"schema_version":"private-credential"}', encoding="utf-8")
    assert main([str(path)]) == 1
    assert "private-credential" not in capsys.readouterr().err
