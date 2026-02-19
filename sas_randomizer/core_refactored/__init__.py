"""重构后的SAS随机化代码生成器核心模块

该模块提供模块化的SAS随机化代码生成功能。
"""

from .sas_generator import SASRandomizationGenerator

# 导出主要的生成器类
__all__ = [
    'SASRandomizationGenerator'
]

# 版本信息
__version__ = '2.0.0'
__author__ = 'SAS Randomization Team'
__description__ = '重构后的SAS随机化代码生成器'