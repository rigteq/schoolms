"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// The standard class labels matching the TC form
const CLASS_LABELS = ["P.G.", "Nur.", "J.K.G.", "S.K.G.", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/** Validate a 12-digit Aadhar number */
function validateAadhar(val: string): string | null {
    if (!val) return null; // optional field
    const cleaned = val.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleaned)) return "Aadhar number must be exactly 12 digits.";
    return null;
}

function validatePan(val: string): string | null {
    if (!val) return null; // optional field
    const cleaned = val.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleaned)) {
        return "PAN number must be 10 characters in format ABCDE1234F.";
    }
    return null;
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const DAYS = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth", "Thirteenth", "Fourteenth", "Fifteenth", "Sixteenth", "Seventeenth", "Eighteenth", "Nineteenth", "Twentieth", "Twenty First", "Twenty Second", "Twenty Third", "Twenty Fourth", "Twenty Fifth", "Twenty Sixth", "Twenty Seventh", "Twenty Eighth", "Twenty Ninth", "Thirtieth", "Thirty First"];
const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function numberToWords(num: number): string {
    if (num < 20) return ONES[num];
    if (num < 100) return TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ONES[num % 10] : "");
    if (num < 1000) return ONES[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numberToWords(num % 100) : "");
    if (num < 10000) {
        return ONES[Math.floor(num / 1000)] + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "");
    }
    return num.toString();
}

function dateToWords(dateStr: string): string {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return "";
    
    const dayWord = DAYS[day];
    const monthWord = MONTHS[month];
    const yearWord = numberToWords(year);
    
    return `${dayWord} ${monthWord} ${yearWord}`;
}

interface AcademicRecord {
    class_label: string;
    date_of_admission: string;
    date_of_promotion: string;
    date_of_removal: string;
    cause_of_removal: string;
    year_session: string;
    conduct: string;
    concession: string;
    work: string;
    signature: string;
}

interface TCFormProps {
    student: any;
    tc?: any; // if provided, editing existing TC
    onSuccess?: (tcId: string) => void;
}

const emptyRecord = (): AcademicRecord => ({
    class_label: "",
    date_of_admission: "",
    date_of_promotion: "",
    date_of_removal: "",
    cause_of_removal: "",
    year_session: "",
    conduct: "",
    concession: "",
    work: "",
    signature: "",
});

