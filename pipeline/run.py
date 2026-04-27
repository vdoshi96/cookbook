#!/usr/bin/env python3
"""Wrapper entrypoint that bootstraps sys.path and runs the cookbook_pipeline CLI.

Why this exists: when the project lives under iCloud Drive, `pip install -e .`
writes an `__editable__.<package>.pth` file that macOS marks UF_HIDDEN (any
file with a leading `__` gets hidden). Python 3.13's site.addpackage()
silently skips hidden .pth files, so the editable install isn't picked up
and `python -m cookbook_pipeline` fails with ModuleNotFoundError.

This wrapper sidesteps that by adding `src/` to sys.path explicitly, then
delegating to the package's main(). Run it from the pipeline/ directory:

    python run.py pilot
    python run.py run
    python run.py run --stage 4
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add pipeline/src to sys.path so `cookbook_pipeline` is importable regardless
# of editable-install state.
HERE = Path(__file__).resolve().parent
SRC = HERE / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from cookbook_pipeline.__main__ import main

if __name__ == "__main__":
    sys.exit(main())
