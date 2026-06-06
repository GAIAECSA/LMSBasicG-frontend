import type {
    QuickQuestion,
    SupportCategory,
    SupportChannel,
    SupportFeature,
    SupportFormState,
} from "./types";

export const SUPPORT_EMAIL =
    "soporte@lmsbasicg.com";

export const SUPPORT_PHONE =
    "098 000 0000";

export const DEFAULT_SUPPORT_FORM:
    SupportFormState = {
        subject: "",
        category: "Cuenta de usuario",
        message: "",
    };

export const SUPPORT_CATEGORIES:
    SupportCategory[] = [
        "Cuenta de usuario",
        "Acceso a cursos",
        "Matrículas",
        "Certificados",
        "Calificaciones",
        "Problema técnico",
        "Otro",
    ];

export const SUPPORT_FEATURES:
    SupportFeature[] = [
        {
            key: "technical",
            title: "Soporte técnico",
            description:
                "Reporta errores de acceso, cursos, certificados o fallos de funcionamiento.",
        },
        {
            key: "academic",
            title: "Ayuda académica",
            description:
                "Consulta dudas sobre cursos, actividades, calificaciones o acceso al aula.",
        },
        {
            key: "security",
            title: "Cuenta y seguridad",
            description:
                "Solicita apoyo con datos personales, contraseña o problemas de sesión.",
        },
    ];

export const SUPPORT_CHANNELS:
    SupportChannel[] = [
        {
            key: "email",
            label: "Correo",
            value: SUPPORT_EMAIL,
        },
        {
            key: "phone",
            label: "Teléfono",
            value: SUPPORT_PHONE,
        },
        {
            key: "chat",
            label: "Chat interno",
            value: "Desde la plataforma.",
        },
    ];

export const QUICK_QUESTIONS:
    QuickQuestion[] = [
        {
            question:
                "¿No aparece mi curso?",
            answer:
                "Verifica que tu matrícula esté aprobada.",
        },
        {
            question:
                "¿Cuándo sale mi certificado?",
            answer:
                "Cuando completas los requisitos del curso.",
        },
    ];
