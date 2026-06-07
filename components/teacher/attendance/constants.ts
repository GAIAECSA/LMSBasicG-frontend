import type { AttendanceState } from "@/services/attendance.service";
import type { StatusOption } from "./types";

export const ATTENDANCE_STATUS_OPTIONS: StatusOption[] = [
    {
        value: "PENDIENTE",
        label: "Pendiente",
        className: "bg-slate-100 text-slate-700",
    },
    {
        value: "PRESENTE",
        label: "Presente",
        className: "bg-green-50 text-green-700 ring-1 ring-green-200",
    },
    {
        value: "FALTA",
        label: "Falta",
        className: "bg-red-50 text-red-700 ring-1 ring-red-200",
    },
];

export const DEFAULT_ATTENDANCE_STATE: AttendanceState = "PENDIENTE";
