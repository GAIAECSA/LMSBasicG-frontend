import type {
    CatalogFilter,
    LevelFilter,
} from "./types";

export const STUDENT_ROLE_ID = 4;

/*
    Cambia este valor a true solamente si tu backend debe aprobar
    automáticamente los cursos gratuitos.

    En false, todas las solicitudes pasan primero por revisión
    administrativa, igual que las matrículas pagadas.
*/
export const AUTO_APPROVE_FREE_ENROLLMENTS = false;

export const CATALOG_FILTERS: Array<{
    value: CatalogFilter;
    label: string;
}> = [
    { value: "all", label: "Todos" },
    { value: "free", label: "Gratuitos" },
    { value: "paid", label: "Pagados" },
    { value: "open", label: "Matrícula abierta" },
    { value: "offers", label: "Ofertas" },
];

export const LEVEL_FILTERS: Array<{
    value: LevelFilter;
    label: string;
}> = [
    { value: "all", label: "Todos los niveles" },
    { value: "PRINCIPIANTE", label: "Principiante" },
    { value: "INTERMEDIO", label: "Intermedio" },
    { value: "AVANZADO", label: "Avanzado" },
];
