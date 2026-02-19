"""受试者随机化构建器模块 (Refactored)

本模块负责构建受试者随机化相关的SAS代码。
已重构为使用 Jinja2 模板引擎和 Pydantic 数据模型。
"""

from typing import Dict, Any, List
from ..utils.template_renderer import TemplateRenderer
from ..transformers import convert_ui_payload_to_study_design

# Initialize Renderer
renderer = TemplateRenderer()

def generate_subject_builder_code(payload: Dict[str, Any]) -> str:
    """
    生成完整的受试者随机化SAS代码。
    
    Args:
        payload: 包含完整研究配置的字典
                 结构应符合 transformers.convert_ui_payload_to_study_design 的期望。
                 
    Returns:
        str: 渲染后的 SAS 代码
    """
    # 1. Transform raw dict to Pydantic Model (Superset)
    study_design = convert_ui_payload_to_study_design(payload)
    
    # 2. Render Template
    # We pass 'study' as the context variable
    return renderer.render('subject_randomization.sas.j2', {'study': study_design})

# -----------------------------------------------------------------------------
# Legacy Export Logic (Deprecated Compatibility Layer)
# -----------------------------------------------------------------------------

def generate_main_rand_call(*args, **kwargs) -> str:
    return "/* DEPRECATED: generate_main_rand_call replaced by template engine */"

def generate_main_post_processing(*args, **kwargs) -> str:
    return ""

def generate_main_reporting_calls(*args, **kwargs) -> str:
    return ""