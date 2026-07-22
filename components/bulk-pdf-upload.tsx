"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, XCircle, Play, Loader2 } from "lucide-react";

type BulkFile = {
    id: string;
    file: File;
    status: "pending" | "extracting" | "uploading" | "done" | "error";
};

export function BulkPdfUpload({ onSuccess }: { onSuccess?: () => void }) {
    const [files, setFiles] = useState<BulkFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        const newBulkFiles: BulkFile[] = selectedFiles.map((file) => ({
            id: Math.random().toString(36).substring(7),
            file,
            status: "pending",
        }));

        setFiles((prev) => [...prev, ...newBulkFiles]);
        event.target.value = "";
    }

    function removeFile(idToRemove: string) {
        setFiles((prev) => prev.filter((f) => f.id !== idToRemove));
    }

    async function startBulkProcess() {
        setIsProcessing(true);
        // Aquí implementaremos el bucle de procesamiento masivo en el siguiente paso
        console.log("Procesando lote de", files.length, "archivos...");
        setIsProcessing(false);
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="relative flex min-h-40 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-10 transition-colors hover:bg-muted/40 hover:border-primary/50">
                <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                    onChange={handleFileSelect}
                    title=""
                />
                <UploadCloud className="mb-4 size-10 text-muted-foreground" />
                <p className="text-center text-sm font-medium text-foreground">
                    Haz clic o arrastra múltiples PDFs aquí
                </p>
            </div>

            {files.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <h3 className="font-semibold">Archivos en cola ({files.length})</h3>
                        <Button
                            onClick={startBulkProcess}
                            disabled={isProcessing || files.length === 0}
                        >
                            {isProcessing ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Play className="mr-2 size-4" />
                            )}
                            Procesar todo
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {files.map((item) => (
                            <Card
                                key={item.id}
                                className="flex items-center justify-between p-3"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="size-5 text-primary" />
                                    <span className="truncate text-sm font-medium">
                                        {item.file.name}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(item.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <XCircle className="size-5" />
                                </button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
