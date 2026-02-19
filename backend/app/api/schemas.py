from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Any

class TreatmentArm(BaseModel):
    armcd: str
    arm: str
    ratio: Union[int, float]

class DrugArm(BaseModel):
    code: str
    name: str
    ratio: Union[int, float]

class DrugRandomizationConfig(BaseModel):
    enabled: bool = False
    drug_arms: List[DrugArm] = []
    drug_stratification_factors: List[str] = []
    drug_strata_levels: Dict[str, List[str]] = {}
    drug_block_size: int = 4
    drug_block_layers: int = 10
    drug_start_number: int = 1
    drug_number_prefix: str = "D"
    drug_number_length: int = 4
    drug_num_gap: int = 0
    drug_report_units: str = "瓶"
    drug_sec_rand_enabled: bool = False
    drug_batch_configs: Dict[str, Any] = {}
    
class SASGenerationRequest(BaseModel):
    study_id: str
    protocol_title: str
    client: str
    company: str
    treatment_arms: List[TreatmentArm]
    status: str = "Draft"
    output_path: str = "&_rootpath."
    is_double_blind: bool = True
    stratification_factors: List[str] = []
    strata_levels: Dict[str, List[str]] = {}
    blocks_per_stratum: int = 10
    block_size: int = 4
    start_subject_number: int = 1
    subject_number_prefix: str = "R"
    subject_number_length: int = 4
    num_gap: int = 0
    macro_type: str = "标准"
    allocation_ratio: str = "1:1"
    variable_block_enabled: bool = False
    variable_block_sizes: List[int] = []
    total_sample_size: int = 40
    subject_seed: Union[int, str] = "RANDOM"
    drug_seed: Union[int, str] = "RANDOM"
    drug_randomization_config: Optional[DrugRandomizationConfig] = None
    mirror_replacement: bool = False
    mirror_gap: int = 1000
    multi_protocol: bool = False
    protocols: List[Dict[str, Any]] = []
    main_study_name: str = "主研究：默认研究"
    supplier: str = "供应商A"
    
    # Server Execution Settings
    is_server_run: bool = False
    server_path: Optional[str] = None
