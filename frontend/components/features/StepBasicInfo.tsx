"use client";

import { useGenerationStore } from "@/lib/store";
import { useDefaultConfig } from "@/lib/api";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { TASASGenerationSchema } from "@/lib/schemas";
import { motion } from "framer-motion";

import { useUIStore } from "@/lib/uiStore";

export function StepBasicInfo() {
    const { register, formState: { errors }, setValue, watch } = useFormContext<TASASGenerationSchema>();
    const { t } = useUIStore();

    // Example of using defaults from API if needed, 
    // but we mostly rely on Zod defaults + Store defaults.
    // const { data: apiDefaults } = useDefaultConfig();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Study ID */}
                <div className="space-y-2">
                    <Label htmlFor="study_id">{t.step1.studyId} <span className="text-red-500">*</span></Label>
                    <Input
                        id="study_id"
                        placeholder={t.step1.studyIdPlaceholder}
                        {...register("study_id")}
                        className={errors.study_id ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {errors.study_id && <p className="text-sm text-red-500">{errors.study_id.message}</p>}
                </div>

                {/* Protocol Title */}
                <div className="space-y-2">
                    <Label htmlFor="protocol_title">{t.step1.protocolTitle} <span className="text-red-500">*</span></Label>
                    <Input
                        id="protocol_title"
                        placeholder={t.step1.protocolTitlePlaceholder}
                        {...register("protocol_title")}
                        className={errors.protocol_title ? "border-red-500" : ""}
                    />
                    {errors.protocol_title && <p className="text-sm text-red-500">{errors.protocol_title.message}</p>}
                </div>

                {/* Client */}
                <div className="space-y-2">
                    <Label htmlFor="client">{t.step1.sponsor} <span className="text-red-500">*</span></Label>
                    <Input
                        id="client"
                        placeholder={t.step1.sponsorPlaceholder}
                        {...register("client")}
                        className={errors.client ? "border-red-500" : ""}
                    />
                    {errors.client && <p className="text-sm text-red-500">{errors.client.message}</p>}
                </div>

                {/* Company */}
                <div className="space-y-2">
                    <Label htmlFor="company">{t.step1.cro} <span className="text-red-500">*</span></Label>
                    <Input
                        id="company"
                        placeholder={t.step1.croPlaceholder}
                        {...register("company")}
                        className={errors.company ? "border-red-500" : ""}
                    />
                    {errors.company && <p className="text-sm text-red-500">{errors.company.message}</p>}
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                    <Label htmlFor="supplier">{t.step1.supplier}</Label>
                    <Select
                        onValueChange={(val) => setValue("supplier", val)}
                        value={watch("supplier")}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t.step1.selectSupplier} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="供应商A">供应商A</SelectItem>
                            <SelectItem value="供应商B 6.X">供应商B 6.X</SelectItem>
                            <SelectItem value="供应商B 5.X">供应商B 5.X</SelectItem>
                            <SelectItem value="供应商B Lite">供应商B Lite</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label htmlFor="status">{t.step1.status}</Label>
                    <Select
                        onValueChange={(val) => setValue("status", val as "Draft" | "Final")}
                        value={watch("status")}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={t.step1.selectStatus} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Final">Final</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </motion.div>
    );
}
