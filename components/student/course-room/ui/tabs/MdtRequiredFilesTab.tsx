"use client";

import { MdtRequiredFilesPanel } from "../MdtRequiredFilesPanel";

type AnyRecord = Record<string, unknown>;

type MdtRequiredFilesTabProps = {
    room?: AnyRecord | null;
    isMdtCourse?: boolean;
    courseId?: number | string | null;
    enrollmentId?: number | string | null;
    studentIdNumber?: string | null;
};

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
}

function toBoolean(value: unknown): boolean | null {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (["true", "1", "yes", "si", "sí", "mdt"].includes(normalized)) {
            return true;
        }

        if (["false", "0", "no"].includes(normalized)) {
            return false;
        }
    }

    return null;
}

function readBooleanFromRecord(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        if (key in currentRecord) {
            return toBoolean(currentRecord[key]);
        }
    }

    return null;
}

function getIsMdtCourse(props: MdtRequiredFilesTabProps) {
    if (typeof props.isMdtCourse === "boolean") {
        return props.isMdtCourse;
    }

    const room = toRecord(props.room);
    const course = toRecord(room?.course);

    const keys = ["is_mdt", "isMdt", "isMdtCourse", "mdt"];

    const fromRoom = readBooleanFromRecord(room, keys);

    if (fromRoom !== null) return fromRoom;

    const fromCourse = readBooleanFromRecord(course, keys);

    if (fromCourse !== null) return fromCourse;

    return null;
}

function readNumberFromRecord(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        const value = currentRecord[key];

        if (typeof value === "number" || typeof value === "string") {
            return value;
        }
    }

    return null;
}

function cleanText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

function getStudentIdNumber(props: MdtRequiredFilesTabProps) {
    const room = toRecord(props.room);
    const student = toRecord(room?.student);
    const user = toRecord(room?.user);

    return (
        cleanText(props.studentIdNumber) ||
        cleanText(room?.studentIdNumber) ||
        cleanText(room?.idNumber) ||
        cleanText(room?.id_number) ||
        cleanText(room?.idnumber) ||
        cleanText(room?.cedula) ||
        cleanText(student?.idNumber) ||
        cleanText(student?.id_number) ||
        cleanText(student?.idnumber) ||
        cleanText(student?.cedula) ||
        cleanText(user?.idNumber) ||
        cleanText(user?.id_number) ||
        cleanText(user?.idnumber) ||
        cleanText(user?.cedula)
    );
}

export function MdtRequiredFilesTab(props: MdtRequiredFilesTabProps) {
    const room = toRecord(props.room);
    const course = toRecord(room?.course);

    const isMdtCourse = getIsMdtCourse(props);

    if (isMdtCourse === false) {
        return null;
    }

    return (
        <MdtRequiredFilesPanel
            enabled
            room={props.room}
            courseId={
                props.courseId ??
                readNumberFromRecord(room, [
                    "numericCourseId",
                    "currentCourseId",
                    "courseId",
                    "course_id",
                ]) ??
                readNumberFromRecord(course, ["id", "courseId", "course_id"])
            }
            enrollmentId={
                props.enrollmentId ??
                readNumberFromRecord(room, ["enrollmentId", "enrollment_id"])
            }
            studentIdNumber={getStudentIdNumber(props)}
        />
    );
}

export default MdtRequiredFilesTab;