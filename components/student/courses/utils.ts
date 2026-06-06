import type { Course } from "@/services/courses.service";
import type { Enrollment } from "@/services/enrollments.service";
import {
    getProgressByEnrollment,
    type BlockProgress,
} from "@/services/progress.service";
import {
    API_BASE_URL,
    ROLE_ID_STUDENT,
    ROLE_ID_TEACHER,
} from "./constants";
import type {
    CourseAccessRole,
    CourseFilter,
    CourseProgressMap,
    CourseWithExtraFields,
    EnrollmentWithExtraFields,
    SessionUserWithRole,
} from "./types";

export function readRecord(value: unknown) {
    if (!value || typeof value !== "object") {
        return null;
    }

    return value as Record<string, unknown>;
}

export function toNumericId(value: unknown) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value)
            ? value
            : null;
    }

    if (typeof value === "string") {
        const cleanValue = value
            .replace("%", "")
            .trim();

        if (!cleanValue) return null;

        const numericValue =
            Number(cleanValue);

        return Number.isFinite(
            numericValue,
        )
            ? numericValue
            : null;
    }

    return null;
}

export function toText(
    value: unknown,
): string {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(value).trim();
    }

    if (typeof value === "object") {
        const record =
            value as Record<
                string,
                unknown
            >;

        return (
            toText(record.name) ||
            toText(record.title) ||
            toText(record.label)
        );
    }

    return "";
}

