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

```bash
python -m cookbook_pipeline run            # all stages
python -m cookbook_pipeline run --stage 4  # one stage only
python -m cookbook_pipeline pilot          # 50-recipe sample for spot-checking
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
