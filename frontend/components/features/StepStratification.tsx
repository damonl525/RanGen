"use client";

import { useFormContext } from "react-hook-form";
import { TASASGenerationSchema } from "@/lib/schemas";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { StratificationEditor } from "./StratificationEditor";

import { useUIStore } from "@/lib/uiStore";

export function StepStratification() {
    const { watch, setValue } = useFormContext<TASASGenerationSchema>();
    const { t } = useUIStore();
    const factors = watch("stratification_factors") || [];
    const levelsMap = watch("strata_levels") || {};

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900 mb-6">
                <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">{t.step3.title}</h4>
                        <p className="text-sm text-blue-700/80 dark:text-blue-200/80 mt-1">
                            {t.step3.desc}
                        </p>
                    </div>
                </div>
            </div>

            <StratificationEditor
                factors={factors}
                levels={levelsMap}
                onFactorsChange={f => setValue("stratification_factors", f)}
                onLevelsChange={l => setValue("strata_levels", l)}
                addButtonText={t.step3.addFirst}
            />
        </motion.div>
    );
}
