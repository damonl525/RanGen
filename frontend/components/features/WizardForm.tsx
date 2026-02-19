"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SASGenerationSchema, TASASGenerationSchema } from "@/lib/schemas";
import { useGenerationStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StepBasicInfo } from "@/components/features/StepBasicInfo";
import { StepTreatmentArms } from "@/components/features/StepTreatmentArms";
import { StepStratification } from "@/components/features/StepStratification";
import { StepDrugRandomization } from "@/components/features/StepDrugRandomization";
import { StepRandomizationSettings } from "@/components/features/StepRandomizationSettings";
import { useGenerateSAS } from "@/lib/api";
import { Check, ChevronLeft, ChevronRight, Loader2, Code2, Download, Copy, CheckCheck, Upload, FileJson } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { useUIStore } from "@/lib/uiStore";

const stepComponents = [
    { id: 1, key: "basicInfo" as const, component: StepBasicInfo },
    { id: 2, key: "treatmentArms" as const, component: StepTreatmentArms },
    { id: 3, key: "stratification" as const, component: StepStratification },
    { id: 4, key: "drugKits" as const, component: StepDrugRandomization },
    { id: 5, key: "randomization" as const, component: StepRandomizationSettings },
];

export default function WizardForm() {
    const { config, updateConfig } = useGenerationStore();
    const { t } = useUIStore();

    const steps = stepComponents.map(s => ({
        ...s,
        title: t.steps[s.key]
    }));
    const [currentStep, setCurrentStep] = useState(1);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);

    const methods = useForm<TASASGenerationSchema>({
        // wrapper to fix complex type inference mismatch between RHF and Zod
        resolver: zodResolver(SASGenerationSchema) as any,
        defaultValues: config,
        mode: "onChange"
    });

    // React to external config changes (from SettingsMenu reset/load)
    useEffect(() => {
        methods.reset(config);
        setGeneratedCode(null);
    }, [config, methods]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { mutate, isPending } = useGenerateSAS();
    const [hasCopied, setHasCopied] = useState(false);

    const handleExportConfig = () => {
        const data = methods.getValues();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sas_config_${data.study_id || 'draft'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t.common.exportSuccess);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedConfig = JSON.parse(content);

                // Be careful with validation here in real app
                methods.reset(importedConfig);
                updateConfig(importedConfig);
                toast.success(t.common.importSuccess);
            } catch (error) {
                console.error("Import failed", error);
                toast.error(t.common.importError);
            }
        };
        reader.readAsText(file);
        // Reset input value to allow selecting same file again
        event.target.value = "";
    };

    const handleNext = async () => {
        // Trigger validation for all fields (or subset if we mapped them)
        // Since we want to ensure data integrity, we validate everything logic permits.
        // For a better UX, we should ideally validate only current step fields, but Zod schema is flat.
        // Given most fields have defaults, the blocking ones are mainly in Step 1 (Basic Info).
        const isValid = await methods.trigger();

        if (!isValid) {
            // Get errors to determine which step has issues
            const errors = methods.formState.errors;
            const errorFields = Object.keys(errors);

            // Simple heuristic: if errors exist, show toast and don't proceed.
            // In a more complex app, we would jump to the error step.
            toast.error(`${t.common.validationError} ${errorFields.join(", ")}`);
            console.log("Validation errors:", errors);
            return;
        }

        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Final Step - Submit
            methods.handleSubmit(onSubmit, (errors) => {
                toast.error(t.common.submitError);
                console.error("Submit errors:", errors);
            })();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            setGeneratedCode(null); // Reset code if going back
        }
    };

    const onSubmit = (data: TASASGenerationSchema) => {
        updateConfig(data); // Persist to store
        mutate(data, {
            onSuccess: (code: any) => {
                // The API returns plaintext code
                setGeneratedCode(code);
            }
        });
    };

    const handleDownload = () => {
        if (!generatedCode) return;
        const blob = new Blob([generatedCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sas_randomization_${new Date().toISOString().split('T')[0]}.sas`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t.common.fileDownloaded);
    };

    const handleCopy = () => {
        if (!generatedCode) return;
        navigator.clipboard.writeText(generatedCode);
        setHasCopied(true);
        toast.success(t.common.copySuccess);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const CurrentComponent = steps[currentStep - 1].component;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            {/* Stepper Header */}
            <div className="mb-8 relative">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600">
                        {t.common.appTitle}
                    </h1>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <Button variant="outline" size="sm" onClick={handleImportClick} className="border-slate-200">
                            <Upload className="mr-2 h-4 w-4 text-slate-500" /> {t.common.import}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportConfig} className="border-slate-200">
                            <FileJson className="mr-2 h-4 w-4 text-slate-500" /> {t.common.export}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-center relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded"></div>
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            onClick={() => setCurrentStep(step.id)}
                            className="flex flex-col items-center bg-background px-2 cursor-pointer group"
                        >
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:border-teal-400
                    ${step.id === currentStep ? "border-teal-500 bg-teal-50 text-teal-600" :
                                        step.id < currentStep ? "border-teal-500 bg-teal-500 text-white" :
                                            "border-slate-200 text-slate-400 bg-white dark:bg-slate-900 dark:border-slate-700"}`}
                            >
                                {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                            </div>
                            <span className={`text-xs font-medium mt-2 transition-colors group-hover:text-teal-600 ${step.id === currentStep ? "text-teal-600" : "text-slate-500"}`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2">
                    <Card className="border-border/60 shadow-lg shadow-border/20 dark:shadow-none backdrop-blur-sm bg-card/80">
                        <CardHeader>
                            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormProvider {...methods}>
                                <form className="space-y-8">
                                    <CurrentComponent />
                                </form>
                            </FormProvider>
                        </CardContent>
                        <Separator />
                        <CardFooter className="flex justify-between pt-6">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className="border-slate-200 hover:bg-slate-50"
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> {t.common.back}
                            </Button>

                            <Button
                                onClick={handleNext}
                                className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : currentStep === steps.length ? (
                                    <>{t.common.generate} <Code2 className="ml-2 h-4 w-4" /></>
                                ) : (
                                    <>{t.common.next} <ChevronRight className="ml-2 h-4 w-4" /></>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Live Preview / Helper Side Panel */}
                <div className="hidden lg:block space-y-6">
                    <Card className="bg-muted/30 border-dashed border-2 border-border shadow-none">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-wider text-slate-500">{t.common.summary}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <div>
                                <span className="block text-xs text-slate-400">{t.summary.studyId}</span>
                                <p className="font-medium text-slate-900 dark:text-slate-200">{methods.watch('study_id') || '-'}</p>
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                                        {methods.watch('total_sample_size')}
                                    </span>
                                    <span className="text-slate-400">{t.summary.subjects}</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-400">{t.summary.totalSample}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Generated Code Preview (Simplified) */}
                    {generatedCode && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="border-teal-200 bg-teal-50/50 dark:bg-teal-900/10 dark:border-teal-900">
                                <CardHeader>
                                    <CardTitle className="text-teal-700 dark:text-teal-400 flex items-center">
                                        <Check className="mr-2 h-4 w-4" /> {t.common.success}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-teal-800 dark:text-teal-200 mb-4">
                                        {t.common.generateSuccess}
                                    </p>
                                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={handleDownload} type="button">
                                        <Download className="mr-2 h-4 w-4" /> {t.common.download} code.sas
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>

            </div>

            {/* Full Code Preview Modal or Section could be added here */}
            {generatedCode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-12"
                >
                    <Card className="relative group">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t.common.generatedCodeTitle}</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleCopy} type="button">
                                {hasCopied ? <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                                {hasCopied ? t.common.copied : t.common.copy}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-slate-950 text-slate-50 p-6 rounded-lg overflow-x-auto font-mono text-sm leading-relaxed max-h-[600px] border border-slate-800 shadow-inner">
                                {generatedCode}
                            </pre>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

        </div>
    );
}
