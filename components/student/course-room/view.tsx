"use client";

import {
    useEffect,
} from "react";

import {
    Alert,
} from "./ui/Alert";

import {
    Breadcrumb,
} from "./ui/Breadcrumb";

import {
    CourseHero,
} from "./ui/CourseHero";

import {
    Loading,
} from "./ui/Loading";

import {
    Tabs,
} from "./ui/Tabs";

import {
    TopActions,
} from "./ui/TopActions";

import {
    ActivitiesTab,
} from "./ui/tabs/ActivitiesTab";

import {
    AttendanceTab,
} from "./ui/tabs/AttendanceTab";

import {
    CertificateTab,
} from "./ui/tabs/CertificateTab";

import {
    ContentTab,
} from "./ui/tabs/ContentTab";

import {
    ForumTab,
} from "./ui/tabs/ForumTab";

import {
    GradesTab,
} from "./ui/tabs/GradesTab";

import {
    MdtCertificateTab,
} from "./ui/tabs/MdtCertificateTab";

import {
    MdtRequiredFilesTab,
} from "./ui/tabs/MdtRequiredFilesTab";

import {
    SummaryTab,
} from "./ui/tabs/SummaryTab";

import {
    SurveyTab,
} from "./ui/tabs/SurveyTab";

import {
    useCourseRoom,
} from "./hook";

import type {
    StudentMoocCourseViewProps,
} from "./types";

import {
    getLessonItemType,
} from "./utils";

type AnyRecord =
    Record<string, unknown>;

function toBoolean(
    value: unknown,
) {
    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        return value === 1;
    }

    if (
        typeof value === "string"
    ) {
        const normalized =
            value
                .trim()
                .toLowerCase();

        return [
            "true",
            "1",
            "yes",
            "si",
            "sí",
            "mdt",
        ].includes(normalized);
    }

    return false;
}

function readBoolean(
    record: unknown,
    keys: string[],
) {
    if (
        !record ||
        typeof record !== "object"
    ) {
        return false;
    }

    const currentRecord =
        record as AnyRecord;

    for (
        const key of keys
    ) {
        if (
            key in currentRecord
        ) {
            return toBoolean(
                currentRecord[
                key
                ],
            );
        }
    }

    return false;
}

function getIsMdtCourse(
    room: unknown,
) {
    if (
        !room ||
        typeof room !== "object"
    ) {
        return false;
    }

    const record =
        room as AnyRecord;

    const possibleKeys = [
        "is_mdt",
        "isMdt",
        "isMdtCourse",
        "mdt",
        "course_is_mdt",
        "courseIsMdt",
    ];

    return (
        readBoolean(
            record,
            possibleKeys,
        ) ||
        readBoolean(
            record.course,
            possibleKeys,
        ) ||
        readBoolean(
            record.selectedCourse,
            possibleKeys,
        ) ||
        readBoolean(
            record.currentCourse,
            possibleKeys,
        ) ||
        readBoolean(
            record.courseData,
            possibleKeys,
        )
    );
}

