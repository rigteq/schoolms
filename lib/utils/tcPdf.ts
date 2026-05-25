// Client-only PDF generation for Transfer Certificates.
// Uses jsPDF and jsPDF-AutoTable to create a one-page clinical TC PDF.

const TC_CLASS_LABELS = ["P.G.", "Nur.", "J.K.G.", "S.K.G.", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function formatIndianDate(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

export async function generateTcPdf(tc: any): Promise<void> {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentW = pageW - margin * 2;

    const schoolName = tc.schools?.school_name || tc.students_data?.schools?.school_name || 'School Name';
    const schoolAddress = tc.schools?.address || '';
    const schoolPhone = tc.schools?.phone || '';
    const studentName = tc.students_data?.full_name || tc.scholar_name || 'Student Name';
    const fileYear = tc.dated ? new Date(tc.dated).getFullYear().toString() : tc.created_at ? new Date(tc.created_at).getFullYear().toString() : 'Year';

    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(schoolName.toUpperCase(), pageW / 2, y, { align: 'center' });

    y += 7;
    doc.setDrawColor(0);
    doc.setLineWidth(1.1);
    doc.line(margin, y, pageW - margin, y);

    y += 12;
    const topCenterX = pageW / 2;
    const topRightX = pageW - margin;
    const drawHeaderCell = (label: string, value: string | null | undefined, x: number, align: 'left' | 'center' | 'right') => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, y, { align });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(value || '—', x, y + 5, { align });
    };

    drawHeaderCell('Admission File No.', tc.admission_file_no, margin, 'left');
    drawHeaderCell('Withdrawal File No.', tc.withdrawal_file_no, topCenterX, 'center');
    drawHeaderCell('TC File No.', tc.tc_file_no, topRightX, 'right');

    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text("Scholar's Register & Transfer Certificate Form", pageW / 2, y, { align: 'center' });

    y += 14;
    drawHeaderCell('Aadhar No.', tc.aadhar_number, margin, 'left');
    drawHeaderCell('Register No.', tc.scholar_register_no, topRightX, 'right');

    y += 18;
    drawHeaderCell('APAR No.', tc.apar_number, margin, 'left');
    drawHeaderCell('PAN No.', tc.pan_number, topRightX, 'right');

    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    const detailsBody: any[][] = [
        [
            { content: "Scholar's Name", styles: { halign: 'left' as const, fontStyle: 'bold' as const, fontSize: 9 } },
            { content: "Father's / Guardian's name & Address", styles: { halign: 'left' as const, fontStyle: 'bold' as const, fontSize: 9 } },
            { content: 'Last Institution attended before joining this one if any', styles: { halign: 'left' as const, fontStyle: 'bold' as const, fontSize: 9 } },
        ],
        [
            { content: studentName, styles: { halign: 'left' as const } },
            { content: `${tc.father_guardian_name || '—'}
${tc.father_guardian_address || '—'}`, styles: { halign: 'left' as const } },
            { content: tc.last_institution_before || '—', styles: { halign: 'left' as const } },
        ],
        [
            { content: "Caste or Religion", styles: { halign: 'left' as const, fontStyle: 'bold' as const, fontSize: 9 } },
            { content: "Mother's Name", styles: { halign: 'left' as const, fontStyle: 'bold' as const, fontSize: 9 } },
            { content: 'Length of Residence in this Province', styles: { halign: 'left' as const, fontStyle: 'bold' as const, fontSize: 9 } },
        ],
        [
            { content: tc.caste_or_religion || '—', styles: { halign: 'left' as const } },
            { content: tc.mother_name || '—', styles: { halign: 'left' as const } },
            { content: tc.length_of_residence || '—', styles: { halign: 'left' as const } },
        ],
    ];

    autoTable(doc, {
        startY: y,
        head: [],
        body: detailsBody,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2.4, minCellHeight: 8, valign: 'top' },
        columnStyles: {
            0: { cellWidth: contentW * 0.3 },
            1: { cellWidth: contentW * 0.42 },
            2: { cellWidth: contentW * 0.28 },
        },
        margin: { left: margin, right: margin },
        tableWidth: contentW,
    });

    const detailEndY = (doc as any).lastAutoTable?.finalY || y + 28;
    const dobLines = [
        `Date of Birth of the Scholar (in figure & words): ${tc.dob ? formatIndianDate(tc.dob) : '—'}`,
        tc.dob_in_words ? `(${tc.dob_in_words})` : '—',
    ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(dobLines[0], margin, detailEndY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(dobLines[1], margin, detailEndY + 15);

    const recordStartY = detailEndY + 26;
    const records = Array.isArray(tc.tc_academic_records) ? tc.tc_academic_records : [];
    const recordsByLabel = TC_CLASS_LABELS.reduce((acc: Record<string, any>, label) => {
        acc[label] = records.find((record: any) => record.class_label === label) || {};
        return acc;
    }, {} as Record<string, any>);

    autoTable(doc, {
        startY: recordStartY,
        head: [[
            'Class', 'Admission', 'Promotion', 'Removal', 'Cause of Removal', 'Year/Session', 'Conduct', 'Work', 'Signature'
        ]],
        body: TC_CLASS_LABELS.map((label) => {
            const rec = recordsByLabel[label] || {};
            return [
                label,
                rec.date_of_admission ? new Date(rec.date_of_admission).toLocaleDateString('en-IN') : '',
                rec.date_of_promotion ? new Date(rec.date_of_promotion).toLocaleDateString('en-IN') : '',
                rec.date_of_removal ? new Date(rec.date_of_removal).toLocaleDateString('en-IN') : '',
                rec.cause_of_removal || '',
                rec.year_session || '',
                rec.conduct || '',
                rec.work || '',
                rec.signature || '',
            ];
        }),
        styles: { fontSize: 7.5, cellPadding: 1.4, overflow: 'linebreak', valign: 'middle', minCellHeight: 6 },
        headStyles: { fillColor: [245, 245, 245], textColor: [33, 33, 33], fontStyle: 'bold', fontSize: 8 },
        margin: { left: margin, right: margin },
        tableWidth: contentW,
        pageBreak: 'avoid',
        columnStyles: {
            0: { cellWidth: 14 },
            1: { cellWidth: 18 },
            2: { cellWidth: 18 },
            3: { cellWidth: 16 },
            4: { cellWidth: 34 },
            5: { cellWidth: 16 },
            6: { cellWidth: 15 },
            7: { cellWidth: 15 },
            8: { cellWidth: 18 },
        },
    });

    const recordEndY = (doc as any).lastAutoTable?.finalY || recordStartY + 70;
    const remarks = tc.certification_remarks || 'Certified that the above Scholar\'s Register has been posted up-to-date of the Scholar\'s leaving as required by the Departmental Rules.';
    const remarkLines = doc.splitTextToSize(remarks, contentW);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Certification Remarks:', margin, recordEndY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(remarkLines, margin, recordEndY + 13);

    const footerY = Math.max(recordEndY + 25, pageH - 32);
    doc.setFontSize(9);
    doc.text(`Dated: ${tc.dated ? formatIndianDate(tc.dated) : '—'}`, margin, footerY);
    doc.text('P.T.O.', pageW / 2, footerY, { align: 'center' });
    doc.text('Head of Institution', pageW - margin, footerY, { align: 'right' });

    const fileName = `TC_${studentName.replace(/\s+/g, '_')}_${fileYear}.pdf`;
    doc.save(fileName);
}
