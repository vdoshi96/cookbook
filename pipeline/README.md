# Pipeline

Python pipeline that converts the India Cookbook PDF to structured JSON in `/data/`.

## Setup

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
cp .env.example .env
# edit .env, set ANTHROPIC_API_KEY
```

The source PDF must be placed at `../source/india-cookbook.pdf`. It is gitignored.

## Run

The pipeline can be invoked two ways. Prefer `python run.py` — it works regardless of `pip install -e .` state, which is unreliable when the project lives under iCloud Drive (Python 3.13 silently skips hidden `__editable__.*.pth` files):

```bash
cd pipeline
source .venv/bin/activate
python run.py pilot          # ~50 recipes for spot-checking
python run.py run            # full pipeline (~1000 recipes, ~$2-5)
python run.py run --stage 4  # one stage only
```

Alternative invocation (works only if the editable install is loading correctly):

```bash
PYTHONPATH=src python -m cookbook_pipeline pilot
```

## Tests

```bash
pytest
```

## Stages

0. PDF page text and image dump
1. Section detection from page footers
2. Front-matter extraction (LLM)
3. Recipe block segmentation
4. LLM cleanup pass (Haiku) — the bulk of the work
5. Cross-reference resolution
6. Section + region intro extraction (LLM)
7. "Start here" picks per section (LLM)
8. Ingredient + tag indexing
9. Image extraction + recipe association
10. Validation and final emit to `/data/`
