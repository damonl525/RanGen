"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { useUIStore } from "@/lib/uiStore";

export function HelpDisplay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { t } = useUIStore();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t.common.help}</DialogTitle>
                    <DialogDescription>
                        {t.common.helpDesc}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-4 mt-2 prose dark:prose-invert max-w-none text-sm">
                    <h3>🚀 {t.common.quickStart}</h3>

                    <h4>1. 定义项目基础信息 (Project Info)</h4>
                    <p>在首页 "Start Generation" 进入后，首先设置 Protocol ID 和研究标题。这些信息会显示在 SAS 程序的 Header 中。</p>

                    <h4>2. 随机化配置 (Randomization)</h4>
                    <p>
                        <b>核心设置：</b> 选择随机化比例（如 1:1 或 1:1:1）。<br />
                        <b>分层因素 (Stratification)：</b> 如果是动态随机化或分层区组随机化，请在此添加分层因子（如中心、性别）。<br />
                        <b>区组大小 (Block Size)：</b> 定义每个随机化区组的大小，支持变长区组（如 4, 6）。
                    </p>

                    <h4>3. 药物编盲设置 (Drug Management)</h4>
                    <p>
                        开启 "Drug Randomization" 开关以生成药物号分配表。<br />
                        <b>不同步随机化：</b> 如果药物号分配与受试者随机化是分开的（如双盲试验中需要独立管理药物库存），请配置此处的 Stratification 和 Block Size。
                    </p>

                    <h4>4. 生成与导出 (Export)</h4>
                    <p>点击右下角的 "Generate Code" 按钮。生成的 SAS 代码将显示在右侧预览框中，您可以直接复制或下载为 .sas 文件。</p>

                    <hr className="my-4" />

                    <h3>❓ {t.common.faq}</h3>

                    <ul>
                        <li>
                            <b>Q: 可以在线运行 SAS 代码吗？</b><br />
                            A: 不可以。本工具仅生成标准的 SAS 代码文本。您需要将生成的代码复制到 SAS 环境（如 SAS 9.4 或 SAS Viya）中运行。
                        </li>
                        <li>
                            <b>Q: 如何重置所有输入？</b><br />
                            A: 点击左下角设置菜单中的 "Reset All Data" 按钮即可清空当前会话的所有输入。
                        </li>
                        <li>
                            <b>Q: 支持哪些供应商的 IVRS 格式？</b><br />
                            A: 目前支持通用的标准格式，以及部分定制格式。您可以在 "Templates" 页面查看和下载配置模板。
                        </li>
                    </ul>
                </div>
            </DialogContent>
        </Dialog>
    );
}
