import { EMPTY_PROFILE_FORM } from "./constants";
import type {
    ProfileAuthUser,
    ProfileFormState,
} from "./types";

export function getRoleLabel(
    user: ProfileAuthUser | null,
) {
    if (!user) return "Usuario";

    if (user.role === "admin") {
        return "Administrador";
    }

    if (user.role === "teacher") {
        return "Docente";
    }

    if (user.role === "student") {
        return "Estudiante";
    }

    return "Usuario";
}

export function getInitials(
    firstname: string,
    lastname: string,
    username: string,
) {
    const first =
        firstname.trim().charAt(0);

    const last =
        lastname.trim().charAt(0);

    const initials =
        `${first}${last}`.trim();

    if (initials) {
        return initials.toUpperCase();
    }

    return (
        username
            .trim()
            .slice(0, 2)
            .toUpperCase() || "US"
    );
}

export function mapUserToProfileForm(
    user?: ProfileAuthUser | null,
): ProfileFormState {
    if (!user) {
        return EMPTY_PROFILE_FORM;
    }

    return {
        username: user.username ?? "",
        idnumber: user.idnumber ?? "",
        firstname: user.firstname ?? "",
        lastname: user.lastname ?? "",
        email: user.email ?? "",
        phone_number:
            user.phone_number ?? "",
        departament:
            user.departament ?? "",
        password: "",
    };
}

export function getProfileErrorMessage(
    error: unknown,
    fallbackMessage: string,
) {
    return error instanceof Error
        ? error.message
        : fallbackMessage;
}
