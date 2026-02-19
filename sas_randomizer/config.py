"""配置文件 - 管理SAS随机化代码生成器的默认设置"""

# 默认项目设置
# 默认项目设置
DEFAULT_PROJECT_SETTINGS = {
    "study_id": "XXXXXX",
    "protocol_title": "XXXXXX",
    "client": "XXXXXX",
    "company": "XXXXXX",
    "status": "Draft",
    "output_path": "&_rootpath.",
    "supplier": "供应商B 5.X",
    "main_study_name": "II期",
    "multi_protocol": False,
    "protocols": []
}

# 默认随机化设置
DEFAULT_RANDOMIZATION_SETTINGS = {
    "treatment_arms": [
        {"armcd": "TRT", "arm": "XXXXXX", "ratio": 1},
        {"armcd": "PBO", "arm": "XXXXXX", "ratio": 1}
    ],
    "is_double_blind": True,
    "stratification_factors": ["筛选时合并的危险因素个数"],
    "strata_levels": {
        "筛选时合并的危险因素个数": ["GE3_1", "GE3_2"]
    },
    "blocks_per_stratum": 20,
    "block_size": 4,
    "macro_type": "标准",
    "allocation_ratio": "1:1",
    "variable_block_enabled": False,
    "num_gap": 920,
    "total_sample_size": 80,
    "subject_seed": "123213412",
    "drug_seed": "124325431",
    "mirror_replacement": False,
    "drug_randomization_config": {
        "enabled": True,
        "drug_arms": [
            {"code": "A", "name": "XXXXXX", "ratio": 1},
            {"code": "B", "name": "XXXXXX", "ratio": 1}
        ],
        "drug_stratification_factors": ["批次"],
        "drug_strata_levels": {
            "批次": ["批次"]
        },
        "drug_block_size": 4,
        "drug_block_layers": 600,
        "drug_start_number": 1,
        "drug_number_prefix": "D",
        "drug_number_length": 4,
        "drug_num_gap": 0,
        "drug_report_units": "盒",
        "drug_sec_rand_enabled": True,
        "drug_batch_configs": {
            "supply_factor": "批次",
            "configs": {
                "批次": [
                    {"batch_no": "1", "quantity": 1920},
                    {"batch_no": "2", "quantity": 480}
                ]
            }
        }
    }
}

# 默认受试者编号设置
DEFAULT_SUBJECT_SETTINGS = {
    "start_subject_number": 1,
    "subject_number_prefix": "R",
    "subject_number_length": 4,
}

# UI设置
UI_SETTINGS = {
    "max_treatment_arms": 10,
    "max_drug_arms": 10,
    "max_stratification_factors": 5,
}

# 验证规则
VALIDATION_RULES = {
    "min_block_size": 2,
    "max_block_size": 20,
    "min_blocks_per_stratum": 1,
    "max_blocks_per_stratum": 100,
    "min_subject_number_length": 2,
    "max_subject_number_length": 10,
    "max_study_id_length": 50,
    "max_protocol_title_length": 200,
}

# 文件导出设置
EXPORT_SETTINGS = {
    "default_filename": "randomization_code.sas",
    "supported_formats": ["sas", "txt"],
    "encoding": "utf-8",
    "default_folder_type": "draft",
    "auto_organize_files": True,
    "supported_folder_types": ["draft", "final"],
}