export function CourseRoomView({
    courseId,
}: StudentMoocCourseViewProps) {
    const room =
        useCourseRoom(courseId);

    const isMdtCourse =
        getIsMdtCourse(room);

    /*
     * El certificado MDT se habilita únicamente
     * cuando todos los bloques del curso fueron
     * completados.
     */
    const canAccessMdtCertificate =
        isMdtCourse &&
        room.courseCompleted;

    const hasForumBlocks =
        room.allBlocks.some(
            (block) =>
                getLessonItemType(
                    block,
                ) === "forum",
        );

    const hasSurveyBlocks =
        room.allBlocks.some(
            (block) =>
                getLessonItemType(
                    block,
                ) === "survey",
        );

    useEffect(() => {
        if (
            room.loading
        ) {
            return;
        }

        const isMdtOnlyTab =
            room.activeTab ===
            "mdtcertificate" ||
            room.activeTab ===
            "mdtrequiredfiles";

        /*
         * Un curso normal no puede abrir
         * pestañas exclusivas del MDT.
         */
        if (
            isMdtOnlyTab &&
            !isMdtCourse
        ) {
            room.setActiveTab(
                "certificate",
            );

            return;
        }

        /*
         * Aunque el estudiante escriba manualmente:
         * ?tab=mdtcertificate
         *
         * no podrá abrir la pestaña hasta completar
         * el 100% del curso.
         */
        if (
            room.activeTab ===
            "mdtcertificate" &&
            !canAccessMdtCertificate
        ) {
            room.setActiveTab(
                "summary",
            );

            return;
        }

        /*
         * Los cursos MDT no utilizan el certificado
         * institucional normal. Cuando el curso esté
         * completo se dirige al certificado MDT.
         * Mientras siga incompleto vuelve al resumen.
         */
        if (
            room.activeTab ===
            "certificate" &&
            isMdtCourse
        ) {
            room.setActiveTab(
                canAccessMdtCertificate
                    ? "mdtcertificate"
                    : "summary",
            );
        }
    }, [
        room.loading,
        room.activeTab,
        room.setActiveTab,
        isMdtCourse,
        canAccessMdtCertificate,
    ]);

    useEffect(() => {
        if (
            room.loading
        ) {
            return;
        }

        const forumIsUnavailable =
            room.activeTab ===
            "forum" &&
            !hasForumBlocks;

        const surveyIsUnavailable =
            room.activeTab ===
            "survey" &&
            !hasSurveyBlocks;

        if (
            forumIsUnavailable ||
            surveyIsUnavailable
        ) {
            room.setActiveTab(
                "content",
            );
        }
    }, [
        room.loading,
        room.activeTab,
        room.setActiveTab,
        hasForumBlocks,
        hasSurveyBlocks,
    ]);

    return (
        <section className="min-h-screen overflow-x-hidden bg-[var(--background)] px-3 py-3 pt-16 text-[var(--foreground)] sm:px-4 sm:py-4 md:px-5 md:pt-4 lg:px-6 xl:px-7 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full min-w-0 max-w-[1450px]">
                <div className="mb-3 flex min-w-0 flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <Breadcrumb
                        courseName={
                            room.courseName
                        }
                    />

                    <TopActions
                        studentInitials={
                            room.studentInitials
                        }
                        isRefreshing={
                            room.isRefreshing
                        }
                        onRefresh={() => {
                            void room.reloadCourse();
                        }}
                    />
                </div>

                {room.errorMessage ? (
                    <div className="mb-3 sm:mb-4">
                        <Alert
                            message={
                                room.errorMessage
                            }
                        />
                    </div>
                ) : null}

                {room.loading ? (
                    <Loading />
                ) : (
                    <>
                        <CourseHero
                            room={
                                room
                            }
                            isMdtCourse={
                                isMdtCourse
                            }
                        />

                        <div className="mt-3 min-w-0 sm:mt-4">
                            <Tabs
                                activeTab={
                                    room.activeTab
                                }
                                onChange={
                                    room.setActiveTab
                                }
                                isMdtCourse={
                                    isMdtCourse
                                }
                                hasForum={
                                    hasForumBlocks
                                }
                                hasSurvey={
                                    hasSurveyBlocks
                                }
                                canAccessMdtCertificate={
                                    canAccessMdtCertificate
                                }
                            />
                        </div>

                        <div className="mt-3 min-w-0 sm:mt-4">
                            {room.activeTab ===
                                "summary" ? (
                                <SummaryTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {room.activeTab ===
                                "content" ? (
                                <ContentTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {room.activeTab ===
                                "activities" ? (
                                <ActivitiesTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {room.activeTab ===
                                "forum" ? (
                                <ForumTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {room.activeTab ===
                                "survey" ? (
                                <SurveyTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {room.activeTab ===
                                "grades" ? (
                                <GradesTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {room.activeTab ===
                                "attendance" ? (
                                <AttendanceTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {!isMdtCourse &&
                                room.activeTab ===
                                "certificate" ? (
                                <CertificateTab
                                    room={
                                        room
                                    }
                                />
                            ) : null}

                            {canAccessMdtCertificate &&
                                room.activeTab ===
                                "mdtcertificate" ? (
                                <MdtCertificateTab
                                    room={
                                        room
                                    }
                                    isMdtCourse={
                                        isMdtCourse
                                    }
                                    courseId={
                                        room.numericCourseId
                                    }
                                    studentIdNumber={
                                        room.studentIdNumber
                                    }
                                />
                            ) : null}

                            {isMdtCourse &&
                                room.activeTab ===
                                "mdtrequiredfiles" ? (
                                <MdtRequiredFilesTab
                                    room={
                                        room
                                    }
                                    isMdtCourse={
                                        isMdtCourse
                                    }
                                    courseId={
                                        room.numericCourseId
                                    }
                                    enrollmentId={
                                        room.enrollmentId
                                    }
                                    studentIdNumber={
                                        room.studentIdNumber
                                    }
                                />
                            ) : null}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

export default CourseRoomView;