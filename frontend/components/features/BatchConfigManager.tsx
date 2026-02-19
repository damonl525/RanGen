"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Trash2, AlertTriangle, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/uiStore";

interface BatchConfig {
    batch_no: string;
    quantity: number;
}

interface BatchConfigManagerProps {
    availableFactors: string[];
    levelsMap: Record<string, string[]>;
    // Data structure: { "supply_factor": string, "configs": Record<string, BatchConfig[]> }
    value: any;
    onChange: (newValue: any) => void;
}

export function BatchConfigManager({ availableFactors, levelsMap, value, onChange }: BatchConfigManagerProps) {
    const { t } = useUIStore();
    const selectedFactor = value?.supply_factor || "";
    const configs = value?.configs || {};

    const handleFactorChange = (factor: string) => {
        // When factor changes, we might warn about losing configs if they don't match?
        // For simplicity, we create a new structure, potentially keeping matching levels if any?
        // Or just reset configs. Safer to reset or keep valid ones.
        onChange({
            supply_factor: factor,
            configs: {} // Reset configs for new factor to avoid confusion
        });
    };

    const addBatch = (level: string) => {
        const currentBatches = configs[level] || [];
        const newBatch = { batch_no: "", quantity: 0 };
        const newConfigs = {
            ...configs,
            [level]: [...currentBatches, newBatch]
        };
        onChange({ ...value, configs: newConfigs });
    };

    const updateBatch = (level: string, index: number, field: keyof BatchConfig, val: any) => {
        const currentBatches = [...(configs[level] || [])];
        if (!currentBatches[index]) return;

        currentBatches[index] = { ...currentBatches[index], [field]: val };
        const newConfigs = { ...configs, [level]: currentBatches };
        onChange({ ...value, configs: newConfigs });
    };

    const removeBatch = (level: string, index: number) => {
        const currentBatches = configs[level] || [];
        const newBatches = currentBatches.filter((_: BatchConfig, i: number) => i !== index);
        const newConfigs = { ...configs, [level]: newBatches };
        onChange({ ...value, configs: newConfigs });
    };

    const currentLevels = levelsMap[selectedFactor] || [];

    if (availableFactors.length === 0) {
        return (
            <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {t.step4.noFactorsAvail}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Factor Selection */}
            <div className="flex flex-col gap-2">
                <Label>{t.step4.supplyFactor}</Label>
                <Select value={selectedFactor} onValueChange={handleFactorChange}>
                    <SelectTrigger className="w-full md:w-[300px]">
                        <SelectValue placeholder={t.step4.selectFactor} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableFactors.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                    {t.step4.selectFactorDesc}
                </p>
            </div>

            {selectedFactor && currentLevels.length > 0 && (
                <div className="space-y-4 mt-4">
                    {currentLevels.map((level) => {
                        const batches = configs[level] || [];
                        const totalQty = batches.reduce((sum: number, b: BatchConfig) => sum + (Number(b.quantity) || 0), 0);

                        return (
                            <Card key={level} className="border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white border border-slate-200 px-2 py-0.5 rounded text-xs font-mono font-medium text-slate-600">
                                            {selectedFactor}: {level}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{t.step4.batchConfig}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {t.step4.totalQty}: <span className="font-medium text-teal-600">{totalQty}</span>
                                    </div>
                                </div>
                                <div className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead className="w-[180px] h-8 text-xs">{t.step4.batchNo}</TableHead>
                                                <TableHead className="h-8 text-xs">{t.step4.quantity}</TableHead>
                                                <TableHead className="w-[50px] h-8"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {batches.map((batch: BatchConfig, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="py-2">
                                                        <Input
                                                            className="h-8 text-xs"
                                                            placeholder={t.step4.batchNo}
                                                            value={batch.batch_no}
                                                            onChange={(e) => updateBatch(level, idx, 'batch_no', e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            placeholder={t.step4.quantity}
                                                            value={batch.quantity}
                                                            onChange={(e) => updateBatch(level, idx, 'quantity', parseInt(e.target.value) || 0)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => removeBatch(level, idx)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {batches.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-4 text-xs text-slate-400 italic">
                                                        {t.step4.noBatches}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    <div className="p-2 border-t border-slate-100 bg-slate-50/30">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 text-xs"
                                            onClick={() => addBatch(level)}
                                        >
                                            <Plus className="mr-2 h-3 w-3" /> {t.step4.addBatch}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {selectedFactor && currentLevels.length === 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-xs">
                        {t.step4.noLevelsDefined.replace("{factor}", selectedFactor)}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
