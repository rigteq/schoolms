import { autoGrade, ReportCard, ReportCardSubject } from '@/lib/hooks/useReportCards';

// Safe dynamic import for browser-only jsPDF
export async function generateReportCardPdf(reportCard: ReportCard): Promise<void> {
    // Dynamically import jspdf to avoid SSR issues
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    // @ts-ignore
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pageW - margin * 2;

    const school = reportCard.schools;
    const student = reportCard.students_data;
    const subjects = reportCard.report_card_subjects || [];

    // ── Header Band ─────────────────────────────────────────────────────────
    doc.setFillColor(67, 56, 202); // indigo-700
    doc.rect(0, 0, pageW, 32, 'F');

    // Accent line
    doc.setFillColor(6, 182, 212); // cyan-500
    doc.rect(0, 32, pageW, 2, 'F');

    // School Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const schoolName = school?.school_name || 'School Name';
    doc.text(schoolName, pageW / 2, 14, { align: 'center' });

    // School contact
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const contactParts = [school?.address, school?.phone, school?.email].filter(Boolean).join('  |  ');
    if (contactParts) {
        doc.text(contactParts, pageW / 2, 22, { align: 'center' });
    }

    // Report Card Title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT REPORT CARD', pageW / 2, 29, { align: 'center' });

    // ── Student Info Box ─────────────────────────────────────────────────────
    let y = 42;
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.roundedRect(margin, y, contentW, 28, 2, 2, 'F');
    doc.setDrawColor(199, 210, 254); // indigo-200
    doc.roundedRect(margin, y, contentW, 28, 2, 2, 'S');

    doc.setTextColor(55, 65, 81); // gray-700
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    // Left column
    const col1x = margin + 4;
    const col2x = margin + contentW / 2 + 4;
    const lineH = 7;
    let iy = y + 8;

    doc.text('Student Name:', col1x, iy);
    doc.setFont('helvetica', 'normal');
    doc.text(student?.full_name || 'N/A', col1x + 30, iy);

    doc.setFont('helvetica', 'bold');
    doc.text('Class:', col2x, iy);
    doc.setFont('helvetica', 'normal');
    doc.text(reportCard.classes?.class_name || 'N/A', col2x + 18, iy);

    iy += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Academic Year:', col1x, iy);
    doc.setFont('helvetica', 'normal');
    doc.text(reportCard.academic_year, col1x + 30, iy);

    doc.setFont('helvetica', 'bold');
    doc.text('Term:', col2x, iy);
    doc.setFont('helvetica', 'normal');
    doc.text(reportCard.term, col2x + 18, iy);

    iy += lineH;
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', col1x, iy);
    doc.setFont('helvetica', 'normal');
    doc.text(student?.email || 'N/A', col1x + 30, iy);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', col2x, iy);
    doc.setFont('helvetica', 'normal');
    doc.text(reportCard.is_published ? 'Published' : 'Draft', col2x + 18, iy);

    // ── Grades Table ───────────────────────────────────────────────────────
    y += 36;

    const tableBody = subjects.map((s: ReportCardSubject) => {
        const obtained = s.obtained_marks ?? 0;
        const grade = s.grade || autoGrade(obtained, s.max_marks);
        const pct = s.max_marks > 0 ? ((obtained / s.max_marks) * 100).toFixed(1) + '%' : 'N/A';
        return [
            s.subject_name,
            s.max_marks.toString(),
            obtained.toString(),
            pct,
            grade,
            s.remarks || '',
        ];
    });

    // Compute totals
    const totalMax = subjects.reduce((acc: number, s: ReportCardSubject) => acc + s.max_marks, 0);
    const totalObtained = subjects.reduce((acc: number, s: ReportCardSubject) => acc + (s.obtained_marks ?? 0), 0);
    const overallPct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) + '%' : 'N/A';
    const overallGrade = totalMax > 0 ? autoGrade(totalObtained, totalMax) : 'N/A';

    // Section header
    doc.setTextColor(67, 56, 202);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC PERFORMANCE', margin, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        head: [['Subject', 'Max Marks', 'Obtained', 'Percentage', 'Grade', 'Remarks']],
        body: tableBody,
        foot: [['TOTAL / OVERALL', totalMax.toString(), totalObtained.toString(), overallPct, overallGrade, '']],
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            overflow: 'linebreak',
            valign: 'middle',
            minCellHeight: 8,
        },
        headStyles: {
            fillColor: [67, 56, 202],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
        },
        footStyles: {
            fillColor: [238, 242, 255],
            textColor: [67, 56, 202],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [55, 65, 81],
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        tableWidth: contentW,
        columnStyles: {
            0: { cellWidth: 52, halign: 'left' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 24, halign: 'center' },
            3: { cellWidth: 26, halign: 'center' },
            4: { cellWidth: 18, halign: 'center' },
            5: { cellWidth: 30, halign: 'left' },
        },
        didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 4) {
                const grade = data.cell.raw as string;
                if (grade === 'A+' || grade === 'A') data.cell.styles.textColor = [22, 163, 74]; // green
                else if (grade === 'B+' || grade === 'B') data.cell.styles.textColor = [37, 99, 235]; // blue
                else if (grade === 'C') data.cell.styles.textColor = [234, 179, 8]; // yellow
                else if (grade === 'D' || grade === 'F') data.cell.styles.textColor = [220, 38, 38]; // red
            }

            if (data.section === 'foot') {
                if (data.column.index === 0 || data.column.index === 5) {
                    data.cell.styles.halign = 'left';
                } else {
                    data.cell.styles.halign = 'center';
                }
            }
        },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.2,
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // ── Remarks Section ────────────────────────────────────────────────────
    if (reportCard.remarks) {
        const ry = finalY + 8;
        doc.setTextColor(67, 56, 202);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("TEACHER'S REMARKS", margin, ry);

        doc.setFillColor(238, 242, 255);
        doc.roundedRect(margin, ry + 2, contentW, 16, 2, 2, 'F');
        doc.setDrawColor(199, 210, 254);
        doc.roundedRect(margin, ry + 2, contentW, 16, 2, 2, 'S');

        doc.setTextColor(55, 65, 81);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(reportCard.remarks, contentW - 8);
        doc.text(lines, margin + 4, ry + 9);
    }

    // ── Signature Section ──────────────────────────────────────────────────
    const sigY = pageH - 30;
    doc.setDrawColor(199, 210, 254);
    doc.line(margin, sigY, margin + 50, sigY);
    doc.line(pageW - margin - 50, sigY, pageW - margin, sigY);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text("Class Teacher's Signature", margin + 25, sigY + 5, { align: 'center' });
    doc.text("Principal's Signature", pageW - margin - 25, sigY + 5, { align: 'center' });

    // ── Generated Date ────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageW / 2, pageH - 6, { align: 'center' });

    // ── Footer Band ────────────────────────────────────────────────────────
    doc.setFillColor(67, 56, 202);
    doc.rect(0, pageH - 3, pageW, 3, 'F');

    // Save
    const fileName = `Report_Card_${student?.full_name?.replace(/\s+/g, '_') || 'Student'}_${reportCard.academic_year}_${reportCard.term.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
}
