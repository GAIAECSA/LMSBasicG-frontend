import type { ElementType } from "react";
import type { Course } from "@/services/courses.service";
import type {
    CertificateType,
    CourseReportType,
} from "@/services/reports.service";

export type ReportVisualData = {
    icon: ElementType;
};

export type ReportPreview = {
    url: string;
    course: Course;
    reportType: CourseReportType;
    certificateType: CertificateType;
} | null;
