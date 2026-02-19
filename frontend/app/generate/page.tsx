"use client";

import WizardForm from "@/components/features/WizardForm";
import { SettingsMenu } from "@/components/features/general-settings/SettingsMenu";
import { LanguageToggle } from "@/components/LanguageToggle";

import { useUIStore } from "@/lib/uiStore";

export default function GeneratePage() {
    const { t } = useUIStore();
    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="bg-card border-b border-border py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {t.common.pageTitle}
                    </h1>
                    <LanguageToggle />
                </div>
            </header>

            <main className="mt-8">
                <WizardForm />
            </main>

            <SettingsMenu />
        </div>
    );
}
