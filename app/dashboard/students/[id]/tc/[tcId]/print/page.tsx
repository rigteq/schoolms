"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const formatDate = (d: string | null) => {
    if (!d) return ".....................";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
};

const CLASS_LABELS = ["P.G.", "Nur.", "J.K.G.", "S.K.G.", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export default function TCPrintPage() {
    const { id, tcId } = useParams();
    const [tc, setTc] = useState<any>(null);
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTC() {
            const [tcRes, studentRes] = await Promise.all([
                supabase.from("transfer_certificates").select("*, tc_academic_records(*)").eq("id", tcId).single(),
                supabase.from("students_data").select("*, schools(school_name, address, phone)").eq("id", id).single(),
            ]);
            setTc(tcRes.data);
            setStudent(studentRes.data);
            setLoading(false);
        }
        fetchTC();
    }, [id, tcId]);

    useEffect(() => {
        if (!loading && tc) {
            setTimeout(() => window.print(), 400);
        }
    }, [loading, tc]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!tc) {
        return <div className="flex items-center justify-center min-h-screen text-slate-500">TC not found.</div>;
    }

    // Build records map keyed by class_label
    const recordsMap: Record<string, any> = {};
    (tc.tc_academic_records || []).forEach((r: any) => {
        recordsMap[r.class_label] = r;
    });

    const schoolName = student?.schools?.school_name || "Mother's Touch School";

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: Georgia, serif; background: #ffffff; color: #111827; }
                @media print {
                    body { background: white; }
                    .no-print { display: none !important; }
                    @page { size: A4 portrait; margin: 10mm; }
                }
                .tc-page {
                    background: #ffffff;
                    border: 1px solid #333;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 12mm;
                    font-size: 11px;
                    line-height: 1.45;
                }
                .header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 4px; font-size: 10px; }
                .school-title { text-align: center; margin: 10px 0 6px; }
                .school-title h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 3px 0; }
                .form-title { font-size: 13px; font-weight: 700; }
                .hindi-title { font-size: 10px; margin-top: 2px; }
                table.main-grid { width: 100%; border-collapse: collapse; margin-top: 8px; }
                table.main-grid td, table.main-grid th { border: 1px solid #333; padding: 6px 7px; vertical-align: top; font-size: 10px; }
                table.record-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                table.record-table th { border: 1px solid #333; padding: 4px 5px; font-size: 9px; font-weight: 700; text-align: center; background: rgba(0,0,0,0.04); }
                table.record-table td { border: 1px solid #333; padding: 3px 4px; font-size: 9px; text-align: center; min-height: 18px; }
                .dob-row { border: 1px solid #333; padding: 6px 8px; margin-top: 6px; font-size: 10px; }
                .cert-text { font-size: 9px; margin-top: 10px; font-style: italic; border: 1px solid #333; padding: 8px; }
                .footer-row { display: flex; justify-content: space-between; margin-top: 12px; font-size: 10px; }
                .print-btn { position: fixed; top: 16px; right: 16px; background: #1f2937; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; z-index: 100; }
                .dot-line { display: inline-block; border-bottom: 1px solid #333; min-width: 100px; }
            `}</style>

            <button className="print-btn no-print" onClick={() => window.print()}>🖨 Print</button>

            <div className="tc-page">
                {/* Top row: file numbers */}
                <div className="header-row">
                    <div>
                        <div>Admission File No. <span className="dot-line">{tc.admission_file_no || ""}</span></div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div>Withdrawal File No. <span className="dot-line">{tc.withdrawal_file_no || ""}</span></div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div>Transfer Certificate File No. <span className="dot-line">{tc.tc_file_no || ""}</span></div>
                    </div>
                </div>

                {/* Aadhar & Register */}
                <div className="header-row" style={{ marginTop: "4px" }}>
                    <div>
                        <div>Aadhar No. <span className="dot-line">{tc.aadhar_number || ""}</span></div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div className="form-title">Scholar's Register &amp;</div>
                        <div className="form-title">Transfer Certificate Form</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div>Register No. <span className="dot-line">{tc.scholar_register_no || ""}</span></div>
                    </div>
                </div>
                <div className="header-row" style={{ marginTop: "4px" }}>
                    <div>
                        <div>APAR No. <span className="dot-line">{tc.apar_number || ""}</span></div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div></div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div>PAN No. <span className="dot-line">{tc.pan_number || ""}</span></div>
                    </div>
                </div>

                {/* School name */}
                <div className="school-title">
                    <h1>{schoolName}</h1>
                </div>

                {/* Main info grid */}
                <table className="main-grid" style={{ marginTop: "8px" }}>
                    <tbody>
                        <tr>
                            <td style={{ width: "30%" }}>
                                <div style={{ fontWeight: "700", marginBottom: "2px" }}>Scholar's Name</div>
                                <div style={{ minHeight: "30px", borderBottom: "1px solid #999" }}>{tc.scholar_name}</div>
                                <div style={{ minHeight: "30px" }}></div>
                            </td>
                            <td style={{ width: "40%" }}>
                                <div style={{ fontWeight: "700", marginBottom: "2px" }}>Father's / Guardian's name &amp; Address</div>
                                <div style={{ minHeight: "30px", borderBottom: "1px solid #999" }}>{tc.father_guardian_name}</div>
                                <div style={{ minHeight: "30px" }}>{tc.father_guardian_address}</div>
                            </td>
                            <td style={{ width: "30%" }}>
                                <div style={{ fontWeight: "700", marginBottom: "2px" }}>Last Institution attended before joining this one if any</div>
                                <div style={{ minHeight: "48px" }}>{tc.last_institution_before}</div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div style={{ fontWeight: "700", marginBottom: "2px" }}>Caste or Religion</div>
                                <div style={{ minHeight: "24px" }}>{tc.caste_or_religion}</div>
                            </td>
                            <td>
                                <div style={{ fontWeight: "700", marginBottom: "2px" }}>Mother's Name</div>
                                <div style={{ minHeight: "24px" }}>{tc.mother_name}</div>
                            </td>
                            <td>
                                <div style={{ fontWeight: "700", marginBottom: "2px" }}>Length of residence in this Province</div>
                                <div style={{ minHeight: "24px" }}>{tc.length_of_residence}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* DOB row */}
                <div className="dob-row">
                    <span style={{ fontWeight: "700" }}>Date of Birth of the Scholar (in figure &amp; words): </span>
                    <span>{tc.dob ? formatDate(tc.dob) : "....................."}</span>
                    {tc.dob_in_words && <span> — {tc.dob_in_words}</span>}
                </div>

                {/* Academic Record Table */}
                <table className="record-table">
                    <thead>
                        <tr>
                            <th style={{ width: "7%" }}>Class</th>
                            <th style={{ width: "10%" }}>Date of Admission</th>
                            <th style={{ width: "10%" }}>Date of Promotion</th>
                            <th style={{ width: "10%" }}>Date of Removal</th>
                            <th style={{ width: "20%" }}>Cause of Removal</th>
                            <th style={{ width: "9%" }}>Year of Session</th>
                            <th style={{ width: "9%" }}>Conduct</th>
                            <th style={{ width: "9%" }}>Work</th>
                            <th style={{ width: "10%" }}>Signature</th>
                        </tr>
                    </thead>
                    <tbody>
                        {CLASS_LABELS.map((label) => {
                            const rec = recordsMap[label] || {};
                            return (
                                <tr key={label}>
                                    <td style={{ fontWeight: "700", textAlign: "left", paddingLeft: "6px" }}>{label}</td>
                                    <td>{rec.date_of_admission ? new Date(rec.date_of_admission).toLocaleDateString("en-IN") : ""}</td>
                                    <td>{rec.date_of_promotion ? new Date(rec.date_of_promotion).toLocaleDateString("en-IN") : ""}</td>
                                    <td>{rec.date_of_removal ? new Date(rec.date_of_removal).toLocaleDateString("en-IN") : ""}</td>
                                    <td style={{ textAlign: "left" }}>{rec.cause_of_removal || ""}</td>
                                    <td>{rec.year_session || ""}</td>
                                    <td>{rec.conduct || ""}{rec.concession ? ` / ${rec.concession}` : ""}</td>
                                    <td>{rec.work || ""}</td>
                                    <td>{rec.signature || ""}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Certification */}
                <div className="cert-text">
                    {tc.certification_remarks || "Certified that the above Scholar's Register has been, posted up-to-date of the Scholar's leaving as required by the Departmental Rules."}
                </div>

                {/* Footer */}
                <div className="footer-row">
                    <div>Dated <span className="dot-line">{tc.dated ? formatDate(tc.dated) : ""}</span></div>
                    <div style={{ fontStyle: "italic" }}>पृन्ना पटीए P.T.O.</div>
                    <div>संस्थापक / Head of Institution</div>
                </div>
            </div>
        </>
    );
}
