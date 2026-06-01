import type { CourseTab } from "./types";

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

export const MAX_QUIZ_ATTEMPTS = 3;

export const COURSE_TABS: Array<{ key: CourseTab; label: string }> = [
    { key: "summary", label: "Resumen" },
    { key: "content", label: "Contenido" },
    { key: "activities", label: "Actividades" },
    { key: "forum", label: "Foro" },
    { key: "survey", label: "Encuestas" },
    { key: "grades", label: "Calificaciones" },
    { key: "attendance", label: "Asistencia" },
    { key: "certificate", label: "Certificado" },
    { key: "mdtcertificate", label: "Certificado MDT" },
    { key: "mdtrequiredfiles", label: "Archivos MDT" },
];