import type {
    SupportFormState,
} from "./types";

export function getUserFullName(
    user: unknown,
) {
    if (
        !user ||
        typeof user !== "object"
    ) {
        return "Usuario";
    }

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName =
        `${value.firstname ?? ""} ${
            value.lastname ?? ""
        }`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Usuario"
    );
}

export function getUserEmail(
    user: unknown,
) {
    if (
        !user ||
        typeof user !== "object"
    ) {
        return "";
    }

    const value = user as {
        email?: string;
    };

    return value.email ?? "";
}

export function buildSupportMessage({
    form,
    userName,
    userEmail,
}: {
    form: SupportFormState;
    userName: string;
    userEmail: string;
}) {
    return [
        `Usuario: ${userName}`,
        userEmail
            ? `Correo: ${userEmail}`
            : "",
        `Categoría: ${form.category}`,
        `Asunto: ${form.subject}`,
        "",
        "Detalle:",
        form.message,
    ]
        .filter(Boolean)
        .join("\n");
}
