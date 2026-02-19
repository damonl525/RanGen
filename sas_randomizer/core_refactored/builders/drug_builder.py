"""药物随机化构建器 (Refactored)

本模块负责构建药物随机化相关的SAS代码。
已重构为使用 Jinja2 模板引擎和 Pydantic 数据模型。
"""

from typing import Dict, Any, List
from ..utils.template_renderer import TemplateRenderer
from ..transformers import convert_ui_payload_to_study_design

# Initialize Renderer
renderer = TemplateRenderer()

def generate_drug_builder_code(payload: Dict[str, Any]) -> str:
    """
    生成完整的药物随机化SAS代码。
    
    Args:
        payload: 包含完整研究配置的字典 (Study ID, Client, Drug Config, Protocols etc.)
                 结构应符合 transformers.convert_ui_payload_to_study_design 的期望。
                 
    Returns:
        str: 渲染后的 SAS 代码
    """
    # 1. Transform raw dict to Pydantic Model (Superset)
    study_design = convert_ui_payload_to_study_design(payload)
    
    # 2. Render Template
    # We pass 'study' as the context variable
    return renderer.render('drug_randomization.sas.j2', {'study': study_design})

# -----------------------------------------------------------------------------
# Legacy Export Logic (If needed for Supplier Mapping post-processing)
# -----------------------------------------------------------------------------

def apply_supplier_mapping(sas_code: str, mapping: Dict[str, str]) -> str:
    """
    [Phase 3] Post-process SAS code to apply supplier-specific column mappings.
    Currently a placeholder for future extensibility.
    
    Args:
        sas_code: Generated SAS code
        mapping: Dict of {internal_col: supplier_col}
    
    Returns:
        str: Modified SAS code
    """
    if not mapping:
        return sas_code
        
    # Logic to append PROC DATASETS / RENAME would go here
    return sas_code

# -----------------------------------------------------------------------------
# Legacy Functions Compatibility (Deprecated but kept to avoid immediate import errors if other modules use them)
# Warning: These might not work correctly if mixed with the new system. 
# The goal is to traverse sas_generator to ONLY use generate_drug_builder_code.
# -----------------------------------------------------------------------------

def generate_drug_rand_call(config: Dict[str, Any]) -> str:
    return "/* DEPRECATED: generate_drug_rand_call replaced by template engine */"

def generate_drug_post_processing(config: Dict[str, Any]) -> str:
    return ""

def generate_drug_reporting_calls(config: Dict[str, Any]) -> str:
    return ""

def generate_strata_batch_check(config: Dict[str, Any]) -> str:
    return ""

def generate_strata_batch_logic(config: Dict[str, Any]) -> str:
    return ""