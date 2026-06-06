import {
    BadgeCheck,
    BookOpen,
    CalendarCheck,
    ClipboardList,
    FileCheck2,
    FileQuestion,
    FileSpreadsheet,
    GraduationCap,
    IdCard,
    Layers3,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    Users,
} from "lucide-react";
import type { CourseReportType } from "@/services/reports.service";
import type { ReportVisualData } from "./types";

export const COURSES_PER_PAGE = 8;

export const REPORT_VISUALS: Record<
    CourseReportType,
    ReportVisualData
> = {
    course_structure: {
        icon: Layers3,
    },
    degree_students: {
        icon: GraduationCap,
    },
    certificate_students: {
        icon: FileCheck2,
    },
    idnumber_students: {
        icon: IdCard,
    },
    payment_students: {
        icon: FileSpreadsheet,
    },
    student_attendance: {
        icon: CalendarCheck,
    },
    practice_lessons: {
        icon: BookOpen,
    },
    final_grades: {
        icon: TrendingUp,
    },
    teacher_attendance: {
        icon: UserCheck,
    },
    student_surveys: {
        icon: Users,
    },
    professor_surveys: {
        icon: ClipboardList,
    },
    practice_quizz: {
        icon: FileQuestion,
    },
    final_quizz: {
        icon: BadgeCheck,
    },
    mdt_certificates: {
        icon: ShieldCheck,
    },
};
