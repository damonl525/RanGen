"""Unit tests for SASRandomizationGenerator._validate_parameters."""

import pytest
from sas_randomizer.core_refactored.sas_generator import SASRandomizationGenerator


def _make_kwargs(**overrides):
    """Build generator kwargs with sensible defaults for testing."""
    defaults = {
        "study_id": "TEST001",
        "protocol_title": "Test Protocol",
        "client": "Test Client",
        "company": "Test Company",
        "treatment_arms": [
            {"armcd": "TRT", "arm": "Treatment", "ratio": 1},
            {"armcd": "PBO", "arm": "Placebo", "ratio": 1},
        ],
    }
    defaults.update(overrides)
    return defaults


class TestValidateParametersHappy:
    """Parameters that should pass validation."""

    def test_minimal_valid(self):
        gen = SASRandomizationGenerator(**_make_kwargs())
        assert gen.study_id == "TEST001"

    def test_with_stratification(self):
        gen = SASRandomizationGenerator(**_make_kwargs(
            stratification_factors=["site"],
            strata_levels={"site": ["S1", "S2"]},
        ))
        assert gen.stratification_factors == ["site"]

    def test_with_variable_blocks(self):
        gen = SASRandomizationGenerator(**_make_kwargs(
            variable_block_enabled=True,
            variable_block_sizes=[2, 4, 6],
        ))
        assert gen.variable_block_enabled is True

    def test_with_multi_protocol(self):
        gen = SASRandomizationGenerator(**_make_kwargs(
            multi_protocol=True,
            protocols=[{"name": "SubStudy A"}],
        ))
        assert gen.multi_protocol is True


class TestValidateParametersErrors:
    """Parameters that should raise ValueError."""

    def test_empty_study_id(self):
        with pytest.raises(ValueError, match="研究ID"):
            SASRandomizationGenerator(**_make_kwargs(study_id=""))

    def test_empty_protocol_title(self):
        with pytest.raises(ValueError, match="方案标题"):
            SASRandomizationGenerator(**_make_kwargs(protocol_title=""))

    def test_empty_client(self):
        with pytest.raises(ValueError, match="申办方"):
            SASRandomizationGenerator(**_make_kwargs(client=""))

    def test_empty_company(self):
        with pytest.raises(ValueError, match="编码单位"):
            SASRandomizationGenerator(**_make_kwargs(company=""))

    def test_empty_treatment_arms(self):
        with pytest.raises(ValueError, match="治疗组别"):
            SASRandomizationGenerator(**_make_kwargs(treatment_arms=[]))

    def test_arm_not_dict(self):
        with pytest.raises(ValueError, match="治疗组别配置必须是字典"):
            SASRandomizationGenerator(**_make_kwargs(treatment_arms=["not_a_dict"]))

    def test_arm_missing_armcd(self):
        with pytest.raises(ValueError, match="armcd"):
            SASRandomizationGenerator(**_make_kwargs(treatment_arms=[
                {"arm": "NoCode", "ratio": 1}
            ]))

    def test_stratification_missing_levels(self):
        with pytest.raises(ValueError, match="missing_因子"):
            SASRandomizationGenerator(**_make_kwargs(
                stratification_factors=["missing_因子"],
                strata_levels={},
            ))

    def test_variable_block_no_sizes(self):
        with pytest.raises(ValueError, match="可变区组"):
            SASRandomizationGenerator(**_make_kwargs(
                variable_block_enabled=True,
                variable_block_sizes=[],
            ))

    def test_multi_protocol_no_protocols(self):
        with pytest.raises(ValueError, match="多子方案"):
            SASRandomizationGenerator(**_make_kwargs(
                multi_protocol=True,
                protocols=[],
            ))