export default function TCForm({ student, tc, onSuccess }: TCFormProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [aadharError, setAadharError] = useState<string | null>(null);
    const [panError, setPanError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        admission_file_no: tc?.admission_file_no || "",
        withdrawal_file_no: tc?.withdrawal_file_no || "",
        tc_file_no: tc?.tc_file_no || "",
        scholar_register_no: tc?.scholar_register_no || "",
        apar_number: tc?.apar_number || "",
        pan_number: tc?.pan_number || "",
        aadhar_number: tc?.aadhar_number || student?.aadhar_number || "",
        scholar_name: tc?.scholar_name || student?.full_name || "",
        father_guardian_name: tc?.father_guardian_name || student?.father_name || "",
        father_guardian_address: tc?.father_guardian_address || student?.current_address || "",
        mother_name: tc?.mother_name || student?.mother_name || "",
        caste_or_religion: tc?.caste_or_religion || "",
        last_institution_before: tc?.last_institution_before || student?.last_institution || "",
        length_of_residence: tc?.length_of_residence || "",
        dob: tc?.dob || student?.dob || "",
        dob_in_words: tc?.dob_in_words || "",
        certification_remarks: tc?.certification_remarks || "Certified that the above Scholar's Register has been, posted up-to-date of the Scholar's leaving as required by the Departmental Rules.",
        dated: tc?.dated || new Date().toISOString().split("T")[0],
    });

    const [records, setRecords] = useState<AcademicRecord[]>(() => {
        if (tc?.tc_academic_records?.length) {
            return tc.tc_academic_records.map((r: any) => ({
                class_label: r.class_label || "",
                date_of_admission: r.date_of_admission || "",
                date_of_promotion: r.date_of_promotion || "",
                date_of_removal: r.date_of_removal || "",
                cause_of_removal: r.cause_of_removal || "",
                year_session: r.year_session || "",
                conduct: r.conduct || "",
                concession: r.concession || "",
                work: r.work || "",
                signature: r.signature || "",
            }));
        }
        // Default: one row per class label
        return CLASS_LABELS.map((label) => ({ ...emptyRecord(), class_label: label }));
    });

    const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData((prev) => ({ ...prev, aadhar_number: val }));
        setAadharError(validateAadhar(val));
    };

    const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData((prev) => ({ ...prev, pan_number: val }));
        setPanError(validatePan(val));
    };

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData((prev) => ({ ...prev, dob: val, dob_in_words: dateToWords(val) }));
    };

    const setRecord = (idx: number, field: keyof AcademicRecord) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setRecords((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: e.target.value };
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (aadharError || panError) {
            toast.error(aadharError || panError || "Please correct the highlighted fields.");
            return;
        }

        setLoading(true);

        try {
            let tcId: string;

            const cleanData = {
                ...formData,
                dob: formData.dob || null,
                dated: formData.dated || null,
            };

            if (tc?.id) {
                // Update existing
                const { error } = await supabase
                    .from("transfer_certificates")
                    .update({ ...cleanData, modified_at: new Date().toISOString() })
                    .eq("id", tc.id);
                if (error) throw error;
                tcId = tc.id;

                // Delete old records and re-insert
                await supabase.from("tc_academic_records").delete().eq("tc_id", tcId);
            } else {
                // Create new
                const { data, error } = await supabase
                    .from("transfer_certificates")
                    .insert({
                        ...cleanData,
                        student_id: student.id,
                        school_id: student.school_id,
                        created_by: profile?.id || null,
                    })
                    .select("id")
                    .single();
                if (error) throw error;
                tcId = data.id;
            }

            // Insert academic records
            const recordsToInsert = records
                .filter((r) => r.class_label)
                .map((r, i) => ({ 
                    ...r, 
                    tc_id: tcId, 
                    sort_order: i,
                    date_of_admission: r.date_of_admission || null,
                    date_of_promotion: r.date_of_promotion || null,
                    date_of_removal: r.date_of_removal || null,
                }));

            if (recordsToInsert.length > 0) {
                const { error: recErr } = await supabase.from("tc_academic_records").insert(recordsToInsert);
                if (recErr) throw recErr;
            }

            toast.success(tc?.id ? "TC updated successfully!" : "TC created successfully!");
            if (onSuccess) onSuccess(tcId);
        } catch (err: any) {
            toast.error(err.message || "Failed to save TC");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── File Numbers ── */}
            <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    File Numbers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="admission_file_no">Admission File No.</Label>
                        <Input id="admission_file_no" value={formData.admission_file_no} onChange={setField("admission_file_no")} placeholder="e.g. AF-001" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="withdrawal_file_no">Withdrawal File No.</Label>
                        <Input id="withdrawal_file_no" value={formData.withdrawal_file_no} onChange={setField("withdrawal_file_no")} placeholder="e.g. WF-001" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="tc_file_no">TC File No.</Label>
                        <Input id="tc_file_no" value={formData.tc_file_no} onChange={setField("tc_file_no")} placeholder="e.g. TC-001" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="scholar_register_no">Scholar Register No.</Label>
                        <Input id="scholar_register_no" value={formData.scholar_register_no} onChange={setField("scholar_register_no")} placeholder="e.g. SR-001" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="tc_aadhar_number">Aadhar Number</Label>
                        <Input id="tc_aadhar_number" value={formData.aadhar_number} onChange={handleAadharChange} placeholder="12-digit Aadhar" maxLength={14} />
                        {aadharError && <div className="text-red-500 text-xs font-medium">{aadharError}</div>}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="tc_apar_number">APAR Number</Label>
                        <Input id="tc_apar_number" value={formData.apar_number} onChange={setField("apar_number")} placeholder="e.g. APAR-001" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="tc_pan_number">PAN Number</Label>
                        <Input id="tc_pan_number" value={formData.pan_number} onChange={handlePanChange} placeholder="e.g. ABCDE1234F" maxLength={10} />
                        {panError && <div className="text-red-500 text-xs font-medium">{panError}</div>}
                    </div>
                </div>
            </section>

            {/* ── Student Details ── */}
            <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Student Details
                </h3>
                <div className="space-y-1.5">
                    <Label htmlFor="scholar_name">Scholar&apos;s Name</Label>
                    <Input id="scholar_name" value={formData.scholar_name} onChange={setField("scholar_name")} required placeholder="Full name of student" disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="father_guardian_name">Father&apos;s / Guardian&apos;s Name</Label>
                        <Input id="father_guardian_name" value={formData.father_guardian_name} onChange={setField("father_guardian_name")} placeholder="Father's or guardian's full name" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="mother_name">Mother&apos;s Name</Label>
                        <Input id="mother_name" value={formData.mother_name} onChange={setField("mother_name")} placeholder="Mother's full name" />
                    </div>
                </div>
                <div className="space-y-1.5">
                        <Label htmlFor="father_guardian_address">Father&apos;s / Guardian&apos;s Address</Label>
                    <Textarea id="father_guardian_address" value={formData.father_guardian_address} onChange={setField("father_guardian_address")} rows={2} placeholder="Full address" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="caste_or_religion">Caste or Religion</Label>
                        <Input id="caste_or_religion" value={formData.caste_or_religion} onChange={setField("caste_or_religion")} placeholder="e.g. Hindu / General" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="length_of_residence">Length of Residence in this Province</Label>
                        <Input id="length_of_residence" value={formData.length_of_residence} onChange={setField("length_of_residence")} placeholder="e.g. 5 years" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="last_institution_before">Last Institution Attended Before Joining (if any)</Label>
                    <Input id="last_institution_before" value={formData.last_institution_before} onChange={setField("last_institution_before")} placeholder="Name of previous school" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" value={formData.dob} onChange={handleDobChange} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="dob_in_words">Date of Birth (in words)</Label>
                        <Input id="dob_in_words" value={formData.dob_in_words} onChange={setField("dob_in_words")} placeholder="e.g. Fifteenth January Two Thousand Ten" />
                    </div>
                </div>
            </section>

            {/* ── Academic Record Table ── */}
            <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Academic Record
                </h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 w-14">Class</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[110px]">Date of Admission</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[110px]">Date of Promotion</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[110px]">Date of Removal</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[140px]">Cause of Removal</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[90px]">Year / Session</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 w-20">Conduct</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 min-w-[90px]">Concession</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 w-16">Work</th>
                                <th className="px-2 py-2 text-left font-semibold text-slate-600 w-20">Signature</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.map((rec, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-2 py-1.5">
                                        <span className="font-semibold text-slate-700">{rec.class_label}</span>
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input type="date" value={rec.date_of_admission} onChange={setRecord(idx, "date_of_admission")} className="h-7 text-xs border-slate-200 px-1" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input type="date" value={rec.date_of_promotion} onChange={setRecord(idx, "date_of_promotion")} className="h-7 text-xs border-slate-200 px-1" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input type="date" value={rec.date_of_removal} onChange={setRecord(idx, "date_of_removal")} className="h-7 text-xs border-slate-200 px-1" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input value={rec.cause_of_removal} onChange={setRecord(idx, "cause_of_removal")} className="h-7 text-xs border-slate-200 px-1" placeholder="e.g. Promoted" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input value={rec.year_session} onChange={setRecord(idx, "year_session")} className="h-7 text-xs border-slate-200 px-1" placeholder="2024-25" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input value={rec.conduct} onChange={setRecord(idx, "conduct")} className="h-7 text-xs border-slate-200 px-1" placeholder="Good" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input value={rec.concession} onChange={setRecord(idx, "concession")} className="h-7 text-xs border-slate-200 px-1" placeholder="None" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input value={rec.work} onChange={setRecord(idx, "work")} className="h-7 text-xs border-slate-200 px-1" placeholder="Good" />
                                    </td>
                                    <td className="px-1 py-1">
                                        <Input value={rec.signature} onChange={setRecord(idx, "signature")} className="h-7 text-xs border-slate-200 px-1" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Certification & Date ── */}
            <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Certification
                </h3>
                <div className="space-y-1.5">
                    <Label htmlFor="certification_remarks">Certification Remarks</Label>
                    <Textarea id="certification_remarks" value={formData.certification_remarks} onChange={setField("certification_remarks")} rows={3} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="dated">Date</Label>
                    <Input id="dated" type="date" value={formData.dated} onChange={setField("dated")} />
                </div>
            </section>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {tc?.id ? "Update TC" : "Create TC"}
                </Button>
            </div>
        </form>
    );
}