export function cleanText(
    value: unknown,
) {
    return toText(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function clampProgress(
    value: number,
) {
    return Math.max(
        0,
        Math.min(
            100,
            Math.round(value),
        ),
    );
}

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

export function getInitials(
    name: string,
) {
    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return "US";
    }

    if (words.length === 1) {
        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function normalizeResourceUrl(
    url?: string | null,
) {
    if (!url) return "";

    const cleanUrl =
        String(url).trim();

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith(
            "http://",
        ) ||
        cleanUrl.startsWith(
            "https://",
        ) ||
        cleanUrl.startsWith(
            "data:image/",
        )
    ) {
        return cleanUrl;
    }

    if (
        cleanUrl.startsWith("/")
    ) {
        return `${API_BASE_URL}${cleanUrl}`;
    }

    return `${API_BASE_URL}/${cleanUrl.replace(
        /^\/+/,
        "",
    )}`;
}

export function getCourseImage(
    course: CourseWithExtraFields | null,
) {
    if (!course) return "";

    return normalizeResourceUrl(
        course.image_url ||
            course.course_image_url ||
            course.image ||
            course.thumbnail ||
            "",
    );
}

export function getCourseCategory(
    course: CourseWithExtraFields | null,
) {
    if (!course) {
        return "Curso académico";
    }

    return (
        cleanText(
            course.subcategory_name,
        ) ||
        cleanText(
            course.category_name,
        ) ||
        cleanText(
            course.subcategory,
        ) ||
        cleanText(
            course.category,
        ) ||
        "Curso académico"
    );
}

export function getEnrollmentCourseId(
    enrollment: Enrollment,
) {
    const value =
        enrollment as EnrollmentWithExtraFields;

    return Number(
        value.course?.id ??
            value.course_id ??
            0,
    );
}

export function getCourseTitle(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
) {
    const value =
        enrollment as EnrollmentWithExtraFields;

    return (
        cleanText(
            value.course?.name,
        ) ||
        cleanText(course?.name) ||
        "Curso"
    );
}

export function getCourseDescription(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
) {
    const value =
        enrollment as EnrollmentWithExtraFields;

    return (
        cleanText(
            value.course?.description,
        ) ||
        cleanText(
            course?.description,
        ) ||
        "Curso disponible en tu aula virtual."
    );
}

export function getCourseAccessRole(
    enrollment: Enrollment,
    sessionUser:
        | SessionUserWithRole
        | undefined,
    currentUserId: number,
): CourseAccessRole {
    const enrollmentRecord =
        readRecord(enrollment);

    const userRecord = readRecord(
        (
            enrollment as EnrollmentWithExtraFields
        ).user,
    );

    const sessionRecord =
        readRecord(sessionUser);

    const teacherIds = [
        enrollmentRecord?.teacher_id,
        enrollmentRecord?.teacher_user_id,
        enrollmentRecord?.docente_id,
    ];

    const isTeacherById =
        currentUserId > 0 &&
        teacherIds.some(
            (value) =>
                toNumericId(value) ===
                currentUserId,
        );

    if (
        (
            enrollment as EnrollmentWithExtraFields
        ).is_teacher === true
    ) {
        return "teacher";
    }

    if (isTeacherById) {
        return "teacher";
    }

    const roleId =
        toNumericId(
            enrollmentRecord?.course_role_id,
        ) ??
        toNumericId(
            enrollmentRecord?.user_course_role_id,
        ) ??
        toNumericId(
            enrollmentRecord?.role_id,
        ) ??
        toNumericId(
            enrollmentRecord?.user_role_id,
        ) ??
        toNumericId(
            userRecord?.role_id,
        ) ??
        toNumericId(
            sessionRecord?.role_id,
        ) ??
        toNumericId(
            sessionRecord?.roleId,
        );

    const roleText = [
        toText(
            enrollmentRecord?.course_role,
        ),
        toText(
            enrollmentRecord?.user_course_role,
        ),
        toText(
            enrollmentRecord?.role,
        ),
        toText(
            enrollmentRecord?.user_role,
        ),
        toText(userRecord?.role),
        toText(sessionRecord?.role),
    ]
        .join(" ")
        .toLowerCase();

    if (
        roleId === ROLE_ID_TEACHER ||
        roleText.includes("docente") ||
        roleText.includes("teacher") ||
        roleText.includes("profesor")
    ) {
        return "teacher";
    }

    if (
        roleId === ROLE_ID_STUDENT ||
        roleText.includes(
            "estudiante",
        ) ||
        roleText.includes("student")
    ) {
        return "student";
    }

    return "student";
}

export function isActiveUserCourseEnrollment(
    enrollment: Enrollment,
    sessionUser:
        | SessionUserWithRole
        | undefined,
    currentUserId: number,
) {
    const courseId =
        getEnrollmentCourseId(
            enrollment,
        );

    if (courseId <= 0) {
        return false;
    }

    const accessRole =
        getCourseAccessRole(
            enrollment,
            sessionUser,
            currentUserId,
        );

    const accepted = (
        enrollment as EnrollmentWithExtraFields
    ).accepted;

    if (
        accessRole === "teacher"
    ) {
        return accepted !== false;
    }

    return accepted === true;
}

export function getUniqueActiveCourseEnrollments(
    enrollments: Enrollment[],
    sessionUser:
        | SessionUserWithRole
        | undefined,
    currentUserId: number,
) {
    const result: Enrollment[] = [];
    const seen = new Set<string>();

    enrollments.forEach(
        (enrollment) => {
            if (
                !isActiveUserCourseEnrollment(
                    enrollment,
                    sessionUser,
                    currentUserId,
                )
            ) {
                return;
            }

            const courseId =
                getEnrollmentCourseId(
                    enrollment,
                );

            const accessRole =
                getCourseAccessRole(
                    enrollment,
                    sessionUser,
                    currentUserId,
                );

            const key =
                `${courseId}-${accessRole}`;

            if (seen.has(key)) return;

            seen.add(key);
            result.push(enrollment);
        },
    );

    return result;
}

export function getCourseBlockIds(
    course: CourseWithExtraFields | null,
) {
    const blockIds =
        new Set<number>();

    const visitedObjects =
        new Set<object>();

    const blockCollectionKeys =
        new Set([
            "blocks",
            "lesson_blocks",
            "lessonBlocks",
            "content_blocks",
            "contentBlocks",
        ]);

    function visit(
        value: unknown,
        parentKey = "",
    ) {
        if (
            !value ||
            typeof value !== "object"
        ) {
            return;
        }

        if (
            visitedObjects.has(
                value as object,
            )
        ) {
            return;
        }

        visitedObjects.add(
            value as object,
        );

        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (
                    blockCollectionKeys.has(
                        parentKey,
                    ) &&
                    item &&
                    typeof item ===
                        "object"
                ) {
                    const record =
                        item as Record<
                            string,
                            unknown
                        >;

                    const blockId =
                        toNumericId(
                            record.id,
                        ) ??
                        toNumericId(
                            record.lesson_block_id,
                        ) ??
                        toNumericId(
                            record.block_id,
                        );

                    if (
                        blockId !== null &&
                        blockId > 0
                    ) {
                        blockIds.add(
                            blockId,
                        );
                    }
                }

                visit(
                    item,
                    parentKey,
                );
            });

            return;
        }

        Object.entries(
            value as Record<
                string,
                unknown
            >,
        ).forEach(
            ([key, nestedValue]) => {
                visit(
                    nestedValue,
                    key,
                );
            },
        );
    }

    visit(course);

    return blockIds;
}

