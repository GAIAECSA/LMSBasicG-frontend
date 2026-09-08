import type { LucideIcon } from "lucide-react";

export type FormDocumentType =
    | "registration-payments"
    | "certificate-delivery"
    | "student-attendance"
    | "teacher-attendance"
    | "diagnostic-grades"
    | "final-grades"
    | "attendance-percentage";

export interface FormGeneralData {
    course: string;
    code: string;

    instructor: string;
    instructorCi: string;

    legalRepresentative: string;
    legalRepresentativeCi: string;

    startDate: string;
    endDate: string;
    date: string;

    dailyHours: string;
}

export interface FormRow {
    id: string;

    name: string;
    profession: string;
    workplace: string;
    email: string;
    identification: string;

    payment: string;

    academicArea: string;

    courseCode: string;
    evaluationDate: string;

    grade: string;

    theoryGrade: string;
    theoryResult: string;

    practicalGrade: string;
    practicalResult: string;

    attendanceMarks: boolean[];
    attendanceStatus: string;
}

export interface FormState {
    general: FormGeneralData;
    rows: FormRow[];
}

export type GeneralFieldKey =
    keyof FormGeneralData;

export type RowFieldKey =
    keyof FormRow;

export interface GeneralFieldConfig {
    key: GeneralFieldKey;
    label: string;

    type?:
    | "text"
    | "date"
    | "number";
}

export interface RowFieldConfig {
    key: RowFieldKey;
    label: string;

    type?:
    | "text"
    | "email"
    | "date"
    | "number"
    | "select"
    | "attendance";

    options?: string[];

    min?: number;
    max?: number;
    step?: number;
}

export interface FormConfig {
    title: string;
    description: string;
    storageKey: string;

    generalFields:
    GeneralFieldConfig[];

    rowFields:
    RowFieldConfig[];

    addButtonLabel: string;

    icon?: LucideIcon;
}