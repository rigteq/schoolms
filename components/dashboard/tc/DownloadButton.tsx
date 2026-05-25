"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateTcPdf } from "@/lib/utils/tcPdf";
import { toast } from "sonner";

interface DownloadButtonProps {
    tc: any;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    label?: string;
}

export default function TCDownloadButton({
    tc,
    variant = "default",
    size = "sm",
    className = "",
    label = "Download PDF",
}: DownloadButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            await generateTcPdf(tc);
            toast.success("PDF downloaded successfully!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to generate PDF. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={loading}
            className={`gap-2 ${variant === "default" ? "gradient-btn" : ""} ${className}`}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {label}
        </Button>
    );
}
