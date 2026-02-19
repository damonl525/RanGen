"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { TASASGenerationSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Pill, Plus, Trash2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StratificationEditor } from "./StratificationEditor";
import { BatchConfigManager } from "./BatchConfigManager";
import { useState } from "react";

import { useUIStore } from "@/lib/uiStore";

export function StepDrugRandomization() {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<TASASGenerationSchema>();
    const { t } = useUIStore();

    const isEnabled = watch("drug_randomization_config.enabled");

    const { fields, append, remove } = useFieldArray({
        control,
        name: "drug_randomization_config.drug_arms"
    });

    const toggleModule = (checked: boolean) => {
        setValue("drug_randomization_config.enabled", checked);
        if (checked && fields.length === 0) {
            append({ code: "A", name: t.step4.defaultDrugA, ratio: 1 });
            append({ code: "B", name: t.step4.defaultPlacebo, ratio: 1 });
        }
    };

    const drugFactors = watch("drug_randomization_config.drug_stratification_factors") || [];
    const drugLevels = watch("drug_randomization_config.drug_strata_levels") || {};

    // Subject factors for sync mode
    const subjectFactors = watch("stratification_factors") || [];
    const subjectLevels = watch("strata_levels") || {};

    const [useIndependent, setUseIndependent] = useState(drugFactors.length > 0);

    const toggleIndependent = (checked: boolean) => {
        setUseIndependent(checked);
        if (!checked) {
            setValue("drug_randomization_config.drug_stratification_factors", []);
            setValue("drug_randomization_config.drug_strata_levels", {});
        }
    }

    // Determine active factors/levels for batching
    const activeFactors = useIndependent ? drugFactors : subjectFactors;
    const activeLevels = useIndependent ? drugLevels : subjectLevels;
    const batchConfigs = watch("drug_randomization_config.drug_batch_configs") || {};

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Header Toggle */}
            <Card className={`border-2 transition-colors ${isEnabled ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-900/20' : 'border-border'}`}>
                <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isEnabled ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' : 'bg-secondary text-muted-foreground'}`}>
                            <Pill className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-foreground">{t.step4.title}</h3>
                            <p className="text-sm text-muted-foreground">{t.step4.desc}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="drug_rand_enable" className={isEnabled ? "text-teal-700 dark:text-teal-400 font-medium" : "text-muted-foreground"}>
                            {isEnabled ? t.step2.enabled : t.step2.disabled}
                        </Label>
                        <Checkbox
                            id="drug_rand_enable"
                            checked={isEnabled}
                            onCheckedChange={(c) => toggleModule(c as boolean)}
                            className="h-6 w-6"
                        />
                    </div>
                </CardContent>
            </Card>

            <AnimatePresence>
                {isEnabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-8 overflow-hidden"
                    >
                        {/* Drug Arms */}
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium text-foreground">{t.step4.drugTypes}</h4>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => append({ code: "C", name: t.step4.newDrugDefault, ratio: 1 })}
                                    className="text-teal-600 border-teal-200 hover:bg-teal-50"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> {t.step4.addDrugType}
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-card p-4 rounded border border-border shadow-sm">
                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs">{t.step2.code}</Label>
                                            <Input {...register(`drug_randomization_config.drug_arms.${index}.code`)} placeholder="A" />
                                        </div>
                                        <div className="col-span-6 space-y-2">
                                            <Label className="text-xs">{t.step2.name}</Label>
                                            <Input {...register(`drug_randomization_config.drug_arms.${index}.name`)} placeholder={t.step4.drugNamePlaceholder} />
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <Label className="text-xs">{t.step2.ratio}</Label>
                                            <Input
                                                type="number"
                                                {...register(`drug_randomization_config.drug_arms.${index}.ratio`)}
                                                placeholder="1"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="text-muted-foreground hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-border my-4"></div>

                        {/* Drug Packaging / Block Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <h4 className="col-span-2 font-medium text-foreground">{t.step4.packaging}</h4>

                            {/* Drug Block Size */}
                            <div className="space-y-2">
                                <Label>{t.step4.drugBlockSize}</Label>
                                <Input
                                    type="number"
                                    {...register("drug_randomization_config.drug_block_size")}
                                />
                                <p className="text-[10px] text-muted-foreground">{t.step4.drugBlockSizeNote}</p>
                            </div>

                            {/* Drug Block Layers */}
                            <div className="space-y-2">
                                <Label>{t.step4.drugBlockLayers}</Label>
                                <Input
                                    type="number"
                                    {...register("drug_randomization_config.drug_block_layers")}
                                />
                                <p className="text-[10px] text-muted-foreground">{t.step4.drugBlockLayersNote}</p>
                            </div>

                            {/* Start Number */}
                            <div className="space-y-2">
                                <Label>{t.step4.startNumber}</Label>
                                <Input
                                    type="number"
                                    {...register("drug_randomization_config.drug_start_number")}
                                />
                            </div>

                            {/* Prefix */}
                            <div className="space-y-2">
                                <Label>{t.step4.prefix}</Label>
                                <Input
                                    {...register("drug_randomization_config.drug_number_prefix")}
                                />
                            </div>

                            {/* Length */}
                            <div className="space-y-2">
                                <Label>{t.step4.length}</Label>
                                <Input
                                    type="number"
                                    {...register("drug_randomization_config.drug_number_length")}
                                />
                            </div>

                            {/* Report Units */}
                            <div className="space-y-2">
                                <Label>{t.step4.reportUnit}</Label>
                                <Input
                                    {...register("drug_randomization_config.drug_report_units")}
                                />
                            </div>

                            {/* Secondary Randomization Toggle */}
                            <div className="col-span-2 flex items-center space-x-2 border p-3 rounded bg-muted/20 mt-2">
                                <Checkbox
                                    id="drug_sec_rand"
                                    checked={watch("drug_randomization_config.drug_sec_rand_enabled")}
                                    onCheckedChange={(c) => setValue("drug_randomization_config.drug_sec_rand_enabled", c as boolean)}
                                />
                                <Label htmlFor="drug_sec_rand" className="text-sm cursor-pointer">
                                    {t.step4.secRand}
                                </Label>
                            </div>

                        </div>

                        <div className="border-t border-border my-4"></div>

                        {/* Drug Stratification Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border">
                                <div>
                                    <h4 className="font-medium text-foreground">{t.step4.stratAndBatch}</h4>
                                    <p className="text-xs text-muted-foreground">{t.step4.stratAndBatchDesc}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded border border-border shadow-sm">
                                    <Checkbox
                                        id="indep_strat"
                                        checked={useIndependent}
                                        onCheckedChange={(c) => toggleIndependent(c as boolean)}
                                    />
                                    <Label htmlFor="indep_strat" className="text-sm cursor-pointer font-medium">{t.step4.independentFactors}</Label>
                                </div>
                            </div>

                            {useIndependent ? (
                                <StratificationEditor
                                    factors={drugFactors}
                                    levels={drugLevels}
                                    onFactorsChange={f => setValue("drug_randomization_config.drug_stratification_factors", f)}
                                    onLevelsChange={l => setValue("drug_randomization_config.drug_strata_levels", l)}
                                    emptyMessage={t.step3.noFactors}
                                    addButtonText={t.step3.addFirst}
                                />
                            ) : (
                                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900">
                                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <AlertDescription className="text-blue-800 dark:text-blue-100 text-xs">
                                        {t.step4.usingSubjectFactors}
                                        {t.step4.independentFactorsNote}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Batch Configuration Manager */}
                            <div className="pt-4">
                                <h5 className="text-sm font-medium text-slate-700 mb-2">{t.step4.batchConfig}</h5>
                                <BatchConfigManager
                                    availableFactors={activeFactors}
                                    levelsMap={activeLevels}
                                    value={batchConfigs}
                                    onChange={(val) => setValue("drug_randomization_config.drug_batch_configs", val)}
                                />
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
