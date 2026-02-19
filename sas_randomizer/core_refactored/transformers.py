from typing import Dict, Any, List
from .schemas import (
    StudyDesignConfig, CohortConfig, DrugRandomizationConfig, 
    DrugArm, StratificationFactor, StratumBatchSettings, BatchItem, OutputSettings,
    TreatmentArm, ProtocolConfig
)

def convert_ui_payload_to_study_design(payload: Dict[str, Any]) -> StudyDesignConfig:
    """
    Converts the raw UI JSON payload (Legacy/React format) into the new 
    strictly-typed StudyDesignConfig (Superset Model).
    """
    
    # 1. Base Study Info
    study_id = payload.get("study_id", "Unknown Study")
    client = payload.get("client", "")
    company = payload.get("company", "")
    status = payload.get("status", "Final")
    drug_seed = str(payload.get("drug_seed", "123456789"))
    subject_seed = str(payload.get("subject_seed", "987654321"))
    
    # Subject Randomization
    treatment_arms = []
    for arm in payload.get("treatment_arms", []):
         treatment_arms.append(TreatmentArm(
             armcd=str(arm.get("armcd", "")),
             name=str(arm.get("arm", "")),
             ratio=int(arm.get("ratio", 1))
         ))

    stratification_factors = payload.get("stratification_factors", [])
    strata_levels = payload.get("strata_levels", {})
    
    # Subject Parameters
    main_study_name = payload.get("main_study_name", "主方案")
    blocks_per_stratum = int(payload.get("blocks_per_stratum", 10))
    block_size = int(payload.get("block_size", 4))
    start_subject_number = int(payload.get("start_subject_number", 1))
    subject_number_prefix = payload.get("subject_number_prefix", "")
    subject_number_length = int(payload.get("subject_number_length", 4))
    num_gap = int(payload.get("num_gap", 0))
    macro_type = payload.get("macro_type", "标准")
    allocation_ratio = payload.get("allocation_ratio", "1:1")
    variable_block_enabled = bool(payload.get("variable_block_enabled", False))
    variable_block_sizes = payload.get("variable_block_sizes", [])
    total_sample_size = int(payload.get("total_sample_size", 100))
    mirror_replacement = bool(payload.get("mirror_replacement", False))
    supplier = payload.get("supplier", "供应商A")
    is_double_blind = bool(payload.get("is_double_blind", True))

    # Output Settings
    output_settings = OutputSettings(
        path=payload.get("output_path", "&_rootpath."),
        supplier=supplier
    )
    
    cohorts: List[CohortConfig] = []
    protocol_configs: List[ProtocolConfig] = []
    
    # 2. Cohort Detection (Multi-Protocol vs Single)
    protocols = payload.get("protocols", [])
    multi_protocol = payload.get("multi_protocol", False)
    
    if multi_protocol and protocols:
        # Multi-Cohort Mode
        for idx, proto in enumerate(protocols):
            # Each protocol acts as a cohort
            # Merging logic: Protocol might override some root settings or inherit them
            cohort_name = proto.get("name", f"Cohort {idx+1}")
            cid = proto.get("id", f"cohort_{idx+1}")
            
            # Add to Protocol Configs
            protocol_configs.append(ProtocolConfig(id=cid, name=cohort_name))
            
            # Extract Drug Config for this protocol
            # If the protocol has its own "drug_randomization_config", use it.
            # Otherwise, fallback to the root one (this logic depends on UI behavior, 
            # assuming fully heterogeneous means they have their own).
            drc_payload = proto.get("drug_randomization_config", payload.get("drug_randomization_config", {}))
            
            # Merge root overrides if needed (e.g., if drc_payload is partial)
            # For strict heterogeneity, we expect drc_payload to be complete or we clone root and patch.
            # Let's assume drc_payload is the source.
            
            drc_model = _parse_drug_config(drc_payload, payload) # Pass root payload for fallbacks
            
            cohorts.append(CohortConfig(
                id=cid,
                name=cohort_name,
                config=drc_model
            ))
    else:
        # Single Cohort Mode
        drc_payload = payload.get("drug_randomization_config", {})
        # If empty, maybe the root IS the config (legacy structure variance)
        if not drc_payload and "drug_arms" in payload:
            drc_payload = payload
            
        drc_model = _parse_drug_config(drc_payload, payload)
        
        cohorts.append(CohortConfig(
            id="default_cohort",
            name="主方案",
            config=drc_model
        ))
        
    return StudyDesignConfig(
        study_id=study_id,
        protocol_title=payload.get("protocol_title", ""),
        client=client,
        company=company,
        status=status,
        drug_seed=drug_seed,
        subject_seed=subject_seed,
        treatment_arms=treatment_arms,
        stratification_factors=stratification_factors,
        strata_levels=strata_levels,
        main_study_name=main_study_name,
        blocks_per_stratum=blocks_per_stratum,
        block_size=block_size,
        start_subject_number=start_subject_number,
        subject_number_prefix=subject_number_prefix,
        subject_number_length=subject_number_length,
        num_gap=num_gap,
        macro_type=macro_type,
        allocation_ratio=allocation_ratio,
        variable_block_enabled=variable_block_enabled,
        variable_block_sizes=variable_block_sizes,
        total_sample_size=total_sample_size,
        mirror_replacement=mirror_replacement,
        mirror_gap=int(payload.get("mirror_gap", 1000)),
        is_server_run=bool(payload.get("is_server_run", False)),
        server_path=payload.get("server_path"),
        multi_protocol=multi_protocol,
        protocols=protocol_configs,
        output_settings=output_settings,
        cohorts=cohorts,
        is_double_blind=is_double_blind,
        supplier=supplier,
        drug_randomization_config=drc_model # Populate top-level config for global macro generation
    )

