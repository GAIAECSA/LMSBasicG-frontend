"use client";

import {
    type ChangeEvent,
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Download,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Upload,
    XCircle,
} from "lucide-react";

import { getAllCourses, type Course } from "@/services/courses.service";
import {
    createMassiveEnrollments,
    type MassiveEnrollmentResponse,
    type MassiveEnrollmentUserPayload,
} from "@/services/enrollments.service";

type BulkEnrollmentRow = MassiveEnrollmentUserPayload & {
    localId: string;
};

type BulkFieldConfig = {
    key: keyof MassiveEnrollmentUserPayload;
    label: string;
    placeholder: string;
    required: boolean;
    className?: string;
};

const BULK_FIELDS: BulkFieldConfig[] = [
    {
        key: "username",
        label: "Usuario",
        placeholder: "jperez",
        required: true,
    },
    {
        key: "password",
        label: "Contraseña",
        placeholder: "123456",
        required: true,
    },
    {
        key: "firstname",
        label: "Nombres",
        placeholder: "Juan",
        required: true,
    },
    {
        key: "lastname",
        label: "Apellidos",
        placeholder: "Pérez",
        required: true,
    },
    {
        key: "idnumber",
        label: "Cédula",
        placeholder: "0102030405",
        required: true,
    },
    {
        key: "email",
        label: "Correo",
        placeholder: "juan@correo.com",
        required: true,
        className: "lg:col-span-2",
    },
    {
        key: "phone_number",
        label: "Teléfono",
        placeholder: "0999999999",
        required: false,
    },
    {
        key: "departament",
        label: "Departamento",
        placeholder: "General",
        required: false,
    },
];

const CSV_HEADER =
    "username,password,firstname,lastname,idnumber,email,phone_number,departament";

const CSV_EXAMPLE = `${CSV_HEADER}
jperez,123456,Juan,Pérez,0102030405,juan@correo.com,0999999999,General
mlopez,123456,María,López,1102030405,maria@correo.com,0988888888,General`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createLocalId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyRow(): BulkEnrollmentRow {
    return {
        localId: createLocalId(),
        username: "",
        password: "",
        firstname: "",
        lastname: "",
        idnumber: "",
        email: "",
        phone_number: "",
        departament: "",
    };
}

function getCourseName(course: Course): string {
    const item = course as Course & {
        name?: string;
        title?: string;
    };

    return item.name || item.title || `Curso #${course.id}`;
}

function normalizeText(value: string): string {
    return String(value ?? "").trim();
}

function normalizeEmail(value: string): string {
    return String(value ?? "").trim().toLowerCase();
}

function hasRowData(row: BulkEnrollmentRow): boolean {
    return (
        normalizeText(row.username).length > 0 ||
        normalizeText(row.password).length > 0 ||
        normalizeText(row.firstname).length > 0 ||
        normalizeText(row.lastname).length > 0 ||
        normalizeText(row.idnumber).length > 0 ||
        normalizeText(row.email).length > 0 ||
        normalizeText(row.phone_number).length > 0 ||
        normalizeText(row.departament).length > 0
    );
}

function normalizeRow(row: BulkEnrollmentRow): MassiveEnrollmentUserPayload {
    return {
        username: normalizeText(row.username),
        password: normalizeText(row.password),
        firstname: normalizeText(row.firstname),
        lastname: normalizeText(row.lastname),
        idnumber: normalizeText(row.idnumber),
        email: normalizeEmail(row.email),
        phone_number: normalizeText(row.phone_number),
        departament: normalizeText(row.departament) || "General",
    };
}

function detectDelimiter(line: string): "," | ";" | "\t" {
    const commaCount = (line.match(/,/g) ?? []).length;
    const semicolonCount = (line.match(/;/g) ?? []).length;
    const tabCount = (line.match(/\t/g) ?? []).length;

    if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) {
        return "\t";
    }

    if (semicolonCount > commaCount) {
        return ";";
    }

    return ",";
}

function parseDelimitedLine(line: string, delimiter: "," | ";" | "\t"): string[] {
    const values: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"' && nextChar === '"') {
            current += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            insideQuotes = !insideQuotes;
            continue;
        }

        if (char === delimiter && !insideQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());

    return values;
}

function isHeaderRow(values: string[]): boolean {
    const normalized = values.map((value) => value.trim().toLowerCase());

    return (
        normalized.includes("username") ||
        normalized.includes("firstname") ||
        normalized.includes("lastname") ||
        normalized.includes("idnumber") ||
        normalized.includes("email")
    );
}

