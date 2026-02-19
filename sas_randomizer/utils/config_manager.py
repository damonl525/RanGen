"""配置管理模块 - 处理药量配置的读取和写入"""

import json
import os
from typing import Dict, Any

class DrugAmountConfigManager:
    """药量配置管理器"""
    
    def __init__(self, config_file_path: str = None):
        """初始化配置管理器
        
        Args:
            config_file_path: 配置文件路径，默认为项目根目录下的drug_amount_config.json
        """
        if config_file_path is None:
            # 获取项目根目录
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(current_dir))
            config_file_path = os.path.join(project_root, "drug_amount_config.json")
        
        self.config_file_path = config_file_path
        self._config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        default_config = {
            "default_total_drug_count": 40,
            "min_drug_count": 0,
            "max_drug_count": 100000,
            "allow_manual_input": True
        }
        
        try:
            if os.path.exists(self.config_file_path):
                with open(self.config_file_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                # 合并默认配置，确保所有必要的键都存在
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                return config
            else:
                # 如果配置文件不存在，创建默认配置文件
                self._save_config(default_config)
                return default_config
        except (json.JSONDecodeError, IOError) as e:
            print(f"加载配置文件失败: {e}，使用默认配置")
            return default_config
    
    def _save_config(self, config: Dict[str, Any]) -> bool:
        """保存配置到文件
        
        Args:
            config: 要保存的配置字典
            
        Returns:
            bool: 保存是否成功
        """
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(self.config_file_path), exist_ok=True)
            
            with open(self.config_file_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            return True
        except IOError as e:
            print(f"保存配置文件失败: {e}")
            return False
    
    def get_default_total_drug_count(self) -> int:
        """获取默认总药量"""
        return self._config.get("default_total_drug_count", 40)
    
    def get_min_drug_count(self) -> int:
        """获取最小药量"""
        return self._config.get("min_drug_count", 0)
    
    def get_max_drug_count(self) -> int:
        """获取最大药量"""
        return self._config.get("max_drug_count", 100000)
    
    def is_manual_input_allowed(self) -> bool:
        """是否允许手动输入"""
        return self._config.get("allow_manual_input", True)
    
    def set_default_total_drug_count(self, count: int) -> bool:
        """设置默认总药量
        
        Args:
            count: 新的默认总药量
            
        Returns:
            bool: 设置是否成功
        """
        if self.get_min_drug_count() <= count <= self.get_max_drug_count():
            self._config["default_total_drug_count"] = count
            return self._save_config(self._config)
        return False
    
    def validate_drug_count(self, count: int) -> tuple[bool, str]:
        """验证药量是否有效
        
        Args:
            count: 要验证的药量
            
        Returns:
            tuple: (是否有效, 错误信息)
        """
        if not isinstance(count, int):
            return False, "药量必须是整数"
        
        min_count = self.get_min_drug_count()
        max_count = self.get_max_drug_count()
        
        if count < min_count:
            return False, f"药量不能小于{min_count}"
        
        if count > max_count:
            return False, f"药量不能大于{max_count}"
        
        return True, ""
    
    def get_config(self) -> Dict[str, Any]:
        """获取完整配置"""
        return self._config.copy()
    
    def reload_config(self) -> None:
        """重新加载配置文件"""
        self._config = self._load_config()


# 全局配置管理器实例
_config_manager = None

def get_drug_amount_config_manager() -> DrugAmountConfigManager:
    """获取药量配置管理器的全局实例"""
    global _config_manager
    if _config_manager is None:
        _config_manager = DrugAmountConfigManager()
    return _config_manager