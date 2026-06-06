export type SupportCategory =
    | "Cuenta de usuario"
    | "Acceso a cursos"
    | "Matrículas"
    | "Certificados"
    | "Calificaciones"
    | "Problema técnico"
    | "Otro";

export type SupportFormState = {
    subject: string;
    category: SupportCategory;
    message: string;
};

export type SupportFeature = {
    key: "technical" | "academic" | "security";
    title: string;
    description: string;
};

export type SupportChannel = {
    key: "email" | "phone" | "chat";
    label: string;
    value: string;
};

export type QuickQuestion = {
    question: string;
    answer: string;
};