function parseBulkText(text: string): BulkEnrollmentRow[] {
    const cleanText = text.replace(/^\uFEFF/, "").trim();

    if (!cleanText) return [];

    const lines = cleanText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) return [];

    const delimiter = detectDelimiter(lines[0]);
    const firstValues = parseDelimitedLine(lines[0], delimiter);
    const startIndex = isHeaderRow(firstValues) ? 1 : 0;

    return lines.slice(startIndex).map((line) => {
        const values = parseDelimitedLine(line, delimiter);

        return {
            localId: createLocalId(),
            username: values[0] ?? "",
            password: values[1] ?? "",
            firstname: values[2] ?? "",
            lastname: values[3] ?? "",
            idnumber: values[4] ?? "",
            email: values[5] ?? "",
            phone_number: values[6] ?? "",
            departament: values[7] ?? "",
        };
    });
}

function getRepeatedValues(
    rows: MassiveEnrollmentUserPayload[],
    key: keyof MassiveEnrollmentUserPayload,
): Set<string> {
    const counter = new Map<string, number>();

    rows.forEach((row) => {
        const value =
            key === "email"
                ? normalizeEmail(row[key])
                : normalizeText(row[key]).toUpperCase();

        if (!value) return;

        counter.set(value, (counter.get(value) ?? 0) + 1);
    });

    return new Set(
        Array.from(counter.entries())
            .filter(([, count]) => count > 1)
            .map(([value]) => value),
    );
}

function downloadTextFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

function renderUnknownValue(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (value === null || value === undefined) return "-";

    try {
        return JSON.stringify(value);
    } catch {
        return "-";
    }
}

function getResultCount(response: MassiveEnrollmentResponse | null) {
    return {
        created: response?.created.length ?? 0,
        skipped: response?.skipped.length ?? 0,
        failed: response?.failed.length ?? 0,
    };
}

