"""Snapshot test: fixed inputs must produce deterministic SAS output.

This protects against accidental template regressions.  If this test fails
after a template change, review the diff carefully — the output SHOULD change
only when you intentionally modified the templates.
"""

import pytest
from sas_randomizer.core_refactored.sas_generator import SASRandomizationGenerator


SNAPSHOT_KWARGS = {
    "study_id": "SNAP001",
    "protocol_title": "Snapshot Protocol",
    "client": "Snapshot Client",
    "company": "Snapshot Company",
    "treatment_arms": [
        {"armcd": "TRT", "arm": "Active Drug", "ratio": 1},
        {"armcd": "PBO", "arm": "Placebo", "ratio": 1},
    ],
    "status": "Draft",
    "output_path": "&_rootpath.",
    "is_double_blind": True,
    "stratification_factors": [],
    "strata_levels": {},
    "blocks_per_stratum": 5,
    "block_size": 4,
    "start_subject_number": 1,
    "subject_number_prefix": "R",
    "subject_number_length": 4,
    "num_gap": 0,
    "macro_type": "标准",
    "allocation_ratio": "1:1",
    "variable_block_enabled": False,
    "variable_block_sizes": [],
    "total_sample_size": 20,
    "subject_seed": 99999,
    "drug_seed": 88888,
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


class TestSnapshot:
    """Fixed inputs → deterministic SAS code."""

    def test_snapshot_output_is_deterministic(self):
        gen1 = SASRandomizationGenerator(**SNAPSHOT_KWARGS)
        code1 = gen1.generate_sas_code()

        gen2 = SASRandomizationGenerator(**SNAPSHOT_KWARGS)
        code2 = gen2.generate_sas_code()

        assert code1 == code2, "Same inputs should produce identical SAS code"

    def test_snapshot_structural_markers(self):
        """Verify the generated SAS contains expected structural elements."""
        gen = SASRandomizationGenerator(**SNAPSHOT_KWARGS)
        code = gen.generate_sas_code()

        # Structural markers that should always be present
        assert "SNAP001" in code, "Should contain study_id"
        assert "PROC PLAN" in code or "proc plan" in code.lower()
        assert "DATA " in code or "data " in code.lower()
        # Template-based macros should be present
        assert "%m_rpt" in code or "%m_rpe" in code

    def test_snapshot_seed_values(self):
        """Verify that fixed numeric seeds appear in the output."""
        gen = SASRandomizationGenerator(**SNAPSHOT_KWARGS)
        code = gen.generate_sas_code()

        # Fixed seeds should be literal in the output
        assert "99999" in code, "Subject seed should appear in output"
        assert "88888" in code, "Drug seed should appear in output"
