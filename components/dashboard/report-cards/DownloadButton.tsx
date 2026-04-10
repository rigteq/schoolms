"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateReportCardPdf } from "@/lib/utils/reportCardPdf";
import { ReportCard } from "@/lib/hooks/useReportCards";
import { toast } from "sonner";

interface DownloadButtonProps {
    reportCard: ReportCard;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    label?: string;
}

export default function DownloadButton({
    reportCard,
    variant = "default",
    size = "sm",
    className = "",
    label = "Download PDF",
}: DownloadButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!reportCard.report_card_subjects) {
            toast.error("No subject data found. Please open and reload the report card.");
            return;
        }
        setLoading(true);
        try {
            await generateReportCardPdf(reportCard);
            toast.success("PDF downloaded successfully!");
        } catch (err: any) {
            console.error("PDF generation error:", err);
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
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            {label}
        </Button>
    );
}