export default function EnrollmentsAdminBulkPanel() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [courses, setCourses] = useState<Course[]>([]);
    const [courseId, setCourseId] = useState("");
    const [courseSearch, setCourseSearch] = useState("");

    const [rows, setRows] = useState<BulkEnrollmentRow[]>([createEmptyRow()]);
    const [result, setResult] = useState<MassiveEnrollmentResponse | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [isRefreshingCourses, setIsRefreshingCourses] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadCourses = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setIsRefreshingCourses(true);
                setError(null);
                setSuccess(null);
            }

            const data = await getAllCourses();
            const courseList = Array.isArray(data) ? data : [];

            setCourses(courseList);

            if (showRefresh) {
                setSuccess("Cursos actualizados correctamente.");
            }
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudieron cargar los cursos.";

            setError(message);
        } finally {
            setIsLoadingCourses(false);
            setIsRefreshingCourses(false);
        }
    }, []);

    const loadInitialCourses = useCallback(async () => {
        try {
            const data = await getAllCourses();
            const courseList = Array.isArray(data) ? data : [];

            setCourses(courseList);
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudieron cargar los cursos.";

            setError(message);
        } finally {
            setIsLoadingCourses(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadInitialCourses();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadInitialCourses]);

    useEffect(() => {
        if (!error && !success) return;

        const timeoutId = window.setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 3500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [error, success]);

    const selectedCourseId = useMemo(() => {
        const numericValue = Number(courseId);

        return Number.isFinite(numericValue) ? numericValue : 0;
    }, [courseId]);

    const selectedCourse = useMemo(() => {
        return (
            courses.find((course) => Number(course.id) === Number(selectedCourseId)) ??
            null
        );
    }, [courses, selectedCourseId]);

    const hasSelectedCourse = selectedCourseId > 0;

    const filteredCourses = useMemo(() => {
        const query = courseSearch.trim().toLowerCase();

        if (!query) return courses;

        return courses.filter((course) =>
            getCourseName(course).toLowerCase().includes(query),
        );
    }, [courses, courseSearch]);

    const validation = useMemo(() => {
        const rowErrors: Record<string, string[]> = {};
        const generalErrors: string[] = [];

        const activeRows = rows.filter(hasRowData);
        const normalizedRows = activeRows.map(normalizeRow);

        if (!Number.isFinite(selectedCourseId) || selectedCourseId <= 0) {
            generalErrors.push("Selecciona un curso para continuar.");
        }

        if (activeRows.length === 0) {
            generalErrors.push("Agrega al menos un estudiante.");
        }

        const repeatedUsernames = getRepeatedValues(normalizedRows, "username");
        const repeatedEmails = getRepeatedValues(normalizedRows, "email");
        const repeatedIdnumbers = getRepeatedValues(normalizedRows, "idnumber");

        activeRows.forEach((row, index) => {
            const normalized = normalizeRow(row);
            const errors: string[] = [];
            const rowNumber = index + 1;

            if (!normalized.username) errors.push("Usuario requerido.");
            if (!normalized.password) errors.push("Contraseña requerida.");
            if (!normalized.firstname) errors.push("Nombres requeridos.");
            if (!normalized.lastname) errors.push("Apellidos requeridos.");
            if (!normalized.idnumber) errors.push("Cédula requerida.");
            if (!normalized.email) errors.push("Correo requerido.");

            if (normalized.email && !EMAIL_REGEX.test(normalized.email)) {
                errors.push("Correo inválido.");
            }

            if (normalized.password && normalized.password.length < 6) {
                errors.push("La contraseña debe tener mínimo 6 caracteres.");
            }

            if (
                normalized.username &&
                repeatedUsernames.has(normalized.username.toUpperCase())
            ) {
                errors.push("Usuario repetido en la lista.");
            }

            if (normalized.email && repeatedEmails.has(normalized.email)) {
                errors.push("Correo repetido en la lista.");
            }

            if (
                normalized.idnumber &&
                repeatedIdnumbers.has(normalized.idnumber.toUpperCase())
            ) {
                errors.push("Cédula repetida en la lista.");
            }

            if (errors.length > 0) {
                rowErrors[row.localId] = errors.map(
                    (message) => `Fila ${rowNumber}: ${message}`,
                );
            }
        });

        return {
            activeRows,
            normalizedRows,
            rowErrors,
            generalErrors,
            canSubmit:
                generalErrors.length === 0 && Object.keys(rowErrors).length === 0,
        };
    }, [rows, selectedCourseId]);

    const resultCount = getResultCount(result);

    function ensureCourseSelected(): boolean {
        if (hasSelectedCourse) return true;

        setError(
            "Primero debes seleccionar el curso donde se matricularán los estudiantes.",
        );
        setSuccess(null);
        setResult(null);

        return false;
    }

    function updateRow(
        localId: string,
        field: keyof MassiveEnrollmentUserPayload,
        value: string,
    ) {
        setRows((currentRows) =>
            currentRows.map((row) =>
                row.localId === localId
                    ? {
                        ...row,
                        [field]: value,
                    }
                    : row,
            ),
        );
    }

    function addRow() {
        if (!ensureCourseSelected()) return;

        setRows((currentRows) => [...currentRows, createEmptyRow()]);
    }

    function handleImportCsvClick() {
        if (!ensureCourseSelected()) return;

        fileInputRef.current?.click();
    }

    function removeRow(localId: string) {
        setRows((currentRows) => {
            const nextRows = currentRows.filter((row) => row.localId !== localId);

            return nextRows.length > 0 ? nextRows : [createEmptyRow()];
        });
    }

    function clearRows() {
        setRows([createEmptyRow()]);
        setResult(null);
        setError(null);
        setSuccess(null);
    }

    function importRowsFromText(text: string) {
        const parsedRows = parseBulkText(text);

        if (parsedRows.length === 0) {
            setError("No se encontraron estudiantes para importar.");
            return;
        }

        setRows((currentRows) => {
            const currentHasData = currentRows.some(hasRowData);

            return currentHasData ? [...currentRows, ...parsedRows] : parsedRows;
        });

        setResult(null);
        setError(null);
        setSuccess(`${parsedRows.length} estudiante(s) agregado(s).`);
    }

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!ensureCourseSelected()) {
            event.target.value = "";
            return;
        }

        try {
            const text = await file.text();

            importRowsFromText(text);
        } catch {
            setError("No se pudo leer el archivo seleccionado.");
        } finally {
            event.target.value = "";
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError(null);
        setSuccess(null);
        setResult(null);

        if (!ensureCourseSelected()) return;

        if (validation.activeRows.length === 0) {
            setError("Agrega o importa al menos un estudiante antes de continuar.");
            return;
        }

        if (Object.keys(validation.rowErrors).length > 0) {
            setError("Revisa los datos marcados antes de ejecutar la matrícula masiva.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await createMassiveEnrollments({
                course_id: selectedCourseId,
                users: validation.normalizedRows,
            });
            const counts = getResultCount(response);

            setResult(response);

            if (counts.created === 0 && counts.failed > 0) {
                setError(
                    "No se pudo matricular ningún estudiante. Revisa el detalle de los registros fallidos.",
                );
            } else if (counts.failed > 0 || counts.skipped > 0) {
                setSuccess(
                    `Proceso finalizado: ${counts.created} creado(s), ${counts.skipped} omitido(s) y ${counts.failed} fallido(s).`,
                );
            } else {
                setSuccess("Todos los estudiantes fueron matriculados correctamente.");
            }
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudo completar la matrícula masiva.";

            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#07111F] via-[#172861] via-[70%] to-[#F97316] p-6 text-white shadow-lg">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">
                            Administración
                        </p>

                        <h1 className="mt-4 text-3xl font-black text-white">
                            Matriculación masiva
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-blue-50">
                            Selecciona un curso disponible, importa estudiantes mediante archivo CSV
                            y ejecuta la matrícula automática desde un solo módulo.
                        </p>

                        {selectedCourse ? (
                            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/15">
                                <BookOpen className="h-4 w-4 text-orange-300" />
                                {getCourseName(selectedCourse)}
                            </div>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
                        <div className="rounded-2xl bg-white/15 px-5 py-4 text-white shadow-sm ring-1 ring-white/10 backdrop-blur">
                            <p className="text-xs font-black uppercase text-blue-100">
                                Total
                            </p>
                            <p className="mt-2 text-3xl font-black">
                                {validation.activeRows.length}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 px-5 py-4 text-white shadow-sm ring-1 ring-white/10 backdrop-blur">
                            <p className="text-xs font-black uppercase text-blue-100">
                                Válidos
                            </p>
                            <p className="mt-2 text-3xl font-black">
                                {validation.canSubmit ? validation.activeRows.length : 0}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 px-5 py-4 text-white shadow-sm ring-1 ring-white/10 backdrop-blur">
                            <p className="text-xs font-black uppercase text-blue-100">
                                Alertas
                            </p>
                            <p className="mt-2 text-3xl font-black">
                                {Object.keys(validation.rowErrors).length +
                                    validation.generalErrors.length}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white/15 px-5 py-4 text-white shadow-sm ring-1 ring-white/10 backdrop-blur">
                            <p className="text-xs font-black uppercase text-blue-100">
                                Cursos
                            </p>
                            <p className="mt-2 text-3xl font-black">
                                {courses.length}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2">
                    <h2 className="text-lg font-black text-slate-950">
                        Selección del curso
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Elige el curso donde se matricularán los estudiantes de la carga masiva.
                    </p>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_1.3fr]">
                        <div>
                            <label className="mb-2 block text-sm font-black text-slate-900">
                                Buscar curso
                            </label>

                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    type="text"
                                    value={courseSearch}
                                    onChange={(event) => setCourseSearch(event.target.value)}
                                    placeholder="Buscar por nombre del curso"
                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#172861] focus:ring-4 focus:ring-blue-50"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="course-id"
                                className="mb-2 block text-sm font-black text-slate-900"
                            >
                                Curso disponible
                            </label>

                            <select
                                id="course-id"
                                value={courseId}
                                onChange={(event) => {
                                    setCourseId(event.target.value);
                                    setError(null);
                                    setSuccess(null);
                                    setResult(null);
                                }}
                                disabled={isLoadingCourses}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#172861] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                                <option value="">
                                    {isLoadingCourses
                                        ? "Cargando cursos..."
                                        : "Selecciona un curso"}
                                </option>

                                {filteredCourses.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {getCourseName(course)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">

                        <button
                            type="button"
                            onClick={() =>
                                downloadTextFile(
                                    "plantilla_matricula_masiva.csv",
                                    CSV_EXAMPLE,
                                )
                            }
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#172861]/15 bg-white px-4 text-sm font-black text-[#172861] shadow-sm transition hover:bg-blue-50"
                        >
                            <Download className="h-4 w-4" />
                            Plantilla CSV
                        </button>

                        <button
                            type="button"
                            onClick={handleImportCsvClick}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#e9702c] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#d9601f]"
                        >
                            <Upload className="h-4 w-4" />
                            Importar CSV
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                </div>

                {!hasSelectedCourse && !isLoadingCourses ? (
                    <div className="mt-4 flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <span>
                            Primero selecciona un curso. Después podrás importar el CSV,
                            agregar filas y ejecutar la matrícula masiva.
                        </span>
                    </div>
                ) : null}
            </section>

            {success ? (
                <div className="flex gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{success}</span>
                </div>
            ) : null}

            {error ? (
                <div className="flex gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{error}</span>
                </div>
            ) : null}

            <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">
                            Estudiantes a matricular
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            Completa los campos obligatorios antes de ejecutar la carga.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-6 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#172861] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                            <Plus className="h-4 w-4" />
                            Fila
                        </button>

                        <button
                            type="button"
                            onClick={clearRows}
                            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className="space-y-4 p-5">
                    {rows.map((row, index) => {
                        const rowErrors = validation.rowErrors[row.localId] ?? [];
                        const hasErrors = rowErrors.length > 0;

                        return (
                            <article
                                key={row.localId}
                                className={`rounded-3xl border p-4 transition ${hasErrors
                                    ? "border-rose-200 bg-rose-50/60"
                                    : "border-slate-200 bg-white"
                                    }`}
                            >
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-800">
                                            {index + 1}
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-black text-slate-900">
                                                Estudiante {index + 1}
                                            </h3>
                                            <p className="text-xs font-semibold text-slate-500">
                                                Datos para crear usuario y matrícula
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeRow(row.localId)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-100 bg-white text-rose-600 transition hover:bg-rose-50"
                                        title="Eliminar estudiante"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {BULK_FIELDS.map((field) => (
                                        <div
                                            key={field.key}
                                            className={field.className ?? ""}
                                        >
                                            <label className="mb-1.5 block text-xs font-black uppercase text-slate-500">
                                                {field.label}
                                                {field.required ? (
                                                    <span className="text-orange-500"> *</span>
                                                ) : null}
                                            </label>

                                            <input
                                                type={field.key === "email" ? "email" : "text"}
                                                value={row[field.key]}
                                                onChange={(event) =>
                                                    updateRow(
                                                        row.localId,
                                                        field.key,
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder={field.placeholder}
                                                disabled={!hasSelectedCourse}
                                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {hasErrors ? (
                                    <div className="mt-4 rounded-2xl bg-white p-3">
                                        <div className="mb-1 flex items-center gap-2 text-xs font-black uppercase text-rose-700">
                                            <AlertCircle className="h-4 w-4" />
                                            Revisar estudiante
                                        </div>

                                        <ul className="space-y-1 text-xs font-bold text-rose-600">
                                            {rowErrors.map((message) => (
                                                <li key={message}>• {message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}
                </div>
            </section>

            {
                result ? (
                    <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

                            <div className="w-full">
                                <h3 className="text-sm font-black text-emerald-900">
                                    Matrícula masiva finalizada
                                </h3>

                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-white p-3 text-center">
                                        <p className="text-2xl font-black text-emerald-700">
                                            {resultCount.created}
                                        </p>
                                        <p className="text-xs font-black text-slate-500">
                                            Creados
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3 text-center">
                                        <p className="text-2xl font-black text-orange-600">
                                            {resultCount.skipped}
                                        </p>
                                        <p className="text-xs font-black text-slate-500">
                                            Omitidos
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-white p-3 text-center">
                                        <p className="text-2xl font-black text-rose-600">
                                            {resultCount.failed}
                                        </p>
                                        <p className="text-xs font-black text-slate-500">
                                            Fallidos
                                        </p>
                                    </div>
                                </div>

                                {result.failed.length > 0 ? (
                                    <details className="mt-4 rounded-2xl bg-white p-3">
                                        <summary className="cursor-pointer text-sm font-black text-rose-700">
                                            Ver fallidos
                                        </summary>

                                        <div className="mt-3 space-y-2">
                                            {result.failed.map((item, index) => (
                                                <div
                                                    key={`failed-${index}`}
                                                    className="rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-800"
                                                >
                                                    {renderUnknownValue(item)}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ) : null}

                                {result.skipped.length > 0 ? (
                                    <details className="mt-3 rounded-2xl bg-white p-3">
                                        <summary className="cursor-pointer text-sm font-black text-orange-700">
                                            Ver omitidos
                                        </summary>

                                        <div className="mt-3 space-y-2">
                                            {result.skipped.map((item, index) => (
                                                <div
                                                    key={`skipped-${index}`}
                                                    className="rounded-2xl bg-orange-50 p-3 text-xs font-semibold text-orange-800"
                                                >
                                                    {renderUnknownValue(item)}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ) : null}
                            </div>
                        </div>
                    </section>
                ) : null
            }

            <div className="sticky bottom-4 z-10 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${validation.canSubmit
                            ? "bg-orange-500 shadow-orange-500/20 hover:bg-orange-600"
                            : "bg-slate-400 shadow-slate-300/30 hover:bg-slate-500"
                        }`}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : validation.canSubmit ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <XCircle className="h-4 w-4" />
                    )}

                    {isSubmitting ? "Matriculando..." : "Matricular masivamente"}
                </button>
            </div>
        </form >
    );
}