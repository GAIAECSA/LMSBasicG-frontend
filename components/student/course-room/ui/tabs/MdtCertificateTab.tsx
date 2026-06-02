"use client";

import { MdtCertificatePanel } from "../MdtCertificatePanel";

type AnyRecord = Record<string, unknown>;

type MdtCertificateTabProps = {
    room?: AnyRecord | null;
    course?: AnyRecord | null;
    selectedCourse?: AnyRecord | null;
    currentCourse?: AnyRecord | null;
    courseData?: AnyRecord | null;
    isMdtCourse?: boolean;
    is_mdt?: boolean;
    isMdt?: boolean;
    courseId?: number | string | null;
    numericCourseId?: number | string | null;
    currentCourseId?: number | string | null;
    studentIdNumber?: string | null;
    idNumber?: string | null;
    user?: AnyRecord | null;
    student?: AnyRecord | null;
    profile?: AnyRecord | null;
};

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
}

function toBoolean(value: unknown) {
    if (typeof value === "boolean") return value;

    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        return ["true", "1", "yes", "si", "sí", "mdt"].includes(normalized);
    }

    return false;
}

function readBooleanFromRecord(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return false;

    for (const key of keys) {
        if (key in currentRecord) {
            return toBoolean(currentRecord[key]);
        }
    }

    return false;
}

function readValueFromRecord(
    record: unknown,
    keys: string[],
): string | number | null {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        const value = currentRecord[key];

        if (typeof value === "string" || typeof value === "number") {
            return value;
        }
    }

    return null;
}

function getRoomRecord(props: MdtCertificateTabProps) {
    return toRecord(props.room);
}

function getCourseRecord(props: MdtCertificateTabProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.course) ??
        toRecord(props.selectedCourse) ??
        toRecord(props.currentCourse) ??
        toRecord(props.courseData) ??
        toRecord(room?.course) ??
        toRecord(room?.selectedCourse) ??
        toRecord(room?.currentCourse) ??
        toRecord(room?.courseData) ??
        null
    );
}

function getUserRecord(props: MdtCertificateTabProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.user) ??
        toRecord(room?.user) ??
        toRecord(room?.authUser) ??
        toRecord(room?.currentUser) ??
        null
    );
}

function getStudentRecord(props: MdtCertificateTabProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.student) ??
        toRecord(room?.student) ??
        toRecord(room?.studentData) ??
        null
    );
}

function getProfileRecord(props: MdtCertificateTabProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.profile) ??
        toRecord(room?.profile) ??
        toRecord(room?.userProfile) ??
        null
    );
}

function getIsMdtCourse(props: MdtCertificateTabProps) {
    if (typeof props.isMdtCourse === "boolean") return props.isMdtCourse;
    if (typeof props.is_mdt === "boolean") return props.is_mdt;
    if (typeof props.isMdt === "boolean") return props.isMdt;

    const room = getRoomRecord(props);
    const course = getCourseRecord(props);

    const possibleKeys = [
        "is_mdt",
        "isMdt",
        "isMdtCourse",
        "mdt",
        "course_is_mdt",
    ];

    return (
        readBooleanFromRecord(course, possibleKeys) ||
        readBooleanFromRecord(room, possibleKeys)
    );
}

function getCourseId(props: MdtCertificateTabProps) {
    const room = getRoomRecord(props);
    const course = getCourseRecord(props);

    const directValue =
        props.courseId ?? props.numericCourseId ?? props.currentCourseId;

    if (directValue !== undefined && directValue !== null) {
        return directValue;
    }

    return (
        readValueFromRecord(course, ["id", "course_id", "courseId"]) ??
        readValueFromRecord(room, [
            "courseId",
            "course_id",
            "numericCourseId",
            "currentCourseId",
            "selectedCourseId",
        ])
    );
}

function getStudentIdNumber(props: MdtCertificateTabProps) {
    const room = getRoomRecord(props);
    const user = getUserRecord(props);
    const student = getStudentRecord(props);
    const profile = getProfileRecord(props);

    const directValue = props.studentIdNumber ?? props.idNumber;

    if (directValue) return directValue;

    const keys = [
        "idnumber",
        "id_number",
        "identification",
        "identification_number",
        "cedula",
        "dni",
        "document",
        "document_number",
    ];

    return (
        readValueFromRecord(user, keys) ??
        readValueFromRecord(student, keys) ??
        readValueFromRecord(profile, keys) ??
        readValueFromRecord(room, keys) ??
        null
    );
}

export function MdtCertificateTab(props: MdtCertificateTabProps) {
    const isMdtCourse = getIsMdtCourse(props);

    const courseId = getCourseId(props);
    const studentIdNumber = getStudentIdNumber(props);
    const user = getUserRecord(props);
    const student = getStudentRecord(props);
    const profile = getProfileRecord(props);

    if (!isMdtCourse) {
        return null;
    }

    return (
        <div className="mt-4 min-w-0 overflow-hidden sm:mt-5">
            <MdtCertificatePanel
                enabled={isMdtCourse}
                courseId={courseId}
                studentIdNumber={
                    studentIdNumber !== null ? String(studentIdNumber) : null
                }
                user={user}
                student={student}
                profile={profile}
            />
        </div>
    );
}

export default MdtCertificateTab;