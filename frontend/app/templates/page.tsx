"use client";

import { useTemplates } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, FileSpreadsheet, Download, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

export default function TemplatesPage() {
    const { data: templates, isLoading } = useTemplates();
    const [previewTemplate, setPreviewTemplate] = useState<{ name: string, path: string } | null>(null);

    return (
        <div className="container mx-auto py-8">
            {/* Header */}
            <div className="flex items-center mb-8">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="mr-4">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Excel Config Templates</h1>
                    <p className="text-muted-foreground mt-2">Browse and preview standard vendor templates for randomization.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates?.map((t: any) => (
                        <Card
                            key={t.name}
                            className="hover:shadow-md transition-shadow cursor-pointer bg-card hover:border-green-200 group relative overflow-hidden"
                            onClick={() => setPreviewTemplate(t)}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 group-hover:text-green-600 transition-colors">
                                    <FileSpreadsheet className="h-5 w-5 text-green-500" />
                                    <span className="truncate">{t.name}</span>
                                </CardTitle>
                                <CardDescription className="truncate font-mono text-xs">{t.path}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm text-muted-foreground group-hover:text-green-600/80">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Click to preview & download
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {templates?.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No templates found in assets/templates.
                        </div>
                    )}
                </div>
            )}

            <TemplatePreviewDialog
                open={!!previewTemplate}
                template={previewTemplate}
                onOpenChange={(open) => !open && setPreviewTemplate(null)}
            />
        </div>
    )
}

function TemplatePreviewDialog({ open, template, onOpenChange }: {
    open: boolean,
    template: { name: string, path: string } | null,
    onOpenChange: (open: boolean) => void
}) {
    const [loading, setLoading] = useState(false);
    const [html, setHtml] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && template) {
            loadPreview(template.name);
        } else {
            setHtml("");
            setError(null);
        }
    }, [open, template]);

    const loadPreview = async (fileName: string) => {
        setLoading(true);
        setError(null);
        try {
            // Add timestamp to prevent caching of the file content
            const url = `http://127.0.0.1:8000/api/v1/templates/${encodeURIComponent(fileName)}?t=${new Date().getTime()}`;
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const data = new Uint8Array(response.data);
            const workbook = XLSX.read(data, { type: 'array' });

            if (workbook.SheetNames.length === 0) {
                setError("No sheets found in this Excel file.");
                return;
            }

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Limit preview to first 50 rows to avoid performance issues with large empty ranges
            const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:A1");
            range.e.r = Math.min(range.e.r, 50); // Cap at 50 rows
            worksheet['!ref'] = XLSX.utils.encode_range(range);

            const htmlStr = XLSX.utils.sheet_to_html(worksheet, { id: "excel-table", editable: false });
            setHtml(htmlStr);
        } catch (err) {
            console.error("Failed to load Excel preview:", err);
            setError("Failed to load preview. The file might be corrupted or incompatible.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!template) return;
        const downloadUrl = `http://127.0.0.1:8000/api/v1/templates/${encodeURIComponent(template.name)}`;
        window.open(downloadUrl, '_blank');
        toast.success("Download started");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-6">
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        {template?.name}
                    </DialogTitle>
                    <DialogDescription>
                        Previewing content (First Sheet). Layout may slightly differ from actual Excel.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto border rounded-md bg-white p-4 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500">
                            <p>{error}</p>
                            <Button variant="outline" onClick={() => template && loadPreview(template.name)} className="mt-4">
                                Retry
                            </Button>
                        </div>
                    ) : (
                        <div
                            className="excel-preview-container text-sm"
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    )}
                </div>

                <DialogFooter className="mt-4 gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white">
                        <Download className="h-4 w-4 mr-2" />
                        Download Original
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
