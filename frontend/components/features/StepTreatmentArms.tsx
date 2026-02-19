"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { TASASGenerationSchema } from "@/lib/schemas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Layers, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TreatmentArmsEditor } from "./TreatmentArmsEditor";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useUIStore } from "@/lib/uiStore";

export function StepTreatmentArms() {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<TASASGenerationSchema>();
    const { t } = useUIStore();

    const multiProtocol = !!watch("multi_protocol");

    // Field Array for Protocols
    const { fields: protocolFields, append: appendProtocol, remove: removeProtocol } = useFieldArray({
        control,
        name: "protocols"
    });

    const [expandedProtocolIndex, setExpandedProtocolIndex] = useState<number | null>(0);

    const toggleMultiProtocol = (checked: boolean) => {
        setValue("multi_protocol", checked);
        // Optional: Initialize one protocol if empty and checking true
        if (checked && protocolFields.length === 0) {
            appendProtocol({
                name: "Cohort 1",
                description: "",
                treatment_arms: [
                    { armcd: "A", arm: "Active 10mg", ratio: 1 },
                    { armcd: "P", arm: "Placebo", ratio: 1 }
                ],
                block_size: 4,
                blocks_per_stratum: 10,
                total_sample_size: 40
            });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Header / Mode Switch */}
            <div className="flex flex-col gap-4 border-b border-border pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-medium">{t.step2.studyConfig}</h3>
                        <p className="text-sm text-muted-foreground">{t.step2.studyConfigDesc}</p>
                    </div>
                </div>

                <Card className={`border-2 transition-colors ${multiProtocol ? 'border-purple-500 bg-purple-50/20 dark:bg-purple-900/20' : 'border-border'}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${multiProtocol ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-secondary text-muted-foreground'}`}>
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">{t.step2.multiProtocol}</h4>
                                <p className="text-xs text-muted-foreground">{t.step2.multiProtocolDesc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="multi_prot_enable" className={multiProtocol ? "text-purple-700 dark:text-purple-400 font-medium" : "text-muted-foreground"}>
                                {multiProtocol ? t.step2.enabled : t.step2.disabled}
                            </Label>
                            <Checkbox
                                id="multi_prot_enable"
                                checked={multiProtocol}
                                onCheckedChange={(c) => toggleMultiProtocol(c as boolean)}
                                className="data-[state=checked]:bg-purple-600"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AnimatePresence mode="wait">
                {/* SINGLE PROTOCOL MODE */}
                {!multiProtocol && (
                    <motion.div
                        key="single-mode"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <TreatmentArmsEditor
                            path="treatment_arms"
                            description={t.step2.treatmentArmsDesc}
                        />
                    </motion.div>
                )}

                {/* MULTI PROTOCOL MODE */}
                {multiProtocol && (
                    <motion.div
                        key="multi-mode"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Main Study Name */}
                        <div className="space-y-2">
                            <Label>{t.step2.mainStudyName}</Label>
                            <Input {...register("main_study_name")} placeholder={t.step2.mainStudyNamePlaceholder} />
                        </div>

                        {/* Protocols List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-medium">{t.step2.subProtocols}</Label>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        appendProtocol({
                                            name: `Cohort ${protocolFields.length + 1}`,
                                            description: "",
                                            treatment_arms: [{ armcd: "A", arm: "Active", ratio: 1 }, { armcd: "P", arm: "Placebo", ratio: 1 }],
                                            block_size: 4,
                                            blocks_per_stratum: 10,
                                            total_sample_size: 40
                                        });
                                        setExpandedProtocolIndex(protocolFields.length); // Open new one
                                    }}
                                    variant="outline"
                                    className="border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> {t.step2.addProtocol}
                                </Button>
                            </div>

                            <div className="grid gap-4">
                                {protocolFields.map((field, index) => (
                                    <Card key={field.id} className={`overflow-hidden transition-all ${expandedProtocolIndex === index ? 'ring-2 ring-purple-500/20 shadow-md' : 'hover:border-purple-300'}`}>
                                        <div
                                            className="p-4 bg-card border-b border-border flex items-center justify-between cursor-pointer"
                                            onClick={() => setExpandedProtocolIndex(expandedProtocolIndex === index ? null : index)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 w-6 h-6 rounded flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="font-medium text-foreground">
                                                    {watch(`protocols.${index}.name`) || t.step2.unnamedProtocol}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                    onClick={(e) => { e.stopPropagation(); removeProtocol(index); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                {expandedProtocolIndex === index ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedProtocolIndex === index && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: "auto" }}
                                                    exit={{ height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-4 space-y-6">
                                                        {/* Basic Info */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label>{t.step2.protocolName}</Label>
                                                                <Input {...register(`protocols.${index}.name`)} placeholder={t.step2.protocolNamePlaceholder} />
                                                                {errors.protocols?.[index]?.name && <p className="text-xs text-red-500">{errors.protocols[index]?.name?.message}</p>}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>{t.step2.protocolDesc}</Label>
                                                                <Input {...register(`protocols.${index}.description`)} placeholder={t.step2.protocolDescPlaceholder} />
                                                            </div>
                                                        </div>

                                                        <div className="border-t border-border"></div>

                                                        {/* Randomization Params */}
                                                        <div className="grid grid-cols-3 gap-4 bg-muted/20 p-3 rounded-md border border-border">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">{t.step2.blockSize}</Label>
                                                                <Input type="number" {...register(`protocols.${index}.block_size`)} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">{t.step2.blocksPerStratum}</Label>
                                                                <Input type="number" {...register(`protocols.${index}.blocks_per_stratum`)} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">{t.step2.totalSample}</Label>
                                                                <Input type="number" {...register(`protocols.${index}.total_sample_size`)} />
                                                            </div>
                                                        </div>

                                                        {/* Arms */}
                                                        <TreatmentArmsEditor
                                                            path={`protocols.${index}.treatment_arms`}
                                                            title={t.step2.treatmentArms}
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Card>
                                ))}
                            </div>

                            {protocolFields.length === 0 && (
                                <Alert className="bg-amber-50 border-amber-200">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                        {t.step2.mustAddProtocol}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
