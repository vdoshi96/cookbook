# India Cookbook

A digital companion to Pushpesh Pant's *India Cookbook* (Phaidon, 2010): a searchable index of all 1000 recipes, plus a browsable exploration of Indian cooking the way the book itself reads — by chapter (chutneys, rice, breads…), by region (Awadh, Punjab, Tamil Nadu…), by ingredient, and by following cross-references between recipes.

## Repo layout

```
/pipeline    Python pipeline that turns the PDFs into structured data (backend branch)
/web         Next.js website (frontend branch)
/data        Pipeline output — the contract between backend and frontend
/source      Original PDFs (gitignored, copyrighted)
/docs        Specs and design notes
BRIEF.md     Project brief for the frontend
```

## Branches

- `main` — scaffolding, brief, spec, stub data
- `backend` — Python extraction pipeline (in `/pipeline`, output to `/data`)
- `frontend` — Next.js app (in `/web`)

The two work-streams stay in non-overlapping directories. They meet at `/data`.

## Setup

### Backend

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
python -m pipeline run
```

The PDF source must be placed at `/source/india-cookbook.pdf`. It is intentionally not committed.

### Frontend

```bash
cd web
npm install
npm run dev
```

Reads from `/data/*.json` at build time.

## Design

See [docs/superpowers/specs/2026-04-26-india-cookbook-website-design.md](docs/superpowers/specs/2026-04-26-india-cookbook-website-design.md) for the full design spec.

## Hosting

Vercel — production from `main`, preview deploys per PR.
