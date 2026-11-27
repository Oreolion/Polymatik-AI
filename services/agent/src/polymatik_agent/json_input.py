"""Reject ambiguous keys and non-JSON numeric constants before model validation."""

import json


def _unique_keys(pairs):
    values = {}
    for key, value in pairs:
        if key in values:
            raise ValueError("DUPLICATE_JSON_KEY")
        values[key] = value
    return values


def _invalid_constant(value):
    raise ValueError("NON_JSON_CONSTANT")


def strict_json(raw: bytes):
    return json.loads(raw, object_pairs_hook=_unique_keys, parse_constant=_invalid_constant)
