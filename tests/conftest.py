"""Shared test fixtures for RanGen."""

import pytest
import sys
import os

# Ensure project root is on sys.path for test runs
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi.testclient import TestClient


@pytest.fixture
def default_request_data():
    """Minimal valid request payload that should produce SAS code."""
    return {
        "study_id": "TEST001",
        "protocol_title": "Test Protocol",
        "client": "Test Client",
        "company": "Test Company",
        "treatment_arms": [
            {"armcd": "TRT", "arm": "Treatment", "ratio": 1},
            {"armcd": "PBO", "arm": "Placebo", "ratio": 1},
        ],
        "status": "Draft",
        "output_path": "&_rootpath.",
        "is_double_blind": True,
        "stratification_factors": [],
        "strata_levels": {},
        "blocks_per_stratum": 10,
        "block_size": 4,
        "start_subject_number": 1,
        "subject_number_prefix": "R",
        "subject_number_length": 4,
        "num_gap": 0,
        "macro_type": "标准",
        "allocation_ratio": "1:1",
        "variable_block_enabled": False,
        "variable_block_sizes": [],
        "total_sample_size": 40,
        "subject_seed": 12345,
        "drug_seed": 67890,
        "drug_randomization_config": None,
        "mirror_replacement": False,
        "mirror_gap": 1000,
        "multi_protocol": False,
        "protocols": [],
        "main_study_name": "主研究：默认研究",
        "supplier": "供应商A",
        "is_server_run": False,
        "server_path": None,
    }


@pytest.fixture
def client():
    """FastAPI TestClient for endpoint tests."""
    from backend.app.main import app
    return TestClient(app)
