export type TeacherStatus = "Activo" | "Inactivo";
export type StudentStatus = "Activo" | "Inactivo" | "Suspendido";
export type CourseStatus = "Activo" | "Borrador" | "Finalizado";
export type ContentType = "video" | "texto";
export type AssignmentStatus = "Borrador" | "Publicada" | "Cerrada";
export type GradeStatus = "Aprobado" | "Supletorio" | "Reprobado";

export interface Teacher {
    id: string;
    name: string;
    email: string;
    specialty: string;
    status: TeacherStatus;
}

export interface Student {
    id: string;
    name: string;
    email: string;
    career: string;
    status: StudentStatus;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    teacherId: string;
    teacherName: string;
    status: CourseStatus;
}

export interface Enrollment {
    id: string;
    courseId: string;
    studentId: string;
}

export interface CourseContent {
    id: string;
    courseId: string;
    type: ContentType;
    title: string;
    value: string;
    published: boolean;
}

export interface Assignment {
    id: string;
    courseId: string;
    title: string;
    dueDate: string;
    status: AssignmentStatus;
}

export interface Grade {
    id: string;
    courseId: string;
    assignmentId: string;
    studentId: string;
    grade: number;
    status: GradeStatus;
    feedback: string;
}

export interface LmsDb {
    teachers: Teacher[];
    students: Student[];
    courses: Course[];
    enrollments: Enrollment[];
    contents: CourseContent[];
    assignments: Assignment[];
    grades: Grade[];
}