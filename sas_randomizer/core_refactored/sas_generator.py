"""SAS随机化代码生成器主控制器

该模块提供重构后的SAS代码生成器，使用模块化的builder架构。
"""

import textwrap
from typing import List, Dict, Optional, Union, Any

from .builders.subject_builder import (
    generate_subject_builder_code
)
from .builders.drug_builder import (
    generate_drug_builder_code
)
from .utils.template_renderer import TemplateRenderer

renderer = TemplateRenderer()


class SASRandomizationGenerator:
    """
    重构后的SAS随机化代码生成器
    
    使用模块化的builder架构，将代码生成逻辑分解为独立的函数。
    """
    
    def __init__(
        self,
        study_id: str,
        protocol_title: str,
        client: str,
        company: str,
        treatment_arms: List[Dict[str, str]],
        status: str = "Draft",
        output_path: str = "&_rootpath.",
        is_double_blind: bool = True,
        stratification_factors: Optional[List[str]] = None,
        strata_levels: Optional[Dict[str, List[str]]] = None,
        blocks_per_stratum: int = 10,
        block_size: int = 4,
        start_subject_number: int = 1,
        subject_number_prefix: str = "R",
        subject_number_length: int = 4,
        num_gap: int = 0,
        macro_type: str = "标准",
        allocation_ratio: str = "1:1",
        variable_block_enabled: bool = False,
        variable_block_sizes: List[int] = None,
        total_sample_size: int = 40,  # 新增：总样本量参数
        subject_seed: Union[int, str] = "RANDOM",
        drug_seed: Union[int, str] = "RANDOM",
        drug_randomization_config: Optional[Dict] = None,
        mirror_replacement: bool = False,
        mirror_gap: int = 1000,
        multi_protocol: bool = False,
        protocols: Optional[List[Dict[str, str]]] = None,
        main_study_name: str = "主研究：默认研究",
        supplier: str = "供应商A",  # 新增：供应商参数
        is_server_run: bool = False,
        server_path: Optional[str] = None,
    ):
        """
        初始化SAS随机化代码生成器
        
        Args:
            study_id: 研究ID
            protocol_title: 方案标题
            client: 申办方
            company: 编码单位
            treatment_arms: 治疗组别配置
            status: 状态
            output_path: 输出路径
            is_double_blind: 是否双盲
            stratification_factors: 分层因子
            strata_levels: 分层水平
            blocks_per_stratum: 每个分层的区组数
            block_size: 区组大小
            start_subject_number: 起始受试者编号
            subject_number_prefix: 受试者编号前缀
            subject_number_length: 受试者编号长度
            num_gap: 分层间编号间隔
            macro_type: 宏类型
            allocation_ratio: 分配比例
            variable_block_enabled: 是否启用可变区组
            variable_block_sizes: 可变区组大小列表
            total_sample_size: 总样本量（用于可变区组）
            subject_seed: 受试者随机化种子
            drug_seed: 药物随机化种子
            drug_randomization_config: 药物随机化配置
            mirror_replacement: 镜像替换功能
            multi_protocol: 多子方案功能
            protocols: 子方案列表
            main_study_name: 主研究名称
            supplier: 供应商名称
        """
        self.study_id = study_id
        self.protocol_title = protocol_title
        self.client = client
        self.company = company
        self.treatment_arms = treatment_arms
        self.status = status
        self.output_path = output_path
        self.is_double_blind = is_double_blind
        self.stratification_factors = stratification_factors or []
        self.strata_levels = strata_levels or {}
        self.blocks_per_stratum = blocks_per_stratum
        self.block_size = block_size
        self.start_subject_number = start_subject_number
        self.subject_number_prefix = subject_number_prefix
        self.subject_number_length = subject_number_length
        self.num_gap = num_gap
        self.macro_type = macro_type
        self.allocation_ratio = allocation_ratio
        self.variable_block_enabled = variable_block_enabled
        self.variable_block_sizes = variable_block_sizes or []
        self.total_sample_size = total_sample_size  # 新增：总样本量属性
        self.subject_seed = subject_seed
        self.drug_seed = drug_seed
        self.drug_randomization_config = drug_randomization_config
        self.mirror_replacement = mirror_replacement
        self.mirror_gap = mirror_gap
        self.multi_protocol = multi_protocol
        self.protocols = protocols or []
        self.main_study_name = main_study_name
        self.supplier = supplier  # 新增：供应商参数
        self.is_server_run = is_server_run
        self.server_path = server_path
        
        # 验证参数
        self._validate_parameters()
    
    def _validate_parameters(self):
        """
        验证输入参数的有效性
        """
        if not self.study_id:
            raise ValueError("研究ID不能为空")
        if not self.protocol_title:
            raise ValueError("方案标题不能为空")
        if not self.client:
            raise ValueError("申办方不能为空")
        if not self.company:
            raise ValueError("编码单位不能为空")
        if not self.treatment_arms:
            raise ValueError("治疗组别配置不能为空")
        
        # 验证治疗组别配置
        for arm in self.treatment_arms:
            if not isinstance(arm, dict):
                raise ValueError("治疗组别配置必须是字典")
            if 'armcd' not in arm or 'arm' not in arm:
                raise ValueError("治疗组别配置必须包含armcd和arm字段")
        
        # 验证分层配置
        if self.stratification_factors:
            for factor in self.stratification_factors:
                if factor not in self.strata_levels:
                    raise ValueError(f"分层因子'{factor}'缺少对应的水平定义")
        
        # 验证可变区组配置
        if self.variable_block_enabled and not self.variable_block_sizes:
            raise ValueError("启用可变区组时必须提供区组大小列表")
        
        # 验证多子方案配置
        if self.multi_protocol and not self.protocols:
            raise ValueError("启用多子方案时必须提供子方案列表")
    
    def generate_sas_code(self) -> str:
        """
        生成完整的SAS随机化代码
        
        Returns:
            str: 生成的SAS代码
        """
        code_sections = []
        
        # 0. 构建统一 Payload
        # 这个Payload将被 Subject Builder 和 Drug Builder 共同使用
        full_payload = {
            'study_id': self.study_id,
            'protocol_title': self.protocol_title,
            'client': self.client,
            'company': self.company,
            'status': self.status,
            'output_path': self.output_path,
            'subject_seed': self.subject_seed,
            'drug_seed': self.drug_seed,
            'treatment_arms': self.treatment_arms,
            'stratification_factors': self.stratification_factors,
            'strata_levels': self.strata_levels,
            'blocks_per_stratum': self.blocks_per_stratum,
            'block_size': self.block_size,
            'start_subject_number': self.start_subject_number,
            'subject_number_prefix': self.subject_number_prefix,
            'subject_number_length': self.subject_number_length,
            'num_gap': self.num_gap,
            'macro_type': self.macro_type,
            'allocation_ratio': self.allocation_ratio,
            'variable_block_enabled': self.variable_block_enabled,
            'variable_block_sizes': self.variable_block_sizes,
            'total_sample_size': self.total_sample_size,
            'mirror_replacement': self.mirror_replacement,
            'mirror_gap': self.mirror_gap,
            'multi_protocol': self.multi_protocol,
            'protocols': self.protocols,
            'main_study_name': self.main_study_name,
            'supplier': self.supplier,
            'drug_randomization_config': self.drug_randomization_config,
            'is_double_blind': self.is_double_blind,
            'is_server_run': self.is_server_run,
            'server_path': self.server_path
        }

        # 1. 头部信息和格式定义 (Template-Based)
        import datetime
        full_payload['now'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 为了兼容 template 里的 study 对象访问方式
        # 我们这里临时构建一个 simple wrapper 或者直接传 payload
        # 但 best practice 是统一都过 transformers
        # 考虑到 subject_builder 里也会转，我们可以在这里先转一次，或者让 template 接受 dict
        # 简单起见，我们假设 template 使用 {{ study.xxx }} 访问
        # 所以我们需要把 payload 包装在 'study' key 里，或者让 transformers 处理
        
        from .transformers import convert_ui_payload_to_study_design
        study_design = convert_ui_payload_to_study_design(full_payload)
        
        code_sections.append(renderer.render('common_header.sas.j2', {
            'study': study_design,
            'now': full_payload['now']
        }))
        
        # 2. 宏定义 (Separated)
        code_sections.append(renderer.render('macro_definitions.sas.j2', {
             'study': study_design
        }))
        
        # 3. 受试者随机化 (New Template-Based Builder)
        # 包含：宏定义、变量设置、随机化调用、后处理、报告
        code_sections.append(generate_subject_builder_code(full_payload))
        
        # 4. 药物随机化 (如果配置)
        if self.drug_randomization_config and self.drug_randomization_config.get('enabled', False):
            code_sections.append(generate_drug_builder_code(full_payload))
        
        return "\n\n".join(code_sections)
    
    def _generate_macro_definitions(self) -> str:
        """
        DEPRECATED: 宏定义现已包含在 builder 模板中。
        """
        return ""
    
    def _generate_variable_documentation(self) -> str:
        """
        DEPRECATED: 变量文档现已包含在 builder 模板中。
        """
        return ""
    
    def get_summary(self) -> Dict[str, Any]:
        """
        获取生成器配置摘要
        
        Returns:
            Dict[str, Any]: 配置摘要
        """
        return {
            'study_id': self.study_id,
            'protocol_title': self.protocol_title,
            'client': self.client,
            'company': self.company,
            'status': self.status,
            'treatment_arms_count': len(self.treatment_arms),
            'stratification_factors': self.stratification_factors,
            'macro_type': self.macro_type,
            'has_drug_randomization': bool(self.drug_randomization_config),
            'multi_protocol': self.multi_protocol,
            'protocols_count': len(self.protocols) if self.protocols else 0
        }
    
    def get_config_summary(self) -> str:
        """
        获取配置摘要的文本描述
        
        Returns:
            str: 配置摘要文本
        """
        summary_lines = []
        summary_lines.append(f"研究ID: {self.study_id}")
        summary_lines.append(f"方案标题: {self.protocol_title}")
        summary_lines.append(f"申办方: {self.client}")
        summary_lines.append(f"编码单位: {self.company}")
        summary_lines.append(f"状态: {self.status}")
        
        # 盲法信息
        blind_type = "双盲" if self.is_double_blind else "单盲"
        summary_lines.append(f"盲法: {blind_type}")
        
        # 治疗组信息
        summary_lines.append(f"治疗组: {len(self.treatment_arms)}个")
        
        # 分层信息
        if self.stratification_factors:
            summary_lines.append(f"分层因子: {len(self.stratification_factors)}个")
        else:
            summary_lines.append("分层因子: 无")
        
        # 药物随机化信息
        if self.drug_randomization_config and self.drug_randomization_config.get('enabled'):
            drug_arms = self.drug_randomization_config.get('drug_arms', [])
            summary_lines.append(f"药物随机化: 启用")
            summary_lines.append(f"药物组: {len(drug_arms)}个")
        else:
            summary_lines.append("药物随机化: 未启用")
        
        return "\n".join(summary_lines)