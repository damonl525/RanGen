# SAS Randomization Code Generator (Web UI Edition)

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/your-repo)
[![Status](https://img.shields.io/badge/status-Stable-green.svg)]()
![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)

**SAS Randomization Code Generator** is a professional-grade tool designed for Biostatisticians and Clinical Programmers to automate the generation of complex SAS randomization schemes. 

This project completely reimagines the legacy desktop application, migrating it to a robust **Web Architecture (v2.0)** that offers superior flexibility, user experience, and meaningful validation.

---

## ✨ What's New in v2.0 (2026-02-03)

The **v2.0** update marks a major milestone in the project's evolution:

*   **🌐 Web Architecture Migration**: Completely migrated from desktop (Tkinter) to a modern B/S architecture using **Next.js 15** + **FastAPI**.
*   **🎨 User Experience Upgrade**: Introduced a modernized UI with Shadcn/UI components, featuring responsive design and native **Dark Mode** support.
*   **🧙‍♂️ Visual Configuration Wizard**: A step-by-step wizard guide simplifies the complex parameter setup for Study Info, Stratification, and Drug Supply.
*   **🌍 Internationalization (i18n)**: One-click switching between **English** and **Chinese** interfaces.
*   **⚡ Real-Time Preview**: Instantly generate, preview, copy, or download the SAS code without local compilation.

---

## 🏗 System Architecture

The application adopts a **Thick Model + Template Engine** architecture to ensure logic separation and scalability.

### 1. Frontend (`/frontend`)
*   **Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Zustand via Persist.
*   **Key Capabilities**:
    *   **BatchConfigManager**: Sophisticated UI for managing multi-batch drug supply based on stratification factors.
    *   **Dynamic Validation**: Zod schemas ensure all inputs (e.g., block sizes, ratios) are valid before generation.
    *   **State Persistence**: Auto-saves your configuration progress locally.

### 2. Backend API (`/backend`)
*   **Tech Stack**: FastAPI (Python 3.10+), Pydantic.
*   **Responsibilities**:
    *   API Gateway for the frontend.
    *   **Thick Model Conversion**: Transforms flat JSON config into deeply nested, type-safe domain objects (`StudyDesignConfig`).
    *   **Template Serving**: Manages and serves Excel Templates for different IVRS vendors.

### 3. Core Engine (`/sas_randomizer`)
*   **Engine**: Jinja2 + Python Builders.
*   **Philosophy**: **Logic in Templates, Data in Models**.
*   **Features**:
    *   **Heterogeneous Cohorts**: diverse randomization logic per cohort (e.g. diff block sizes).
    *   **Templates (`.sas.j2`)**: All SAS logic resides in maintainable Jinja2 templates, not python strings.
    *   **Vendor Support**: Built-in support for **BioKnow (供应商A)** and **Shanhu (供应商B)** blind formats.

---

## 📂 Project Structure

```bash
.
├── frontend/                  # Next.js Application
│   ├── app/                   # App Router pages
│   ├── components/            # Shadcn UI & Feature Components
│   ├── lib/                   # Stores, API hooks, Translations
│   └── ...
│
├── backend/                   # FastAPI Server
│   ├── app/
│   │   ├── api/               # Endpoints
│   │   └── schemas/           # API Contract Pydantic Models
│   └── ...
│
└── sas_randomizer/            # Core Generation Library
    ├── core_refactored/       
    │   ├── templates/         # Jinja2 SAS Templates (*.sas.j2)
    │   ├── builders/          # Python Data Builders
    │   └── transformers.py    # UI -> Domain Adapters
    └── ...
```

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v18+)
*   **Python** (v3.10+)

### 1. Start the Backend
```bash
# Install dependencies
pip install fastapi uvicorn jinja2 pydantic pandas openpyxl

# Run the server from project root
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Docs: http://localhost:8000/docs*

### 2. Start the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```
*Web UI: http://localhost:3000*

---

## 📜 Version History

*   **v2.0 (2026-02-03)**: Web Migration, i18n, Visual Wizard.
*   **v1.3 (2025-10-10)**: Added XLSX output support for Shanhu 5.X.
*   **v1.2 (2025-09-28)**: Fixed path gen bugs; optimized RTF paging; Enhanced CSV DSD options.
*   **v1.1 (2025-09-19)**: Added Shanhu Lite support and Subject/Drug blind templates.
*   **v1.0 (2025-09-17)**: Initial Release (Desktop).

---

## 📝 License
Proprietary / Internal Use Only.