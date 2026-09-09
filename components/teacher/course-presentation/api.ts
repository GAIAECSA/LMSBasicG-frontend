import { API_BASE_URL } from "./constants";

import type {
    ApiCourse,
} from "./types";

import {
    normalizeCourse,
} from "./utils";

const AUTH_STORAGE_KEY = "lmsbasicg_auth";

function getAuthToken(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    const rawSession =
        localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        const parsed =
            JSON.parse(rawSession);

        const token =
            parsed?.accessToken ??
            parsed?.token ??
            parsed?.access_token ??
            parsed?.data?.accessToken ??
            parsed?.data?.token ??
            parsed?.data?.access_token ??
            parsed?.session?.accessToken ??
            parsed?.session?.token ??
            parsed?.session?.access_token;

        return typeof token === "string"
            ? token.replace(/^Bearer\s+/i, "").trim()
            : null;
    } catch {
        return rawSession
            .replace(/^Bearer\s+/i, "")
            .trim();
    }
}

function getHeaders(): HeadersInit {
    const token = getAuthToken();

    return {
        Accept: "application/json",
        ...(token
            ? {
                Authorization: `Bearer ${token}`,
            }
            : {}),
    };
}

export async function getCourseById(
    courseId: string | number,
) {
    const numericCourseId =
        Number(courseId);

    if (
        !Number.isFinite(numericCourseId) ||
        numericCourseId <= 0
    ) {
        console.error(
            "ID de curso inválido:",
            courseId,
        );

        return null;
    }

    /*
     * PRIMER INTENTO:
     * GET /courses/{id}
     */
    try {
        const url =
            `${API_BASE_URL}/courses/${numericCourseId}`;

        console.log(
            "Consultando curso:",
            url,
        );

        const response =
            await fetch(url, {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store",
            });

        console.log(
            "Respuesta curso individual:",
            response.status,
        );

        if (response.ok) {
            const course =
                (await response.json()) as ApiCourse;

            console.log(
                "Curso obtenido:",
                course,
            );

            return normalizeCourse(course);
        }

        const errorText =
            await response.text();

        console.error(
            "Error obteniendo curso individual:",
            response.status,
            errorText,
        );
    } catch (error) {
        console.error(
            "Error consultando curso individual:",
            error,
        );
    }

    /*
     * SEGUNDO INTENTO:
     * GET /courses/
     */
    try {
        const url =
            `${API_BASE_URL}/courses/`;

        const response =
            await fetch(url, {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store",
            });

        console.log(
            "Respuesta listado cursos:",
            response.status,
        );

        if (!response.ok) {
            const errorText =
                await response.text();

            console.error(
                "Error obteniendo cursos:",
                response.status,
                errorText,
            );

            return null;
        }

        const courses =
            (await response.json()) as ApiCourse[];

        console.log(
            "Cursos obtenidos:",
            courses,
        );

        if (!Array.isArray(courses)) {
            return null;
        }

        const course =
            courses.find(
                (item) =>
                    Number(item.id) ===
                    numericCourseId,
            ) ?? null;

        if (!course) {
            console.error(
                `No se encontró el curso ${numericCourseId}`,
            );

            return null;
        }

        return normalizeCourse(course);
    } catch (error) {
        console.error(
            "Error consultando listado de cursos:",
            error,
        );

        return null;
    }
}