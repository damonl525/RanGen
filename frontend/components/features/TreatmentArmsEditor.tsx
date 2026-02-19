"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { TASASGenerationSchema } from "@/lib/schemas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/uiStore";
import { Card } from "@/components/ui/card";

interface TreatmentArmsEditorProps {
    path: "treatment_arms" | `protocols.${number}.treatment_arms`;
    title?: string;
    description?: string;
}

export function TreatmentArmsEditor({ path, title, description }: TreatmentArmsEditorProps) {
    const { control, register, formState: { errors } } = useFormContext<TASASGenerationSchema>();
    const { t } = useUIStore();
    const displayTitle = title || t.step2.treatmentArms;

    // @ts-ignore - Dynamic path for field array
    const { fields, append, remove } = useFieldArray({
        control,
        name: path
    });

    // Helper to get error for specific field safely
    const getError = (index: number, field: string) => {
        // @ts-ignore
        const errArray = path === "treatment_arms"
            ? errors.treatment_arms
            // @ts-ignore
            : errors.protocols?.[parseInt(path.split('.')[1])]?.treatment_arms;

        return (errArray?.[index] as any)?.[field];
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">{displayTitle}</h3>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                <Button
                    type="button"
                    onClick={() => append({ armcd: "", arm: "", ratio: 1 })}
                    variant="outline"
                    className="border-dashed border-teal-500 text-teal-600 hover:bg-teal-50"
                >
                    <Plus className="mr-2 h-4 w-4" /> {t.step2.addArm}
                </Button>
            </div>

            <div className="space-y-3">
                <AnimatePresence initial={false}>
                    {fields.map((field, index) => (
                        <motion.div
                            key={field.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="p-4 border border-border bg-muted/20 relative group hover:border-teal-500/50 transition-colors">
                                <div className="grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-3">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t.step2.code}</Label>
                                        <Input
                                            placeholder="e.g. A"
                                            // @ts-ignore
                                            {...register(`${path}.${index}.armcd`)}
                                            className={getError(index, 'armcd') ? "border-red-500" : ""}
                                        />
                                    </div>
                                    <div className="col-span-6">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t.step2.name}</Label>
                                        <Input
                                            placeholder="e.g. Test Drug 10mg"
                                            // @ts-ignore
                                            {...register(`${path}.${index}.arm`)}
                                            className={getError(index, 'arm') ? "border-red-500" : ""}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t.step2.ratio}</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="1"
                                            // @ts-ignore
                                            {...register(`${path}.${index}.ratio`)}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                            disabled={fields.length <= 1} // Allow removing down to 1, or 0? Schema says min 1
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {(getError(index, 'armcd') || getError(index, 'arm')) && (
                                    <p className="text-xs text-red-500 mt-2 absolute bottom-1 right-4">
                                        {t.common.required}
                                    </p>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {fields.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg border-border bg-muted/10">
                    {t.step2.noArms}
                </div>
            )}
        </div>
    );
}