export function getStoredProgressFallback(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
) {
    const enrollmentRecord =
        readRecord(enrollment);

    const courseRecord =
        readRecord(course);

    const candidates = [
        enrollmentRecord?.progress_percent,
        enrollmentRecord?.progress,
        enrollmentRecord?.percentage,
        enrollmentRecord?.course_progress,
        enrollmentRecord?.completed_percentage,
        courseRecord?.progress_percent,
        courseRecord?.progress,
        courseRecord?.percentage,
        courseRecord?.course_progress,
    ]
        .map(toNumericId)
        .filter(
            (
                value,
            ): value is number =>
                value !== null,
        );

    if (candidates.length > 0) {
        return clampProgress(
            candidates[0],
        );
    }

    const statusText = [
        toText(
            enrollmentRecord?.status,
        ),
        toText(courseRecord?.status),
    ]
        .join(" ")
        .toLowerCase();

    if (
        enrollmentRecord?.completed ===
            true ||
        enrollmentRecord?.is_completed ===
            true ||
        statusText.includes(
            "completado",
        ) ||
        statusText.includes(
            "completed",
        )
    ) {
        return 100;
    }

    return 0;
}

export function calculateCourseProgress(
    progressRecords: BlockProgress[],
    course: CourseWithExtraFields | null,
    fallbackProgress: number,
) {
    if (
        !Array.isArray(
            progressRecords,
        ) ||
        progressRecords.length === 0
    ) {
        return fallbackProgress;
    }

    const courseBlockIds =
        getCourseBlockIds(course);

    const trackedBlockIds =
        new Set(
            progressRecords
                .map((progress) =>
                    Number(
                        progress.lesson_block_id,
                    ),
                )
                .filter(
                    (blockId) =>
                        Number.isFinite(
                            blockId,
                        ) &&
                        blockId > 0,
                ),
        );

    const completedBlockIds =
        new Set(
            progressRecords
                .filter(
                    (progress) =>
                        progress.is_completed ===
                        true,
                )
                .map((progress) =>
                    Number(
                        progress.lesson_block_id,
                    ),
                )
                .filter(
                    (blockId) =>
                        Number.isFinite(
                            blockId,
                        ) &&
                        blockId > 0,
                ),
        );

    const totalBlocks =
        courseBlockIds.size > 0
            ? courseBlockIds.size
            : trackedBlockIds.size;

    if (totalBlocks <= 0) {
        return fallbackProgress;
    }

    const completedBlocks =
        courseBlockIds.size > 0
            ? Array.from(
                  completedBlockIds,
              ).filter((blockId) =>
                  courseBlockIds.has(
                      blockId,
                  ),
              ).length
            : completedBlockIds.size;

    return clampProgress(
        (completedBlocks /
            totalBlocks) *
            100,
    );
}

