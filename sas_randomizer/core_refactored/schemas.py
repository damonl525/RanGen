from __future__ import annotations
from typing import List, Dict, Optional, Union, Any, Literal
from pydantic import BaseModel, Field, field_validator

class DrugArm(BaseModel):
    id: Optional[str] = None
    code: str
    name: str
    ratio: int = 1
    drug_spec: Optional[str] = ""

class BatchItem(BaseModel):
    """Configuration for a single batch supply."""
    batch_no: Union[str, int]
    quantity: Union[int, str]  # Can be 'auto'
    
    @field_validator('quantity')
    def validate_quantity(cls, v):
        if isinstance(v, str) and v.lower() == 'auto':
            return 'auto'
        try:
            return int(v)
        except ValueError:
            return 0

class StratumBatchSettings(BaseModel):
    """
    Batch configurations for a specific stratification factor.
    Key: Level name (e.g. "Male", "Female", or "Center1")
    Value: List of BatchItems for that level.
    """
    levels: Dict[str, List[BatchItem]] = Field(default_factory=dict)

class StratificationFactor(BaseModel):
    factor_name: str
    levels: List[str] = Field(default_factory=list)
    # If this factor controls batch supply, we store it here
    batch_settings: Optional[StratumBatchSettings] = None
    
    # Legacy support helper
    @property
    def batch_enabled(self) -> bool:
        return self.batch_settings is not None and bool(self.batch_settings.levels)

class DrugRandomizationConfig(BaseModel):
    """
    Configuration for Drug Randomization (blinded supplies).
    This logic can vary per cohort.
    """
    enabled: bool = True
    
    # Arms
    drug_arms: List[DrugArm] = Field(default_factory=list)
    
    # Stratification (Drug specific)
    stratification_factors: List[StratificationFactor] = Field(default_factory=list)
    
    # Parameters
    block_size: int = 4
    block_layers: int = 600  # "Block" in %m_rand
    start_number: int = 1
    number_prefix: str = "D"
    number_length: int = 4
    num_gap: int = 0
    report_units: str = "盒"
    
    # Secondary Randomization (Batch Assignment)
    sec_rand_enabled: bool = False
    
    # Independent Batch Config (if not attached to a stratum)
    # Legacy: "supply_factor" model found in UI
    independent_batch_settings: Optional[Dict[str, List[BatchItem]]] = None
    
    # For Jinja2 context helper
    def has_complex_batch_logic(self) -> bool:
        """Check if we need complex DATA Step logic for batch assignment."""
        return bool(self.stratification_factors and any(f.batch_enabled for f in self.stratification_factors))

class CohortConfig(BaseModel):
    """
    Represents a specific sub-population or protocol arm in the study.
    Each Cohort acts as a fully independent randomization unit if needed.
    """
    id: str  # Unique ID (e.g., "cohort_1", "protocol_A")
    name: str # Display name
    
    # Randomization Config for this cohort
    config: DrugRandomizationConfig

class OutputSettings(BaseModel):
    path: str = "&_rootpath."
    supplier: str = "供应商A"  # Default supplier

class TreatmentArm(BaseModel):
    armcd: str
    name: str
    ratio: int = 1

class ProtocolConfig(BaseModel):
    id: Optional[str] = None
    name: str

class StudyDesignConfig(BaseModel):
    """
    The Root Configuration Object (Superset).
    Capable of describing heterogeneous multi-cohort studies.
    """
    study_id: str
    protocol_title: Optional[str] = ""
    client: Optional[str] = ""
    company: Optional[str] = ""
    status: Optional[str] = "Final"
    
    # Global/Shared settings (seeds can be overridden per cohort technically, but usually shared)
    drug_seed: str = "123456789"
    subject_seed: str = "987654321"
    
    # Subject Randomization Config (Shared)
    treatment_arms: List[TreatmentArm] = Field(default_factory=list)
    stratification_factors: List[str] = Field(default_factory=list)
    strata_levels: Dict[str, List[str]] = Field(default_factory=dict)
    
    # Subject Randomization Parameters
    main_study_name: Optional[str] = "主方案"
    blocks_per_stratum: Optional[int] = 10
    block_size: Optional[int] = 4
    start_subject_number: Optional[int] = 1
    subject_number_prefix: Optional[str] = ""
    subject_number_length: Optional[int] = 4
    num_gap: Optional[int] = 0
    macro_type: Optional[str] = "标准"
    allocation_ratio: Optional[str] = "1:1"
    variable_block_enabled: bool = False
    variable_block_sizes: List[int] = Field(default_factory=list)
    total_sample_size: Optional[int] = 100
    mirror_replacement: bool = False
    mirror_gap: int = 1000
    
    # Server Execution Settings
    is_server_run: bool = False
    server_path: Optional[str] = None
    
    # Multi-Protocol / Cohort Support
    multi_protocol: bool = False
    protocols: List[ProtocolConfig] = Field(default_factory=list)
    
    # Manufacturer / Supplier / Output
    output_settings: OutputSettings = Field(default_factory=OutputSettings)
    
    # Drug Randomization (Global/Shared)
    drug_randomization_config: Optional[DrugRandomizationConfig] = None

    # Cohorts (The main logic containers for Drug Randomization, and potentially Subject Rand if heterogeneous)
    cohorts: List[CohortConfig] = Field(default_factory=list)
    
    # Double Blind
    is_double_blind: bool = True
    
    # Supplier
    supplier: str = "供应商A"

    @field_validator('cohorts')
    def validate_cohorts(cls, v):
        if not v:
            # We might want to allow empty for initialization, 
            # but valid generation needs at least one.
            pass 
        return v
