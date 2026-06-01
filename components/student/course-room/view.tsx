"use client";

import { useEffect } from "react";
import { Alert } from "./ui/Alert";
import { Breadcrumb } from "./ui/Breadcrumb";
import { CourseHero } from "./ui/CourseHero";
import { Loading } from "./ui/Loading";
import { Tabs } from "./ui/Tabs";
import { TopActions } from "./ui/TopActions";
import { ActivitiesTab } from "./ui/tabs/ActivitiesTab";
import { AttendanceTab } from "./ui/tabs/AttendanceTab";
import { CertificateTab } from "./ui/tabs/CertificateTab";
import { MdtCertificateTab } from "./ui/tabs/MdtCertificateTab";
import { MdtRequiredFilesTab } from "./ui/tabs/MdtRequiredFilesTab";
import { ContentTab } from "./ui/tabs/ContentTab";
import { ForumTab } from "./ui/tabs/ForumTab";
import { SurveyTab } from "./ui/tabs/SurveyTab";
import { GradesTab } from "./ui/tabs/GradesTab";
import { SummaryTab } from "./ui/tabs/SummaryTab";

import { useCourseRoom } from "./hook";
import type { StudentMoocCourseViewProps } from "./types";
import { getLessonItemType } from "./utils";

type AnyRecord = Record<string, unknown>;

function toBoolean(value: unknown) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        return ["true", "1", "yes", "si", "sí", "mdt"].includes(normalized);
    }

    return false;
}

function readBoolean(record: unknown, keys: string[]) {
    if (!record || typeof record !== "object") return false;

    const currentRecord = record as AnyRecord;

    for (const key of keys) {
        if (key in currentRecord) {
            return toBoolean(currentRecord[key]);
        }
    }

    return false;
}

function getIsMdtCourse(room: unknown) {
    if (!room || typeof room !== "object") return false;

    const record = room as AnyRecord;

    const possibleKeys = [
        "is_mdt",
        "isMdt",
        "isMdtCourse",
        "mdt",
        "course_is_mdt",
        "courseIsMdt",
    ];

    return (
        readBoolean(record, possibleKeys) ||
        readBoolean(record.course, possibleKeys) ||
        readBoolean(record.selectedCourse, possibleKeys) ||
        readBoolean(record.currentCourse, possibleKeys) ||
        readBoolean(record.courseData, possibleKeys)
    );
}

export function CourseRoomView({ courseId }: StudentMoocCourseViewProps) {
    const room = useCourseRoom(courseId);
    const isMdtCourse = getIsMdtCourse(room);

    const hasForumBlocks = room.allBlocks.some(
        (block) => getLessonItemType(block) === "forum",
    );

    const hasSurveyBlocks = room.allBlocks.some(
        (block) => getLessonItemType(block) === "survey",
    );

    useEffect(() => {
        if (room.loading) return;

        const isMdtOnlyTab =
            room.activeTab === "mdtcertificate" ||
            room.activeTab === "mdtrequiredfiles";

        if (isMdtOnlyTab && !isMdtCourse) {
            room.setActiveTab("certificate");
            return;
        }

        if (room.activeTab === "certificate" && isMdtCourse) {
            room.setActiveTab("mdtcertificate");
        }
    }, [room.loading, room.activeTab, room.setActiveTab, isMdtCourse]);

    useEffect(() => {
        if (room.loading) return;

        const forumIsUnavailable =
            room.activeTab === "forum" && !hasForumBlocks;

        const surveyIsUnavailable =
            room.activeTab === "survey" && !hasSurveyBlocks;

        if (forumIsUnavailable || surveyIsUnavailable) {
            room.setActiveTab("content");
        }
    }, [
        room.loading,
        room.activeTab,
        room.setActiveTab,
        hasForumBlocks,
        hasSurveyBlocks,
    ]);

    return (
        <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-6 xl:px-10">
            <div className="mx-auto w-full max-w-[1500px]">
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <Breadcrumb courseName={room.courseName} />

                    <TopActions studentInitials={room.studentInitials} />
                </div>

                {room.errorMessage ? (
                    <Alert message={room.errorMessage} />
                ) : null}

                {room.loading ? (
                    <Loading />
                ) : (
                    <>
                        <CourseHero room={room} />

                        <div className="mt-5">
                            <Tabs
                                activeTab={room.activeTab}
                                onChange={room.setActiveTab}
                                isMdtCourse={isMdtCourse}
                                hasForum={hasForumBlocks}
                                hasSurvey={hasSurveyBlocks}
                            />
                        </div>

                        <div className="mt-5">
                            {room.activeTab === "summary" ? (
                                <SummaryTab room={room} />
                            ) : null}

                            {room.activeTab === "content" ? (
                                <ContentTab room={room} />
                            ) : null}

                            {room.activeTab === "activities" ? (
                                <ActivitiesTab room={room} />
                            ) : null}

                            {room.activeTab === "forum" ? (
                                <ForumTab room={room} />
                            ) : null}

                            {room.activeTab === "survey" ? (
                                <SurveyTab room={room} />
                            ) : null}

                            {room.activeTab === "grades" ? (
                                <GradesTab room={room} />
                            ) : null}

                            {room.activeTab === "attendance" ? (
                                <AttendanceTab room={room} />
                            ) : null}

                            {!isMdtCourse &&
                                room.activeTab === "certificate" ? (
                                <CertificateTab room={room} />
                            ) : null}

                            {isMdtCourse &&
                                room.activeTab === "mdtcertificate" ? (
                                <MdtCertificateTab
                                    room={room}
                                    isMdtCourse={isMdtCourse}
                                    courseId={room.numericCourseId}
                                    studentIdNumber={room.studentIdNumber}
                                />
                            ) : null}

                            {isMdtCourse &&
                                room.activeTab === "mdtrequiredfiles" ? (
                                <MdtRequiredFilesTab
                                    room={room}
                                    isMdtCourse={isMdtCourse}
                                    courseId={room.numericCourseId}
                                    enrollmentId={room.enrollmentId}
                                    studentIdNumber={room.studentIdNumber}
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