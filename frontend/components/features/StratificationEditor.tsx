"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import { useUIStore } from "@/lib/uiStore";

interface StratificationEditorProps {
    factors: string[];
    levels: Record<string, string[]>;
    onFactorsChange: (factors: string[]) => void;
    onLevelsChange: (levels: Record<string, string[]>) => void;
    emptyMessage?: string;
    addButtonText?: string;
}

export function StratificationEditor({
    factors = [],
    levels = {},
    onFactorsChange,
    onLevelsChange,
    emptyMessage,
    addButtonText
}: StratificationEditorProps) {
    const { t } = useUIStore();
    const displayEmptyMessage = emptyMessage || t.step3.noFactors;
    const displayAddButtonText = addButtonText || t.step3.addFirst;

    const addFactor = () => {
        const newFactorName = `${t.step3.defaultFactorName} ${factors.length + 1}`;
        // Verify unique name
        let name = newFactorName;
        let counter = 1;
        while (factors.includes(name)) {
            counter++;
            name = `${t.step3.defaultFactorName} ${factors.length + counter}`;
        }

        const newFactors = [...factors, name];
        const newLevelsMap = { ...levels, [name]: [t.step3.defaultLevel1, t.step3.defaultLevel2] };

        onFactorsChange(newFactors);
        onLevelsChange(newLevelsMap);
    };

    const removeFactor = (index: number) => {
        const factorName = factors[index];
        const newFactors = factors.filter((_, i) => i !== index);
        const newLevelsMap = { ...levels };
        delete newLevelsMap[factorName];

        onFactorsChange(newFactors);
        onLevelsChange(newLevelsMap);
    };

    const updateFactorName = (index: number, newName: string) => {
        const oldName = factors[index];
        if (oldName === newName) return;
        if (factors.includes(newName)) return; // Prevent duplicate

        const newFactors = [...factors];
        newFactors[index] = newName;

        const newLevelsMap = { ...levels };
        newLevelsMap[newName] = newLevelsMap[oldName];
        delete newLevelsMap[oldName];

        onFactorsChange(newFactors);
        onLevelsChange(newLevelsMap);
    };

    const updateLevels = (factorName: string, levelsStr: string) => {
        const newLevels = levelsStr.split(",").map(s => s.trim()).filter(s => s !== "");
        onLevelsChange({ ...levels, [factorName]: newLevels });
    };

    return (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {factors.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted/20"
                    >
                        <p className="text-muted-foreground mb-4">{displayEmptyMessage}</p>
                        <Button type="button" onClick={addFactor} variant="outline" className="border-dashed">
                            <Plus className="mr-2 h-4 w-4" /> {displayAddButtonText}
                        </Button>
                    </motion.div>
                )}

                {factors.map((factor, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        layout
                    >
                        <Card className="group relative overflow-hidden border-border hover:border-teal-200 transition-colors">
                            <CardContent className="p-4 sm:p-6 grid gap-6 md:grid-cols-12 items-start">
                                {/* Handle */}
                                <div className="md:col-span-1 flex flex-col items-center justify-center pt-3 text-muted-foreground/50">
                                    <GripVertical className="h-5 w-5 cursor-move" />
                                    <span className="text-xs font-mono mt-1">{index + 1}</span>
                                </div>

                                {/* Factor Name */}
                                <div className="md:col-span-4 space-y-2">
                                    <Label>{t.step3.factorName}</Label>
                                    <Input
                                        value={factor}
                                        onChange={(e) => updateFactorName(index, e.target.value)}
                                        className="font-medium"
                                    />
                                </div>

                                {/* Levels */}
                                <div className="md:col-span-6 space-y-2">
                                    <Label>{t.step3.levels}</Label>
                                    <Input
                                        defaultValue={levels[factor]?.join(", ")}
                                        onBlur={(e) => updateLevels(factor, e.target.value)}
                                        placeholder={t.step3.levelsPlaceholder}
                                    />
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {levels[factor]?.map((lvl, i) => (
                                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                                                {lvl}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="md:col-span-1 flex justify-end pt-8">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                        onClick={() => removeFactor(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>

            {factors.length > 0 && (
                <Button type="button" onClick={addFactor} variant="outline" className="w-full border-dashed border-border py-4 text-muted-foreground hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50/50">
                    <Plus className="mr-2 h-4 w-4" /> {t.step3.addAnother}
                </Button>
            )}
        </div>
    );
}
