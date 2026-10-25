# M0-01 evidence — 21 October 2026

**Decision: local foundation gate passed on 22 October 2026.** A fresh source copy
passed frozen pnpm installation, lint, typechecks and all 10 TS tests on Node
24.0.0. The owner reports both installed Python tests passing too. CI is now
configured locally but has not run remotely; the exact preferred Node patch is
unverified. No application runtime or release has been tested. Historical files
named `*-cache` use extracted cached tools; installed Python output is under
`windows-cache-fix/`.

| Artifact | Actual observation |
|---|---|
| red-workspace.txt | Test-first: 4 failures before workspace creation |
| red-python.txt | Test-first: 1 missing-module failure; 1 passing config check |
| install-typescript.txt | Offline pnpm installation: exit 0, 91 cached packages |
| lint-typescript.txt | `pnpm.cmd lint`: exit 0 |
| typecheck-typescript.txt | `pnpm.cmd typecheck`: exit 0, root + 6 workspaces |
| test-typescript.txt | `pnpm.cmd test`: exit 0, 4 passed |
| typescript-results.json | Return codes for the three final TypeScript checks |
| test-python-cache.txt | Cached pytest: exit 0, 2 passed |
| lint-python-cache.txt / format-python-cache.txt | Cached Ruff: exit 0 |
| python-results.json | Return codes for the final Python source checks |
| install-python.txt | Offline uv sync: exit 1, original wheel downloads missing |
| acceptance-python-blocked.txt | `uv run --locked pytest`: exit 1, network denied |
| dependency-licenses.json | License metadata from 101 cached tooling packages |
| environment.json | Actual installed versions, OS and unavailable global tools |
| lock-python.txt | uv lock consistency check: exit 0 |
| changed-files.txt | New files and original-document changes against the handoff snapshot |
| red-cache-regression.txt | ESLint regression failed on generated cache traversal before the fix |
| windows-cache-fix/results.json | All seven follow-up checks exit 0; 5 TS / 2 Python tests |
| red-prettier-cache-regression.txt | Real formatter fails when cache reads simulate EPERM before script fix |
| prettier-cache-fix/ | Latest lint/typecheck/test evidence with formatter traversal pruning |
| red-node-launcher.txt | Four launcher tests fail before implementation |
| node-launcher/isolation.json | Actual Node 25.9.0 parent, Node 24.0.0 child, unchanged parent afterward |
| node-launcher/results.json | Shell syntax/lint/typecheck/test exit 0 through Node 24.0.0; 10 TS tests pass |
| local-acceptance/results.json | Fresh-copy frozen install, lint, typecheck and 10 tests pass on Node 24.0.0; no remote CI run |

The start file already used "Polymatik" when first inspected, unlike its older
MANIFEST snapshot. That pre-existing manifest mismatch is marked separately in
the file inventory; the start file was not edited in this session.

The .txt files contain command output; some early captures use PowerShell's
UTF-16 default, while the final source-check captures are UTF-8. No output was
edited to remove failing checks or engine warnings.

## Python fallback reproduction

This session copied public cache metadata and extracted package archives into
the ignored `.cache/uv` directory. The following is the exact fallback procedure
used after the clean install failed; it requires those cached archives and is
**not** the normal project bootstrap or a substitute for its acceptance gate.
Run the script via `python -` (PowerShell can pipe a literal here-string).

```python
import os
from pathlib import Path
import subprocess
import sys

cache = Path('.cache/uv/archive-v0').resolve()
packages = (
    'pytest-9.0.3.dist-info',
    'iniconfig-2.3.0.dist-info',
    'packaging-26.3.dist-info',
    'pluggy-1.6.0.dist-info',
    'pygments-2.20.0.dist-info',
    'colorama-0.4.6.dist-info',
)
environment = {
    **os.environ,
    'PYTHONPATH': os.pathsep.join(
        str(next(cache.glob('*/' + name)).parent) for name in packages
    ),
}
subprocess.run(
    [sys.executable, '-m', 'pytest', 'services/agent/tests', '-q'],
    env=environment,
    check=True,
)
ruff = next(cache.glob('*/ruff-0.15.14.data/scripts/ruff.exe'))
subprocess.run([str(ruff), 'check', '.'], check=True)
subprocess.run([str(ruff), 'format', '--check', '.'], check=True)
```

Normal acceptance commands and official platform references are in
`../../30_LOCAL_DEVELOPMENT.md`. Do not copy the local cache paths into a provider
or deployment configuration. The GitHub Actions template has not run.
