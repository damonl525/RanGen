"use client";

import * as React from "react";
import { Settings, RotateCcw, FileJson, Info, History, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { VersionDisplay } from "./VersionDisplay";
import { HelpDisplay } from "./HelpDisplay";
import { useGenerationStore, useDefaultConfig } from "@/lib/api"; // Note: hooking to updated store in next step
import { toast } from "sonner";

import { useUIStore } from "@/lib/uiStore";

export function SettingsMenu() {
    const { t } = useUIStore();
    const [showVersion, setShowVersion] = React.useState(false);
    const [showHelp, setShowHelp] = React.useState(false);

    // Connect to store (need to update store.ts first in next step effectively, but assuming signature)
    // Logic will be wired in the parent or direct store access
    const resetConfig = useGenerationStore((state) => state.resetConfig);
    const updateConfig = useGenerationStore((state) => state.updateConfig);

    // Fetch defaults manually or via hook when needed
    const { data: defaults, refetch: fetchDefaults } = useDefaultConfig();

    const handleShutdown = async () => {
        if (confirm("Are you sure you want to exit the application?")) {
            try {
                // We use fetch directly here to avoid store dependency for system calls
                await fetch("http://127.0.0.1:8000/api/v1/system/shutdown", { method: "POST" });
                toast.success("Application is shutting down...");
                // Close window after a short delay
                setTimeout(() => {
                    window.close();
                    document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;'><h1>Application has been closed. You can close this tab.</h1></div>";
                }, 1000);
            } catch (error) {
                toast.error("Failed to shutdown server. Please check console.");
                console.error(error);
            }
        }
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to reset all configuration? This cannot be undone.")) {
            resetConfig();
            toast.success("Configuration reset to initial state.");
        }
    };

    const handleLoadDemo = async () => {
        if (confirm("Load demo configuration? This will overwrite current changes.")) {
            if (defaults) {
                // Correctly map backend response structure {project, randomization, subject} to store config
                const d = defaults;
                const mappedConfig = {
                    ...d.project,
                    ...d.randomization,
                    ...d.subject,
                    // Manually map deep nested structures if needed, e.g. drug_randomization_config
                    // The backend 'randomization' object likely contains 'drug_randomization_config'. 
                    // Let's verify and ensure we don't lose nested data.
                    // Assuming d.randomization has the correct shape for store.config parts.
                };

                // Specifically for drug randomization which might be nested differently or same
                if (d.randomization && d.randomization.drug_randomization_config) {
                    mappedConfig.drug_randomization_config = d.randomization.drug_randomization_config;
                }

                updateConfig(mappedConfig);
                toast.success("Demo configuration loaded.");
            } else {
                const res = await fetchDefaults();
                if (res.data) {
                    const d = res.data;
                    const mappedConfig = {
                        ...d.project,
                        ...d.randomization,
                        ...d.subject,
                    };
                    if (d.randomization && d.randomization.drug_randomization_config) {
                        mappedConfig.drug_randomization_config = d.randomization.drug_randomization_config;
                    }

                    updateConfig(mappedConfig);
                    toast.success("Demo configuration loaded.");
                } else {
                    toast.error("Failed to load defaults.");
                }
            }
        }
    }

    return (
        <>
            <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
                {/* Main Settings Trigger */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-lg border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 transition-all hover:scale-110">
                            <Settings className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mb-2 ml-2" align="start" side="right">
                        <DropdownMenuLabel>{t.step5.advanced}</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                                <span>{t.common.theme}</span>
                                <ThemeToggle />
                            </div>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={handleLoadDemo}>
                                <FileJson className="mr-2 h-4 w-4" />
                                <span>{t.common.loadDemo}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleReset} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                <span>{t.common.reset}</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />

                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => setShowHelp(true)}>
                                <Info className="mr-2 h-4 w-4" />
                                <span>{t.common.help}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowVersion(true)}>
                                <History className="mr-2 h-4 w-4" />
                                <span>{t.common.versionHistory}</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleShutdown} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
                        <Power className="mr-2 h-4 w-4" />
                        <span>Quit Application</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <VersionDisplay open={showVersion} onOpenChange={setShowVersion} />
            <HelpDisplay open={showHelp} onOpenChange={setShowHelp} />
        </div></>
    );
}
