"""简单的日志系统"""

import logging
import os
from datetime import datetime

def setup_logger(name: str = "sas_randomizer", log_level: str = "INFO") -> logging.Logger:
    """
    设置日志记录器
    
    Args:
        name: 日志记录器名称
        log_level: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        配置好的日志记录器
    """
    logger = logging.getLogger(name)
    
    # 避免重复添加处理器
    if logger.handlers:
        return logger
    
    # 设置日志级别
    level = getattr(logging, log_level.upper(), logging.INFO)
    logger.setLevel(level)
    
    # 创建控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    
    # 创建格式器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    # 添加处理器到日志记录器
    logger.addHandler(console_handler)
    
    return logger

def log_operation(operation: str, parameters: dict = None, success: bool = True, error: str = None):
    """
    记录操作日志
    
    Args:
        operation: 操作名称
        parameters: 操作参数
        success: 操作是否成功
        error: 错误信息（如果有）
    """
    logger = setup_logger()
    
    log_message = f"Operation: {operation}"
    
    if parameters:
        # 只记录关键参数，避免敏感信息
        safe_params = {
            k: v for k, v in parameters.items() 
            if k in ['study_id', 'is_double_blind', 'block_size', 'blocks_per_stratum']
        }
        if safe_params:
            log_message += f" | Parameters: {safe_params}"
    
    if success:
        logger.info(f"{log_message} | Status: SUCCESS")
    else:
        logger.error(f"{log_message} | Status: FAILED | Error: {error}")

def log_validation_error(errors: list):
    """
    记录验证错误
    
    Args:
        errors: 验证错误列表
    """
    logger = setup_logger()
    logger.warning(f"Validation failed with {len(errors)} errors: {'; '.join(errors)}")

def log_code_generation(study_id: str, code_length: int):
    """
    记录代码生成信息
    
    Args:
        study_id: 研究ID
        code_length: 生成代码的长度
    """
    logger = setup_logger()
    logger.info(f"SAS code generated for study {study_id} | Code length: {code_length} characters")