def _parse_drug_config(drc: Dict[str, Any], root_payload: Dict[str, Any]) -> DrugRandomizationConfig:
    """Helper to parse DrugRandomizationConfig from a dict, handling messy UI structures."""
    if not drc:
        # Return default disabled config
        return DrugRandomizationConfig(enabled=False)
        
    enabled = drc.get("enabled", True)
    
    # 1. Arms
    arms_data = drc.get("drug_arms", root_payload.get("drug_arms", []))
    drug_arms = []
    for arm in arms_data:
        drug_arms.append(DrugArm(
            code=str(arm.get("code", arm.get("armcd", ""))),
            name=str(arm.get("name", arm.get("arm", ""))),
            ratio=int(arm.get("ratio", 1)),
            drug_spec=arm.get("drug_spec", "")
        ))
        
    # 2. Stratification & Batch Logic
    # The UI splits "stratification factors" (names) and "levels" (values) and "batch configs".
    # We must merge them.
    
    # Raw factors list (strings or dicts)
    raw_factors = drc.get("drug_stratification_factors", [])
    raw_levels = drc.get("drug_strata_levels", {})
    
    # Raw independent batch config (UI "BatchConfigManager" output)
    # Format: { "supply_factor": "FactorName", "configs": { "LevelName": [BatchItem] } }
    raw_batch_config = drc.get("drug_batch_configs", {})
    supply_factor_name = None
    supply_configs = {}
    
    if raw_batch_config:
        supply_factor_name = raw_batch_config.get("supply_factor")
        supply_configs = raw_batch_config.get("configs", {})
        
    stratification_factors: List[StratificationFactor] = []
    
    for f in raw_factors:
        # Handle string or dict input
        fname = f if isinstance(f, str) else f.get("factor", "")
        if not fname: continue
        
        # Get levels
        # Could be in f['levels'] or raw_levels[fname]
        levels = []
        if isinstance(f, dict):
            levels = f.get("levels", [])
        
        if not levels and fname in raw_levels:
            levels = raw_levels[fname]
            
        # Check if this factor is the "Supply Factor"
        batch_settings = None
        if supply_factor_name and fname.strip() == supply_factor_name.strip():
            # Merge batch configs
            batch_map = {}
            for lvl_name, batches in supply_configs.items():
                batch_items = []
                for b in batches:
                    batch_items.append(BatchItem(
                        batch_no=b.get("batch_no", b.get("no", 0)), # UI might use 'batch_no'
                        quantity=b.get("quantity", b.get("count", 0))
                    ))
                batch_map[lvl_name] = batch_items
            
            if batch_map:
                batch_settings = StratumBatchSettings(levels=batch_map)
                
        # Also check if 'f' (dict) already has 'batch_configs' (Legacy backend format)
        if isinstance(f, dict) and f.get("batch_enabled") and f.get("batch_configs"):
            # This logic mimics the old format, might overwrite or merge
            # Let's prioritize the specific 'drug_batch_configs' if it exists, 
            # otherwise fallback to this embedded one.
            if not batch_settings:
                # Parse embedded
                pass # Implementation simplified for now, assuming UI uses the newer format
        
        stratification_factors.append(StratificationFactor(
            factor_name=fname,
            levels=[str(l) for l in levels],
            batch_settings=batch_settings
        ))
        
    # 3. Parameters
    return DrugRandomizationConfig(
        enabled=enabled,
        drug_arms=drug_arms,
        stratification_factors=stratification_factors,
        block_size=int(drc.get("drug_block_size", drc.get("block_size", 4))),
        block_layers=int(drc.get("drug_block_layers", drc.get("block_layers", 600))),
        start_number=int(drc.get("start_drug_number", drc.get("drug_start_number", 1))),
        number_prefix=drc.get("drug_number_prefix", "D"),
        number_length=int(drc.get("drug_number_length", 4)),
        num_gap=int(drc.get("num_gap", drc.get("drug_num_gap", 0))),
        report_units=drc.get("drug_report_units", "盒"),
        sec_rand_enabled=bool(drc.get("drug_sec_rand_enabled", drc.get("sec_rand_enabled", False))),
        independent_batch_settings=None # If supply_factor didn't match any strata, we could put it here.
    )
