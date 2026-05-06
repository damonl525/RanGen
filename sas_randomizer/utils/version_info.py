#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
版本信息管理模块
管理应用程序的版本号和更新历史
"""

from typing import List, Dict
from datetime import datetime

class VersionInfo:
    """版本信息管理类"""
    
    # 当前版本
    CURRENT_VERSION = "v2.1"

    # 更新历史记录
    UPDATE_HISTORY = [
        {
            "version": "v2.1",
            "date": "2026-05-06",
            "description": "修复独立部署模式下后台进程残留问题",
            "details": [
                "1.新增页面关闭时自动发送shutdown请求，关闭浏览器标签即终止后端进程",
                "2.仅在standalone模式（端口8000）下生效，开发模式不受影响"
            ]
        },
        {
            "version": "v2.0",
            "date": "2026-02-03",
            "description": "Web版全新发布",
            "details": [
                "1.Web版全新发布：从桌面端迁移至Web架构 (Next.js + FastAPI)",
                "2.交互体验升级：引入现代化UI组件库，支持深色模式与响应式设计",
                "3.可视化配置向导：新增分步式随机化配置流程，降低使用门槛",
                "4.国际化支持：全面支持中英文界面一键切换",
                "5.实时预览：支持SAS代码的实时生成、预览与一键复制/下载",
                "6.单文件部署：支持打包为独立的exe可执行文件，开箱即用"
            ]
        },
        {
            "version": "v1.3",
            "date": "2025-10-10",
            "description": "针对供应商B5.X更新",
            "details": [
                "1.对于供应商B5.X系统，需要生成xlsx格式的盲底，已加入",
                "2.对于供应商B5.X系统对药物采用二次随机时，供应商B表示xlsx盲底不需要放区组号与区组随机数"
            ]
        },
        {
            "version": "v1.2",
            "date": "2025-09-28",
            "description": "修复小bug",
            "details": [
                "1.修复路径生成的bug",
                "2.修复分层因素生成的bug",
                "3.药物rtf盲底增加pg_add，暂固定每页最多展示440个药物",
                "4.生成CSV时，FILE行增加DSD option，以解决空白值的显示问题",
                "5.使用供应商B药物盲底模板时，不再生成取药顺序号，而是直接用供应商B系统的完成随机发药功能",
                "6.确保有分层的情况下，区组号是唯一的"
            ]
        },
        {
            "version": "v1.1",
            "date": "2025-09-19",
            "description": "修复小bug与加入供应商B部分其它盲底模板",
            "details": [
                "1.修复药物有分层时的方法描述",
                "2.加入供应商B5.X的受试者盲底模板，目前仅支持一次镜像替换",
                "3.加入供应商B5.X的药物盲底模板",
                "4.加入供应商BLite的受试者盲底模板"
            ]
        },
        {
            "version": "v1.0",
            "date": "2025-09-17",
            "description": "v1.0发布",
            "details": [
                "1.支持常用随机化功能",
                "2.支持供应商A和供应商B6.X盲底模板"
            ]
        }
    ]
    
    @classmethod
    def get_current_version(cls) -> str:
        """获取当前版本号"""
        return cls.CURRENT_VERSION
    
    @classmethod
    def get_update_history(cls) -> List[Dict]:
        """获取更新历史"""
        return cls.UPDATE_HISTORY
    
    @classmethod
    def get_latest_update_info(cls) -> Dict:
        """获取最新更新信息"""
        if cls.UPDATE_HISTORY:
            return cls.UPDATE_HISTORY[0]
        return {}
    
    @classmethod
    def format_version_display(cls) -> str:
        """格式化版本显示文本"""
        return f"版本 {cls.CURRENT_VERSION}"
    
    @classmethod
    def format_history_text(cls) -> str:
        """格式化更新历史文本"""
        history_text = "更新历史\n" + "="*50 + "\n\n"
        
        for update in cls.UPDATE_HISTORY:
            history_text += f"版本 {update['version']} ({update['date']})\n"
            history_text += f"更新内容：{update['description']}\n"
            
            if 'details' in update and update['details']:
                history_text += "详细信息：\n"
                for detail in update['details']:
                    history_text += f"  • {detail}\n"
            
            history_text += "\n" + "-"*40 + "\n\n"
        
        return history_text