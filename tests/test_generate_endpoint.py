"""Contract tests for POST /api/v1/generate."""

from unittest.mock import patch


class TestGenerateHappyPath:
    """Happy-path: valid requests return 200 + SAS code."""

    def test_minimal_valid_request(self, client, default_request_data):
        response = client.post("/api/v1/generate", json=default_request_data)
        assert response.status_code == 200
        assert isinstance(response.text, str)
        assert len(response.text) > 100, "SAS code should be substantial"
        assert "PROC PLAN" in response.text or "proc plan" in response.text.lower()

    def test_with_stratification(self, client, default_request_data):
        data = {
            **default_request_data,
            "stratification_factors": ["site"],
            "strata_levels": {"site": ["Site1", "Site2"]},
        }
        response = client.post("/api/v1/generate", json=data)
        assert response.status_code == 200

    def test_with_drug_randomization(self, client, default_request_data):
        data = {
            **default_request_data,
            "drug_randomization_config": {
                "enabled": True,
                "drug_arms": [
                    {"code": "A", "name": "Drug A", "ratio": 1},
                    {"code": "B", "name": "Drug B", "ratio": 1},
                ],
                "drug_stratification_factors": [],
                "drug_strata_levels": {},
                "drug_block_size": 4,
                "drug_block_layers": 10,
                "drug_start_number": 1,
                "drug_number_prefix": "D",
                "drug_number_length": 4,
                "drug_num_gap": 0,
                "drug_report_units": "瓶",
                "drug_sec_rand_enabled": False,
                "drug_batch_configs": {},
            },
        }
        response = client.post("/api/v1/generate", json=data)
        assert response.status_code == 200


class TestGenerateValidationErrors:
    """Validation failures (ValueError from generator) should return 400 with
    a user-friendly message, not 500 with internal traceback."""

    def test_empty_study_id(self, client, default_request_data):
        data = {**default_request_data, "study_id": ""}
        response = client.post("/api/v1/generate", json=data)
        assert response.status_code == 400
        detail = response.json()["detail"]
        assert "研究ID" in detail

    def test_empty_protocol_title(self, client, default_request_data):
        data = {**default_request_data, "protocol_title": ""}
        response = client.post("/api/v1/generate", json=data)
        assert response.status_code == 400
        assert "方案标题" in response.json()["detail"]

    def test_empty_treatment_arms(self, client, default_request_data):
        data = {**default_request_data, "treatment_arms": []}
        response = client.post("/api/v1/generate", json=data)
        assert response.status_code == 400
        assert "治疗组别" in response.json()["detail"]

    def test_missing_strata_levels(self, client, default_request_data):
        data = {
            **default_request_data,
            "stratification_factors": ["missing_factor"],
            "strata_levels": {},
        }
        response = client.post("/api/v1/generate", json=data)
        assert response.status_code == 400
        assert "missing_factor" in response.json()["detail"]


class TestGenerateServerErrors:
    """Non-ValueError (system) errors must return 500 with a generic message,
    never leaking internal exception text (P0-1 system-error branch)."""

    def test_internal_error_returns_generic_500(self, client, default_request_data):
        # Simulate a non-business failure deep in the generator carrying
        # sensitive-looking text. It must NOT surface in the HTTP response.
        secret = "SECRET_INTERNAL_DETAIL_9f8e7d"
        with patch(
            "backend.app.services.sas_service.SASRandomizationGenerator"
        ) as mock_gen:
            mock_gen.return_value.generate_sas_code.side_effect = RuntimeError(secret)
            response = client.post("/api/v1/generate", json=default_request_data)

        assert response.status_code == 500
        detail = response.json()["detail"]
        # Internal exception text must never reach the client
        assert secret not in detail
        # Only the generic, safe message is exposed (P0-1 fix contract)
        assert detail == "Internal server error. Please check the application logs."
