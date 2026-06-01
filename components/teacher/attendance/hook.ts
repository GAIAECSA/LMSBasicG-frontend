"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createCourseAttendance,
    deleteCourseAttendance,
    getAttendancesByCourseAttendance,
    getCourseAttendancesByCourse,
    updateAttendance,
    updateCourseAttendance,
    type Attendance,
    type AttendanceState,
    type CourseAttendance,
} from "@/services/attendance.service";
import { ATTENDANCE_STATUS_OPTIONS } from "./constants";
import type {
    AttendanceFormState,
    AttendanceModalMode,
    AttendanceSummary,
    TeacherAttendanceWorkspaceProps,
} from "./types";
import {
    buildFormFromSession,
    buildInitialForm,
    getErrorMessage,
    getStudentName,
    normalizeTimeForApi,
    sortAttendancesByStudent,
    sortSessionsByDateDesc,
} from "./utils";

export function useAttendance({
    courseId,
}: TeacherAttendanceWorkspaceProps) {
    const numericCourseId = Number(courseId);

    const [sessions, setSessions] = useState<CourseAttendance[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingAttendances, setIsLoadingAttendances] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [updatingAttendanceId, setUpdatingAttendanceId] = useState<
        number | null
    >(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const [modalMode, setModalMode] = useState<AttendanceModalMode | null>(
        null,
    );
    const [formState, setFormState] = useState<AttendanceFormState>(
        buildInitialForm(),
    );
    const [editingSession, setEditingSession] =
        useState<CourseAttendance | null>(null);
    const [deleteSession, setDeleteSession] =
        useState<CourseAttendance | null>(null);

    const selectedSession = useMemo(
        () =>
            sessions.find(
                (session) => String(session.id) === selectedSessionId,
            ) ?? null,
        [sessions, selectedSessionId],
    );

    const filteredAttendances = useMemo(() => {
        const cleanSearchTerm = searchTerm.trim().toLowerCase();

        if (!cleanSearchTerm) return attendances;

        return attendances.filter((attendance: Attendance) => {
            const studentName = getStudentName(attendance).toLowerCase();
            const status = String(attendance.state).toLowerCase();

            return (
                studentName.includes(cleanSearchTerm) ||
                status.includes(cleanSearchTerm) ||
                String(attendance.enrollment_id).includes(cleanSearchTerm)
            );
        });
    }, [attendances, searchTerm]);

    const summary = useMemo<AttendanceSummary>(() => {
        const total = attendances.length;

        const countByStatus = ATTENDANCE_STATUS_OPTIONS.reduce<
            Record<string, number>
        >((accumulator, option) => {
            accumulator[option.value] = attendances.filter(
                (attendance: Attendance) =>
                    attendance.state === option.value,
            ).length;

            return accumulator;
        }, {});

        return {
            total,
            present: countByStatus.PRESENTE ?? 0,
            absent: countByStatus.AUSENTE ?? 0,
            late: countByStatus.ATRASO ?? 0,
            pending: countByStatus.PENDIENTE ?? 0,
            justified: countByStatus.JUSTIFICADO ?? 0,
        };
    }, [attendances]);

    const backHref = `/teacher/courses/${numericCourseId}`;

    const loadSessions = useCallback(
        async (preferredSessionId?: string) => {
            if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
                setSessions([]);
                setSelectedSessionId("");
                throw new Error("ID del curso no válido.");
            }

            const data = await getCourseAttendancesByCourse(numericCourseId);
            const orderedSessions = sortSessionsByDateDesc(data);

            setSessions(orderedSessions);

            const nextSelectedSessionId =
                preferredSessionId ||
                selectedSessionId ||
                String(orderedSessions[0]?.id ?? "");

            const sessionExists = orderedSessions.some(
                (session: CourseAttendance) =>
                    String(session.id) === nextSelectedSessionId,
            );

            setSelectedSessionId(sessionExists ? nextSelectedSessionId : "");
        },
        [numericCourseId, selectedSessionId],
    );

    const loadAttendances = useCallback(async (sessionId: string) => {
        if (!sessionId) {
            setAttendances([]);
            return;
        }

        try {
            setIsLoadingAttendances(true);
            setActionError("");

            const data = await getAttendancesByCourseAttendance(
                Number(sessionId),
            );

            setAttendances(sortAttendancesByStudent(data));
        } catch (error) {
            setAttendances([]);
            setActionError(getErrorMessage(error));
        } finally {
            setIsLoadingAttendances(false);
        }
    }, []);

    const refreshAll = useCallback(
        async (preferredSessionId?: string) => {
            try {
                setIsLoading(true);
                setErrorMessage("");
                setActionError("");

                await loadSessions(preferredSessionId);
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
                setSessions([]);
                setAttendances([]);
            } finally {
                setIsLoading(false);
            }
        },
        [loadSessions],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void refreshAll();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [numericCourseId, refreshAll]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadAttendances(selectedSessionId);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [selectedSessionId, loadAttendances]);

    function openCreateModal() {
        setModalMode("create");
        setEditingSession(null);
        setFormState(buildInitialForm());
        setActionError("");
    }

    function openEditModal(session: CourseAttendance) {
        setModalMode("edit");
        setEditingSession(session);
        setFormState(buildFormFromSession(session));
        setActionError("");
    }

    function closeModal() {
        if (isSaving) return;

        setModalMode(null);
        setEditingSession(null);
        setFormState(buildInitialForm());
    }

    function closeModalForce() {
        setModalMode(null);
        setEditingSession(null);
        setFormState(buildInitialForm());
    }

    async function handleSubmitSession(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!formState.day) {
            setActionError("Selecciona la fecha de la asistencia.");
            return;
        }

        if (!formState.start_time || !formState.end_time) {
            setActionError("Ingresa hora de inicio y hora de fin.");
            return;
        }

        try {
            setIsSaving(true);
            setActionError("");

            const payload = {
                course_id: numericCourseId,
                day: formState.day,
                start_time: normalizeTimeForApi(formState.start_time),
                end_time: normalizeTimeForApi(formState.end_time),
            };

            if (modalMode === "create") {
                const createdSession = await createCourseAttendance(payload);

                closeModalForce();
                await refreshAll(String(createdSession.id));
                setSelectedSessionId(String(createdSession.id));
                return;
            }

            if (modalMode === "edit" && editingSession) {
                const updatedSession = await updateCourseAttendance(
                    editingSession.id,
                    payload,
                );

                closeModalForce();
                await refreshAll(String(updatedSession.id));
                setSelectedSessionId(String(updatedSession.id));
            }
        } catch (error) {
            setActionError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteSession() {
        if (!deleteSession) return;

        try {
            setIsSaving(true);
            setActionError("");

            await deleteCourseAttendance(deleteSession.id);

            setDeleteSession(null);
            setSelectedSessionId("");
            await refreshAll();
        } catch (error) {
            setActionError(getErrorMessage(error));
        } finally {
            setIsSaving(false);
        }
    }

    const handleChangeAttendanceStatus = async (
        attendance: Attendance,
        status: AttendanceState,
    ) => {
        if (!attendance.id) return;

        setUpdatingAttendanceId(attendance.id);

        try {
            const updatedAttendance = await updateAttendance(attendance.id, {
                enrollment_id: attendance.enrollment_id,
                course_attendance_id: attendance.course_attendance_id,
                attendance_state: status,
                deleted: attendance.deleted ?? false,
            });

            setAttendances((prev) =>
                prev.map((item) =>
                    item.id === attendance.id
                        ? {
                            ...item,
                            ...updatedAttendance,
                            state: status,
                            attendance_state: status,
                        }
                        : item,
                ),
            );
        } catch (error) {
            console.error("Error actualizando asistencia:", error);
        } finally {
            setUpdatingAttendanceId(null);
        }
    };

    return {
        numericCourseId,
        backHref,

        sessions,
        attendances,
        selectedSessionId,
        selectedSession,
        searchTerm,
        filteredAttendances,
        summary,

        isLoading,
        isLoadingAttendances,
        isSaving,
        updatingAttendanceId,

        errorMessage,
        actionError,

        modalMode,
        formState,
        editingSession,
        deleteSession,

        setSelectedSessionId,
        setSearchTerm,
        setFormState,
        setDeleteSession,

        refreshAll,
        openCreateModal,
        openEditModal,
        closeModal,
        handleSubmitSession,
        handleDeleteSession,
        handleChangeAttendanceStatus,
    };
}

export type AttendanceStateHook = ReturnType<typeof useAttendance>;