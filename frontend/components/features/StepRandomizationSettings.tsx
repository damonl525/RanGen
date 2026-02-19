"use client";

import { useFormContext } from "react-hook-form";
import { TASASGenerationSchema } from "@/lib/schemas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

import { useUIStore } from "@/lib/uiStore";

export function StepRandomizationSettings() {
    const { register, setValue, watch, formState: { errors } } = useFormContext<TASASGenerationSchema>();
    const { t } = useUIStore();

    const multiProtocol = !!watch("multi_protocol");
    const isVariableBlock = watch("macro_type") === "可变";
    const variableBlockEnabled = watch("variable_block_enabled");

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Double Blind */}
                <div className="col-span-2 flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
                    <Checkbox
                        id="is_double_blind"
                        checked={watch("is_double_blind")}
                        onCheckedChange={(checked) => setValue("is_double_blind", checked as boolean)}
                    />
                    <Label htmlFor="is_double_blind" className="font-medium cursor-pointer">{t.step5.doubleBlind}</Label>
                </div>

                {!multiProtocol ? (
                    <>
                        {/* Total Sample Size */}
                        <div className="space-y-2">
                            <Label htmlFor="total_sample_size">{t.step5.totalSample}</Label>
                            <Input
                                id="total_sample_size"
                                type="number"
                                {...register("total_sample_size")}
                                className={errors.total_sample_size ? "border-red-500" : ""}
                            />
                            {errors.total_sample_size && <p className="text-xs text-red-500">{errors.total_sample_size.message}</p>}
                        </div>

                        {/* Allocation Ratio */}
                        <div className="space-y-2">
                            <Label htmlFor="allocation_ratio">{t.step5.allocationRatio}</Label>
                            <Input
                                id="allocation_ratio"
                                placeholder="1:1"
                                {...register("allocation_ratio")}
                            />
                        </div>

                        <div className="col-span-2 my-4 border-t border-border"></div>

                        {/* Block Settings */}
                        <h3 className="col-span-2 font-medium text-foreground">{t.step5.blockConfig}</h3>

                        {/* Block Size */}
                        <div className="space-y-2">
                            <Label htmlFor="block_size">{t.step5.blockSizeFixed}</Label>
                            <Input
                                id="block_size"
                                type="number"
                                {...register("block_size")}
                            />
                        </div>

                        {/* Blocks per Stratum */}
                        <div className="space-y-2">
                            <Label htmlFor="blocks_per_stratum">{t.step5.blocksPerStratum}</Label>
                            <Input
                                id="blocks_per_stratum"
                                type="number"
                                {...register("blocks_per_stratum")}
                            />
                        </div>

                        {/* Macro Type */}
                        <div className="space-y-2">
                            <Label htmlFor="macro_type">{t.step5.method}</Label>
                            <Select
                                onValueChange={(val) => {
                                    setValue("macro_type", val as "标准" | "可变");
                                    if (val === "可变") setValue("variable_block_enabled", true);
                                    else setValue("variable_block_enabled", false);
                                }}
                                defaultValue={watch("macro_type")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t.step1.selectStatus} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="标准">{t.step5.standardFixed}</SelectItem>
                                    <SelectItem value="可变">{t.step5.variableDynamic}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Variable Block Sizes (Conditional) */}
                        {isVariableBlock && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="col-span-2 p-4 bg-teal-50/50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900 rounded-lg space-y-3"
                            >
                                <Label>{t.step5.variableBlockSizes}</Label>
                                <p className="text-sm text-slate-500">
                                    {t.step5.variableBlockNote}
                                </p>
                                <Input
                                    placeholder="4, 6"
                                    defaultValue={watch("variable_block_sizes")?.join(", ")}
                                    onChange={(e) => {
                                        const val = e.target.value
                                            .split(",")
                                            .map(v => v.trim())
                                            .filter(v => v !== "")
                                            .map(v => parseInt(v))
                                            .filter(n => !isNaN(n));
                                        setValue("variable_block_sizes", val);
                                    }}
                                />
                            </motion.div>
                        )}
                    </>
                ) : (
                    <div className="col-span-2 p-6 bg-muted/20 border border-border rounded-lg flex flex-col items-center justify-center text-center space-y-2">
                        <div className="p-2 bg-secondary rounded-full">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h4 className="font-medium text-foreground">{t.step5.settingsInProtocols}</h4>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            {t.step5.settingsInProtocolsDesc}
                        </p>
                    </div>
                )}

                <div className="col-span-2 my-4 border-t border-border"></div>

                {/* Advanced Settings */}
                <h3 className="col-span-2 font-medium text-foreground">{t.step5.advanced}</h3>

                {/* Subject Seed */}
                <div className="space-y-2">
                    <Label htmlFor="subject_seed">{t.step5.subjectSeed}</Label>
                    <Input
                        id="subject_seed"
                        placeholder="RANDOM"
                        {...register("subject_seed")}
                    />
                    <p className="text-[10px] text-slate-400">{t.step5.seedNote}</p>
                </div>

                {/* Drug Seed */}
                <div className="space-y-2">
                    <Label htmlFor="drug_seed">{t.step5.drugSeed}</Label>
                    <Input
                        id="drug_seed"
                        placeholder="RANDOM"
                        {...register("drug_seed")}
                    />
                    <p className="text-[10px] text-slate-400">{t.step5.seedNote}</p>
                </div>

                {/* Mirror Replacement */}
                <div className="col-span-2 flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
                    <Checkbox
                        id="mirror_replacement"
                        checked={watch("mirror_replacement")}
                        onCheckedChange={(checked) => {
                            setValue("mirror_replacement", checked as boolean);
                            if (checked && !watch("mirror_gap")) {
                                setValue("mirror_gap", 1000);
                            }
                        }}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label
                            htmlFor="mirror_replacement"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t.step5.mirror}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            {t.step5.mirrorDesc}
                        </p>
                    </div>
                </div>

                <AnimatePresence>
                    {watch("mirror_replacement") && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="col-span-2 p-4 border rounded-lg space-y-2 bg-card shadow-sm"
                        >
                            <Label htmlFor="mirror_gap">{t.step5.mirrorGap}</Label>
                            <Input
                                id="mirror_gap"
                                type="number"
                                {...register("mirror_gap")}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Run on Server */}
                <div className="col-span-2 space-y-4">
                    <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
                        <Checkbox
                            id="is_server_run"
                            checked={watch("is_server_run")}
                            onCheckedChange={(checked) => setValue("is_server_run", checked as boolean)}
                        />
                        <Label htmlFor="is_server_run" className="font-medium cursor-pointer">{t.step5.runOnServer}</Label>
                    </div>

                    <AnimatePresence>
                        {watch("is_server_run") && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 border rounded-lg space-y-2 bg-card shadow-sm"
                            >
                                <Label htmlFor="server_path">{t.step5.serverPath}</Label>
                                <Input
                                    id="server_path"
                                    placeholder={t.step5.serverPathPlaceholder}
                                    {...register("server_path")}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </motion.div>
    );
}