export async function getProgressMapForEnrollments(
    enrollments: Enrollment[],
    coursesById: Record<
        number,
        CourseWithExtraFields
    >,
    sessionUser:
        | SessionUserWithRole
        | undefined,
    currentUserId: number,
) {
    const entries =
        await Promise.all(
            enrollments.map(
                async (enrollment) => {
                    const enrollmentId =
                        Number(
                            enrollment.id,
                        );

                    const courseId =
                        getEnrollmentCourseId(
                            enrollment,
                        );

                    const course =
                        coursesById[
                            courseId
                        ] ??
                        (
                            enrollment as EnrollmentWithExtraFields
                        ).course ??
                        null;

                    const fallbackProgress =
                        getStoredProgressFallback(
                            enrollment,
                            course,
                        );

                    const accessRole =
                        getCourseAccessRole(
                            enrollment,
                            sessionUser,
                            currentUserId,
                        );

                    if (
                        accessRole ===
                            "teacher" ||
                        !Number.isFinite(
                            enrollmentId,
                        ) ||
                        enrollmentId <= 0
                    ) {
                        return [
                            enrollmentId,
                            fallbackProgress,
                        ] as const;
                    }

                    try {
                        const progressRecords =
                            await getProgressByEnrollment(
                                enrollmentId,
                            );

                        const progress =
                            calculateCourseProgress(
                                progressRecords,
                                course,
                                fallbackProgress,
                            );

                        return [
                            enrollmentId,
                            progress,
                        ] as const;
                    } catch {
                        return [
                            enrollmentId,
                            fallbackProgress,
                        ] as const;
                    }
                },
            ),
        );

    return entries.reduce<CourseProgressMap>(
        (
            accumulator,
            [enrollmentId, progress],
        ) => {
            if (
                Number.isFinite(
                    enrollmentId,
                ) &&
                enrollmentId > 0
            ) {
                accumulator[
                    enrollmentId
                ] = progress;
            }

            return accumulator;
        },
        {},
    );
}

export function getResolvedProgress(
    enrollment: Enrollment,
    course: CourseWithExtraFields | null,
    progressByEnrollment: CourseProgressMap,
) {
    const enrollmentId =
        Number(enrollment.id);

    const loadedProgress =
        progressByEnrollment[
            enrollmentId
        ];

    if (
        typeof loadedProgress ===
        "number"
    ) {
        return loadedProgress;
    }

    return getStoredProgressFallback(
        enrollment,
        course,
    );
}

export function getStatusLabel(
    progress: number,
    accessRole: CourseAccessRole,
) {
    if (
        accessRole === "teacher"
    ) {
        return "Docente asignado";
    }

    if (progress >= 100) {
        return "Completado";
    }

    if (progress > 0) {
        return "En progreso";
    }

    return "Matrícula aprobada";
}

export function getAccessRoleLabel(
    accessRole: CourseAccessRole,
) {
    return accessRole === "teacher"
        ? "Docente"
        : "Estudiante";
}

export function getCourseWorkspaceHref(
    courseId: number,
    accessRole: CourseAccessRole,
) {
    if (
        accessRole === "teacher"
    ) {
        return `/teacher/courses/${courseId}`;
    }

    return `/student/courses/${courseId}?tab=summary`;
}

export function getFilteredEnrollments(
    enrollments: Enrollment[],
    coursesById: Record<
        number,
        CourseWithExtraFields
    >,
    progressByEnrollment: CourseProgressMap,
    filter: CourseFilter,
    searchTerm: string,
) {
    const cleanSearchTerm =
        searchTerm
            .trim()
            .toLowerCase();

    return enrollments.filter(
        (enrollment) => {
            const courseId =
                getEnrollmentCourseId(
                    enrollment,
                );

            const course =
                coursesById[
                    courseId
                ] ??
                (
                    enrollment as EnrollmentWithExtraFields
                ).course ??
                null;

            const progress =
                getResolvedProgress(
                    enrollment,
                    course,
                    progressByEnrollment,
                );

            const matchesFilter =
                filter === "all" ||
                (filter ===
                    "progress" &&
                    progress < 100) ||
                (filter ===
                    "completed" &&
                    progress >= 100);

            const searchContent = [
                getCourseTitle(
                    enrollment,
                    course,
                ),
                getCourseDescription(
                    enrollment,
                    course,
                ),
                getCourseCategory(
                    course,
                ),
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                cleanSearchTerm.length ===
                    0 ||
                searchContent.includes(
                    cleanSearchTerm,
                );

            return (
                matchesFilter &&
                matchesSearch
            );
        },
    );
}

export function buildCoursesMap(
    courses: Course[],
) {
    return courses.reduce<
        Record<
            number,
            CourseWithExtraFields
        >
    >((accumulator, course) => {
        const courseId =
            Number(course.id);

        if (courseId > 0) {
            accumulator[
                courseId
            ] =
                course as CourseWithExtraFields;
        }

        return accumulator;
    }, {});
}
