"use client";

import { useAppVersion } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

import { useUIStore } from "@/lib/uiStore";

export function VersionDisplay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { data: versionInfo } = useAppVersion();
    const { t } = useUIStore();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{t.common.versionHistory}</DialogTitle>
                    <DialogDescription>
                        {t.common.currentVersion}: <span className="font-semibold text-primary">{versionInfo?.version}</span> ({t.common.released}: {versionInfo?.release_date})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-6">
                    {versionInfo?.history?.map((release: any, index: number) => (
                        <div key={index} className="relative border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1 ml-2">
                            <div className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-background border-2 border-primary"></div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-lg">v{release.version}</h4>
                                <span className="text-sm text-muted-foreground">{release.date}</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                {release.changes?.map((change: string, idx: number) => (
                                    <li key={idx}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
