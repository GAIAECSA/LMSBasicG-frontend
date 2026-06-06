import {
    getLessonCalendarActivitiesByLessons,
    getLessonsByModule,
    type LessonCalendarActivity,
} from "@/services/lessons.service";
import { getModulesByCourse } from "@/services/modules.service";
import {
    getEnrollmentsByUser,
    type Enrollment,
} from "@/services/enrollments.service";
import {
    getActivityTimestamp,
    readPositiveNumber,
    toRecord,
} from "./utils";

function getEnrollmentCourseId(
    enrollment: Enrollment,
): number | null {
    const record = toRecord(enrollment);
    const course = toRecord(record?.course);

    return readPositiveNumber(
        course?.id,
        record?.course_id,
        record?.courseId,
    );
}

function getEnrollmentRoleId(
    enrollment: Enrollment,
): number | null {
    const record = toRecord(enrollment);
    const role = toRecord(record?.role);

    return readPositiveNumber(
        role?.id,
        record?.role_id,
        record?.roleId,
    );
}

function isApprovedStudentEnrollment(
    enrollment: Enrollment,
) {
    const record = toRecord(enrollment);

    if (!record || record.accepted !== true) {
        return false;
    }

    const roleId = getEnrollmentRoleId(enrollment);

    /*
        role_id = 4 corresponde al estudiante.

        Si el backend no devuelve el rol dentro de la matrícula,
        se permite la matrícula aprobada para mantener compatibilidad.
    */
    return roleId === null || roleId === 4;
}

export async function getStudentCalendarActivities(
    userId: number,
): Promise<LessonCalendarActivity[]> {
    const enrollments = await getEnrollmentsByUser(userId);

    const courseIds = Array.from(
        new Set(
            enrollments
                .filter(isApprovedStudentEnrollment)
                .map(getEnrollmentCourseId)
                .filter(
                    (courseId): courseId is number =>
                        courseId !== null,
                ),
        ),
    );

    if (courseIds.length === 0) {
        return [];
    }

    const activitiesByCourse = await Promise.all(
        courseIds.map(async (courseId) => {
            const modules = await getModulesByCourse(courseId);

            const lessonsByModule = await Promise.all(
                modules.map(async (moduleItem) => {
                    const moduleRecord = toRecord(moduleItem);

                    const moduleId = readPositiveNumber(
                        moduleRecord?.id,
                    );

                    if (!moduleId) return [];

                    return getLessonsByModule(moduleId);
                }),
            );

            const lessonIds = Array.from(
                new Set(
                    lessonsByModule
                        .flat()
                        .map((lessonItem) =>
                            readPositiveNumber(lessonItem.id),
                        )
                        .filter(
                            (lessonId): lessonId is number =>
                                lessonId !== null,
                        ),
                ),
            );

            if (lessonIds.length === 0) {
                return [];
            }

            return getLessonCalendarActivitiesByLessons(
                lessonIds,
                courseId,
            );
        }),
    );

    const activitiesByBlockId = new Map<
        number,
        LessonCalendarActivity
    >();

    activitiesByCourse
        .flat()
        .forEach((activity) => {
            activitiesByBlockId.set(
                activity.lesson_block_id,
                activity,
            );
        });

    return Array.from(activitiesByBlockId.values()).sort(
        (firstActivity, secondActivity) =>
            getActivityTimestamp(firstActivity.date_available) -
            getActivityTimestamp(secondActivity.date_available),
    );
}
