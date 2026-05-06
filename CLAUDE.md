# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SAS Randomization Code Generator (v2.0) — a web application for Biostatisticians/Clinical Programmers to generate SAS randomization scheme code. The app has three layers: a Next.js frontend, a FastAPI backend, and a Python core engine using Jinja2 templates.

The app also supports standalone desktop deployment via PyInstaller (`build_standalone_web.py` produces a single `RanGen.exe`).

## Commands

### Backend (from project root)
```bash
pip install fastapi uvicorn jinja2 pydantic pandas openpyxl
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API docs: http://localhost:8000/docs
- The backend auto-serves the frontend's static export from `frontend/out/` if present (standalone mode).

### Frontend (from `frontend/`)
```bash
npm install
npm run dev          # Dev server at http://localhost:3000
npm run build        # Static export to frontend/out/ (output: "export" in next.config.ts)
npm run lint         # ESLint
```

### Standalone Build (from project root)
```bash
python build_standalone_web.py
```
Produces `dist_standalone/RanGen.exe` + `web_root/` + `assets/`.

## Architecture

### Data Flow

1. **Frontend** (`frontend/`) collects configuration via a step-by-step wizard form, validates with Zod schemas (`lib/schemas.ts`), and persists state via Zustand (`lib/store.ts`). API calls use React Query + Axios (`lib/api.ts`) hitting `POST /api/v1/generate`.

2. **Backend** (`backend/`) receives the flat JSON payload, the `SASService` passes it directly to `SASRandomizationGenerator(**data)`.

3. **Core Engine** (`sas_randomizer/core_refactored/`) transforms the flat dict into a typed `StudyDesignConfig` (Pydantic model via `transformers.py`), then renders Jinja2 templates (`.sas.j2` files) through builders:
   - `subject_builder.py` → `subject_randomization.sas.j2`
   - `drug_builder.py` → `drug_randomization.sas.j2`
   - Common: `common_header.sas.j2`, `macro_definitions.sas.j2`, `logic.sas.j2`

### Key Design Pattern: "Logic in Templates, Data in Models"

SAS code generation logic lives in Jinja2 templates (`sas_randomizer/core_refactored/templates/`), not in Python string concatenation. The Python layer only builds data models and passes them as template context (`{'study': study_design}`). When adding SAS logic features, edit the `.sas.j2` templates — the Python builders are thin wrappers.

### Schema Pipeline

There are **three separate schema systems** that must stay in sync:
- **Frontend Zod**: `frontend/lib/schemas.ts` — validates form input
- **Backend Pydantic**: `backend/app/api/schemas.py` — API request model
- **Core Pydantic**: `sas_randomizer/core_refactored/schemas.py` — domain models (`StudyDesignConfig`, `DrugRandomizationConfig`, etc.)

The `transformers.py` module bridges the gap: `convert_ui_payload_to_study_design()` converts flat JSON → nested `StudyDesignConfig`. Any new config field must be added to all three layers and handled in the transformer.

### State Management (Frontend)

- Zustand store with `persist` middleware (`frontend/lib/store.ts`) — auto-saves to localStorage
- i18n via `frontend/lib/translations.ts` (zh/en)
- UI components are Shadcn/UI based (`frontend/components/ui/`)

### Multi-Cohort / Multi-Protocol

The engine supports heterogeneous cohorts where each sub-protocol can have independent drug randomization configs. `StudyDesignConfig.cohorts: List[CohortConfig]` holds per-cohort `DrugRandomizationConfig`. The `supplier` field controls vendor-specific blind format output (Supplier A vs Supplier B).

## Important Conventions

- Jinja2 template context variable is always `study` (accessed as `{{ study.xxx }}` in templates)
- Drug batch configs follow the structure: `{ supply_factor: "FactorName", configs: { "LevelName": [{batch_no, quantity}] } }`
- The frontend is configured for static export (`output: "export"` in next.config.ts) — no server-side rendering features
- Vendor names are in Chinese: `供应商A`, `供应商B`, `供应商B 5.X`, `供应商B Lite`
- Config field names on the frontend use `drug_` prefix for drug randomization fields (e.g., `drug_block_size`), which the transformer maps to the core model's unprefixed names
