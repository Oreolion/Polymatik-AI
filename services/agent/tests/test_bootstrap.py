"""Foundation checks; no models, network credentials, or running server required."""

import os
import re
import subprocess
import sys
import tomllib
from pathlib import Path
from tempfile import TemporaryDirectory


def test_import_has_no_network_or_file_write_side_effects() -> None:
    source = Path(__file__).resolve().parents[1] / "src"
    environment = {
        **os.environ,
        "PYTHONPATH": str(source),
        "PYTHONDONTWRITEBYTECODE": "1",
        "LANGSMITH_TRACING": "true",
    }
    # Pytest's shared numbered temp root can belong to a different Windows
    # account. Create a private, random directory for this invocation instead.
    with TemporaryDirectory(prefix="polymatik-import-") as temporary_directory:
        tmp_path = Path(temporary_directory)
        result = subprocess.run(
            [
                sys.executable,
                "-c",
                """
import sys

def deny_external_effects(event, args):
    if event in {"socket.connect", "socket.bind", "subprocess.Popen"}:
        raise AssertionError(f"unexpected external operation: {event}")
    if event == "open":
        mode = args[1]
        if isinstance(mode, str) and any(flag in mode for flag in "wax+"):
            raise AssertionError("unexpected file write")

sys.addaudithook(deny_external_effects)
import polymatik_agent
assert polymatik_agent.__file__ is not None
""",
            ],
            cwd=tmp_path,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 0, result.stderr
        assert result.stdout == ""
        assert result.stderr == ""
        assert list(tmp_path.iterdir()) == []


def test_runtime_dependencies_are_pinned_without_a_model_provider() -> None:
    project = Path(__file__).resolve().parents[1] / "pyproject.toml"
    config = tomllib.loads(project.read_text(encoding="utf-8"))
    dependencies = config["project"]["dependencies"]
    assert {entry.split("==")[0] for entry in dependencies} == {
        "fastapi",
        "langgraph",
        "langsmith",
        "pydantic",
        "uvicorn",
    }
    assert all(re.fullmatch(r"[a-z-]+==\d+\.\d+\.\d+", entry) for entry in dependencies)
