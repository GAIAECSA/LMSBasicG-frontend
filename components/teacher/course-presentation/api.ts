import {
    API_BASE_URL,
} from "./constants";
import type {
    ApiCourse,
} from "./types";
import {
    normalizeCourse,
} from "./utils";

export async function getCourseById(
    courseId: string,
) {
    const numericCourseId =
        Number(courseId);

    if (
        !Number.isFinite(
            numericCourseId,
        )
    ) {
        return null;
    }

    try {
        const responseById =
            await fetch(
                `${API_BASE_URL}/courses/${numericCourseId}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                    cache: "no-store",
                },
            );

        if (responseById.ok) {
            const course =
                (await responseById.json()) as ApiCourse;

            return normalizeCourse(
                course,
            );
        }
    } catch {
        // Si el endpoint individual no existe,
        // se intenta con el listado general.
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/courses/`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                    cache: "no-store",
                },
            );

        if (!response.ok) {
            return null;
        }

        const courses =
            (await response.json()) as ApiCourse[];

        const course =
            Array.isArray(courses)
                ? courses.find(
                    (item) =>
                        Number(
                            item.id,
                        ) ===
                        numericCourseId,
                )
                : null;

        return course
            ? normalizeCourse(
                course,
            )
            : null;
    } catch {
        return null;
    }
}