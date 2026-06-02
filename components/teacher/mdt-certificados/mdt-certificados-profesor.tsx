"use client";

import {
    type ChangeEvent,
    type DragEvent,
    type FormEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AlertCircle,
    ArchiveRestore,
    ArchiveX,
    ArrowLeftRight,
    Award,
    CheckCircle2,
    ExternalLink,
    Eye,
    EyeOff,
    FileText,
    FolderUp,
    Loader2,
    Pencil,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "@/services/api-client.service";
import {
    createMdtCertificate,
    deleteMdtCertificate,
    getMdtCertificatesByCourseId,
    updateMdtCertificate,
    type MdtCertificate,
} from "@/services/mdt-certificates.service";
import {
    getEnrollmentsByCourseAndRole,
    type Enrollment,
} from "@/services/enrollments.service";

type TipoCarga = "individual" | "masiva";

type MdtCertificadosProfesorViewProps = {
    cursoIdInicial?: number;
    bloquearCurso?: boolean;
};

type EstudianteCurso = {
    id: number;
    userId: number;
    enrollmentId: number;
    firstname: string;
    lastname: string;
    email: string;
    idnumber: string;
};

type RegistroFlexible = Record<string, unknown>;

type DeleteModalState = {
    certificado: MdtCertificate;
};

type EditModalState = {
    certificado: MdtCertificate;
    certificateType: string;
    idNumber: string;
    file: File | null;
};

type UpdateMdtCertificatePayload = Parameters<typeof updateMdtCertificate>[1];

const TIPOS_CERTIFICADO = ["MDT", "INSTITUTIONAL"];
const ROL_ESTUDIANTE_ID = 4;

function limpiarTexto(valor: unknown) {
    if (typeof valor !== "string" && typeof valor !== "number") return "";

    return String(valor).trim();
}

function leerNumero(valor: unknown, fallback = 0) {
    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : fallback;
}

function obtenerRegistro(valor: unknown): RegistroFlexible {
    if (!valor || typeof valor !== "object") return {};

    return valor as RegistroFlexible;
}

function obtenerMensajeError(error: unknown) {
    if (error instanceof Error) return error.message;

    if (typeof error === "string") return error;

    return "Ocurrió un error inesperado.";
}

function normalizarBusqueda(valor: unknown) {
    return String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function normalizarCedula(valor: unknown) {
    return String(valor ?? "")
        .trim()
        .replace(/\s+/g, "");
}

function obtenerApiOrigin() {
    const cleanApiUrl = API_URL.replace(/\/+$/, "");

    if (cleanApiUrl.endsWith("/api/v1")) {
        return cleanApiUrl.replace(/\/api\/v1$/, "");
    }

    return cleanApiUrl;
}

function construirUrlArchivo(url: string | null | undefined) {
    const cleanUrl = limpiarTexto(url);

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("blob:") ||
        cleanUrl.startsWith("data:")
    ) {
        return cleanUrl;
    }

    const apiOrigin = obtenerApiOrigin();

    if (cleanUrl.startsWith("/")) {
        return `${apiOrigin}${cleanUrl}`;
    }

    return `${apiOrigin}/${cleanUrl}`;
}

function formatearFecha(fecha: string | null | undefined) {
    if (!fecha) return "Sin fecha";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) return "Sin fecha";

    return new Intl.DateTimeFormat("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function obtenerCedulaDesdeNombreArchivo(nombreArchivo: string) {
    const nombre = nombreArchivo.replace(/\.[^/.]+$/, "");
    const coincidencia = nombre.match(/\d{6,13}/);

    return coincidencia?.[0] ?? "";
}

function obtenerClaveArchivo(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

function adaptarEstudianteCurso(enrollment: Enrollment): EstudianteCurso {
    const enrollmentRecord = obtenerRegistro(enrollment);
    const userRecord = obtenerRegistro(enrollmentRecord.user);

    const enrollmentId = leerNumero(enrollmentRecord.id);
    const userId = leerNumero(userRecord.id ?? enrollmentRecord.user_id);

    return {
        id: enrollmentId || userId,
        userId,
        enrollmentId,
        firstname: limpiarTexto(userRecord.firstname),
        lastname: limpiarTexto(userRecord.lastname),
        email: limpiarTexto(userRecord.email),
        idnumber: normalizarCedula(userRecord.idnumber),
    };
}

function obtenerNombreEstudiante(estudiante: EstudianteCurso) {
    const nombre = `${estudiante.firstname} ${estudiante.lastname}`.trim();

    return nombre || estudiante.email || estudiante.idnumber || "Estudiante";
}

function ResumenCard({
    titulo,
    valor,
    descripcion,
}: {
    titulo: string;
    valor: ReactNode;
    descripcion: string;
}) {
    return (
        <div className="rounded-2xl bg-white/15 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">
                {titulo}
            </p>

            <p className="mt-2 text-3xl font-black leading-none">{valor}</p>

            <p className="mt-1 text-xs font-bold text-white/80">
                {descripcion}
            </p>
        </div>
    );
}

function EstadoBadge({ eliminado }: { eliminado: boolean }) {
    if (eliminado) {
        return (
            <span className="inline-flex w-fit items-center rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                Oculto
            </span>
        );
    }

    return (
        <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            Activo
        </span>
    );
}

function TipoBadge({ tipo }: { tipo: string }) {
    return (
        <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            {tipo || "MDT"}
        </span>
    );
}

export function MdtCertificadosProfesorView({
    cursoIdInicial = 0,
    bloquearCurso = false,
}: MdtCertificadosProfesorViewProps) {
    const router = useRouter();
    const pathname = usePathname();

    const esRutaAdministrador = pathname.startsWith("/admin/");

    const inputArchivosRef = useRef<HTMLInputElement | null>(null);
    const inputCarpetaRef = useRef<HTMLInputElement | null>(null);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(
        null,
    );
    const [editModal, setEditModal] = useState<EditModalState | null>(null);

    const [cursoId, setCursoId] = useState(() =>
        cursoIdInicial > 0 ? String(cursoIdInicial) : "",
    );

    const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([]);
    const [estudianteSeleccionadoId, setEstudianteSeleccionadoId] =
        useState("");

    const [tipoCertificado, setTipoCertificado] = useState("MDT");
    const [tipoCarga, setTipoCarga] = useState<TipoCarga>("individual");

    const [archivo, setArchivo] = useState<File | null>(null);
    const [archivosMasivos, setArchivosMasivos] = useState<File[]>([]);

    const [certificados, setCertificados] = useState<MdtCertificate[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarEliminados, setMostrarEliminados] = useState(true);

    const [cargando, setCargando] = useState(false);
    const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [editando, setEditando] = useState(false);
    const [procesandoId, setProcesandoId] = useState<number | null>(null);

    const [mensajeExito, setMensajeExito] = useState("");
    const [mensajeError, setMensajeError] = useState("");

    const cursoIdActual =
        bloquearCurso && cursoIdInicial > 0 ? String(cursoIdInicial) : cursoId;

    const cursoIdNumerico = useMemo(
        () => Number(cursoIdActual),
        [cursoIdActual],
    );

    const estudianteSeleccionado = useMemo(() => {
        return estudiantes.find(
            (estudiante) =>
                String(estudiante.enrollmentId) === estudianteSeleccionadoId,
        );
    }, [estudianteSeleccionadoId, estudiantes]);

    const totalActivos = useMemo(
        () => certificados.filter((certificado) => !certificado.deleted).length,
        [certificados],
    );

    const totalEliminados = useMemo(
        () => certificados.filter((certificado) => certificado.deleted).length,
        [certificados],
    );

    const archivosSeleccionados = useMemo(() => {
        if (tipoCarga === "individual") {
            return archivo ? [archivo] : [];
        }

        return archivosMasivos;
    }, [archivo, archivosMasivos, tipoCarga]);

    const certificadosFiltrados = useMemo(() => {
        const textoBusqueda = normalizarBusqueda(busqueda);

        return certificados
            .filter((certificado) => {
                if (mostrarEliminados) return true;

                return !certificado.deleted;
            })
            .filter((certificado) => {
                if (!textoBusqueda) return true;

                const contenidoBusqueda = normalizarBusqueda(
                    [
                        certificado.file_name,
                        certificado.id_number,
                        certificado.certificate_type,
                        certificado.created_at,
                    ].join(" "),
                );

                return contenidoBusqueda.includes(textoBusqueda);
            });
    }, [busqueda, certificados, mostrarEliminados]);

    const cargarCertificados = useCallback(
        async (cursoIdConsulta?: number) => {
            const idCurso = cursoIdConsulta ?? cursoIdNumerico;

            setMensajeError("");
            setMensajeExito("");

            if (!Number.isFinite(idCurso) || idCurso <= 0) {
                setCertificados([]);
                setMensajeError("Ingrese un ID de curso válido.");
                return;
            }

            try {
                setCargando(true);

                const data = await getMdtCertificatesByCourseId(idCurso);

                setCertificados(Array.isArray(data) ? data : []);
            } catch (error) {
                setCertificados([]);
                setMensajeError(obtenerMensajeError(error));
            } finally {
                setCargando(false);
            }
        },
        [cursoIdNumerico],
    );

    const cargarEstudiantes = useCallback(
        async (cursoIdConsulta?: number) => {
            const idCurso = cursoIdConsulta ?? cursoIdNumerico;

            if (!Number.isFinite(idCurso) || idCurso <= 0) {
                setEstudiantes([]);
                return;
            }

            try {
                setCargandoEstudiantes(true);

                const data = await getEnrollmentsByCourseAndRole(
                    idCurso,
                    ROL_ESTUDIANTE_ID,
                );

                const estudiantesAdaptados = Array.isArray(data)
                    ? data.map(adaptarEstudianteCurso).filter((estudiante) => {
                        return (
                            estudiante.enrollmentId > 0 ||
                            estudiante.userId > 0 ||
                            estudiante.idnumber.trim().length > 0
                        );
                    })
                    : [];

                setEstudiantes(estudiantesAdaptados);
            } catch {
                setEstudiantes([]);
            } finally {
                setCargandoEstudiantes(false);
            }
        },
        [cursoIdNumerico],
    );

    useEffect(() => {
        if (cursoIdInicial <= 0) return;

        const timeoutId = window.setTimeout(() => {
            void cargarCertificados(cursoIdInicial);
            void cargarEstudiantes(cursoIdInicial);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [cargarCertificados, cargarEstudiantes, cursoIdInicial]);

    useEffect(() => {
        if (!modalAbierto) return;

        function cerrarConEscape(event: KeyboardEvent) {
            if (event.key === "Escape" && !subiendo) {
                setModalAbierto(false);
            }
        }

        document.addEventListener("keydown", cerrarConEscape);

        return () => {
            document.removeEventListener("keydown", cerrarConEscape);
        };
    }, [modalAbierto, subiendo]);

    useEffect(() => {
        if (!editModal) return;

        function cerrarConEscape(event: KeyboardEvent) {
            if (event.key === "Escape" && !editando) {
                setEditModal(null);
            }
        }

        document.addEventListener("keydown", cerrarConEscape);

        return () => {
            document.removeEventListener("keydown", cerrarConEscape);
        };
    }, [editModal, editando]);

    async function subirCertificado(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setMensajeError("");
        setMensajeExito("");

        if (!Number.isFinite(cursoIdNumerico) || cursoIdNumerico <= 0) {
            setMensajeError("Ingrese un ID de curso válido.");
            return;
        }

        if (!tipoCertificado.trim()) {
            setMensajeError("Seleccione el tipo de certificado.");
            return;
        }

        if (tipoCarga === "individual" && !estudianteSeleccionado) {
            setMensajeError("Seleccione un estudiante del curso.");
            return;
        }

        if (
            tipoCarga === "individual" &&
            estudianteSeleccionado &&
            !estudianteSeleccionado.idnumber.trim()
        ) {
            setMensajeError(
                "El estudiante seleccionado no tiene número de identificación registrado.",
            );
            return;
        }

        if (tipoCarga === "individual" && !archivo) {
            setMensajeError("Seleccione el certificado del estudiante.");
            return;
        }

        if (tipoCarga === "masiva" && archivosMasivos.length === 0) {
            setMensajeError("Seleccione uno o varios certificados para subir.");
            return;
        }

        if (tipoCarga === "masiva") {
            const archivosSinCedula = archivosMasivos.filter((file) => {
                return !obtenerCedulaDesdeNombreArchivo(file.name);
            });

            if (archivosSinCedula.length > 0) {
                setMensajeError(
                    `Los archivos deben llamarse con la cédula. Ejemplo: 1312345678.pdf. Revise: ${archivosSinCedula
                        .map((file) => file.name)
                        .slice(0, 3)
                        .join(", ")}`,
                );
                return;
            }
        }

        try {
            setSubiendo(true);

            if (tipoCarga === "individual") {
                await createMdtCertificate({
                    file: archivo as File,
                    course_id: cursoIdNumerico,
                    id_number: estudianteSeleccionado?.idnumber ?? "",
                    certificate_type: tipoCertificado.trim(),
                });

                setMensajeExito("Certificado subido correctamente.");
            } else {
                for (const file of archivosMasivos) {
                    await createMdtCertificate({
                        file,
                        course_id: cursoIdNumerico,
                        id_number: obtenerCedulaDesdeNombreArchivo(file.name),
                        certificate_type: tipoCertificado.trim(),
                    });
                }

                setMensajeExito(
                    `${archivosMasivos.length} certificado(s) subido(s) correctamente.`,
                );
            }

            limpiarArchivos();
            setEstudianteSeleccionadoId("");
            setModalAbierto(false);

            await cargarCertificados(cursoIdNumerico);
        } catch (error) {
            setMensajeError(obtenerMensajeError(error));
        } finally {
            setSubiendo(false);
        }
    }

    async function actualizarCertificado(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editModal) return;

        const certificateType = limpiarTexto(editModal.certificateType);
        const idNumber = normalizarCedula(editModal.idNumber);

        setMensajeError("");
        setMensajeExito("");

        if (!certificateType) {
            setMensajeError("Seleccione el tipo de certificado.");
            return;
        }

        if (!idNumber) {
            setMensajeError("Ingrese la identificación del estudiante.");
            return;
        }

        if (!Number.isFinite(cursoIdNumerico) || cursoIdNumerico <= 0) {
            setMensajeError("No se pudo identificar el curso.");
            return;
        }

        try {
            setEditando(true);
            setProcesandoId(editModal.certificado.id);

            const payload = {
                course_id: cursoIdNumerico,
                id_number: idNumber,
                certificate_type: certificateType,
                ...(editModal.file ? { file: editModal.file } : {}),
            } as UpdateMdtCertificatePayload;

            await updateMdtCertificate(editModal.certificado.id, payload);

            setMensajeExito("Certificado actualizado correctamente.");
            setEditModal(null);

            await cargarCertificados(cursoIdNumerico);
        } catch (error) {
            setMensajeError(obtenerMensajeError(error));
        } finally {
            setEditando(false);
            setProcesandoId(null);
        }
    }

    async function cambiarEstadoCertificado(certificado: MdtCertificate) {
        setMensajeError("");
        setMensajeExito("");
        setProcesandoId(certificado.id);

        try {
            await updateMdtCertificate(certificado.id, {
                deleted: !certificado.deleted,
            });

            setMensajeExito(
                certificado.deleted
                    ? "Certificado restaurado correctamente."
                    : "Certificado ocultado correctamente.",
            );

            await cargarCertificados(cursoIdNumerico);
        } catch (error) {
            setMensajeError(obtenerMensajeError(error));
        } finally {
            setProcesandoId(null);
        }
    }

    async function confirmarEliminarCertificado() {
        if (!deleteModal) return;

        const certificadoId = deleteModal.certificado.id;

        setMensajeError("");
        setMensajeExito("");
        setProcesandoId(certificadoId);

        try {
            const certificadoEliminado =
                await deleteMdtCertificate(certificadoId);

            setCertificados((certificadosActuales) =>
                certificadosActuales.map((certificado) =>
                    certificado.id === certificadoEliminado.id
                        ? certificadoEliminado
                        : certificado,
                ),
            );

            setMensajeExito("Certificado eliminado correctamente.");
            setDeleteModal(null);
        } catch (error) {
            setMensajeError(obtenerMensajeError(error));
        } finally {
            setProcesandoId(null);
        }
    }

    function seleccionarArchivos(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);

        asignarArchivos(files);

        event.target.value = "";
    }

    function seleccionarArchivoEdicion(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        setEditModal((actual) => {
            if (!actual) return actual;

            return {
                ...actual,
                file,
            };
        });

        event.target.value = "";
    }

    function soltarArchivos(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files ?? []);

        asignarArchivos(files);
    }

    function asignarArchivos(files: File[]) {
        const archivosValidos = files.filter((file) => {
            return /\.(pdf|jpg|jpeg|png|webp)$/i.test(file.name);
        });

        const primerArchivo = archivosValidos[0] ?? null;

        if (tipoCarga === "individual") {
            setArchivo(primerArchivo);
            setArchivosMasivos([]);
            return;
        }

        setArchivo(null);

        setArchivosMasivos((previos) => {
            const mapa = new Map<string, File>();

            [...previos, ...archivosValidos].forEach((file) => {
                mapa.set(obtenerClaveArchivo(file), file);
            });

            return Array.from(mapa.values());
        });
    }

    function quitarArchivoCapturado(file: File) {
        if (tipoCarga === "individual") {
            setArchivo(null);
            return;
        }

        const clave = obtenerClaveArchivo(file);

        setArchivosMasivos((previos) =>
            previos.filter((item) => obtenerClaveArchivo(item) !== clave),
        );
    }

    function limpiarArchivos() {
        setArchivo(null);
        setArchivosMasivos([]);

        if (inputArchivosRef.current) {
            inputArchivosRef.current.value = "";
        }

        if (inputCarpetaRef.current) {
            inputCarpetaRef.current.value = "";
        }
    }

    function cambiarTipoCarga(tipo: TipoCarga) {
        setTipoCarga(tipo);
        limpiarArchivos();

        if (tipo === "masiva") {
            setEstudianteSeleccionadoId("");
        }
    }

    function abrirModalSubida() {
        setMensajeError("");
        setMensajeExito("");
        limpiarArchivos();

        if (Number.isFinite(cursoIdNumerico) && cursoIdNumerico > 0) {
            void cargarEstudiantes(cursoIdNumerico);
        }

        setModalAbierto(true);
    }

    function abrirModalEdicion(certificado: MdtCertificate) {
        setMensajeError("");
        setMensajeExito("");

        setEditModal({
            certificado,
            certificateType: certificado.certificate_type || "MDT",
            idNumber: certificado.id_number || "",
            file: null,
        });
    }

    function cerrarModalSubida() {
        if (subiendo) return;

        setModalAbierto(false);
    }

    function cerrarModalEdicion() {
        if (editando) return;

        setEditModal(null);
    }

    function consultarTodo() {
        void cargarCertificados();
        void cargarEstudiantes();
    }

    function cambiarCursoAdministrador() {
        setMensajeError("");
        setMensajeExito("");

        router.push("/admin/mdt-certificados");
    }

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 md:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-[1500px] space-y-5">
                {mensajeError ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{mensajeError}</span>
                    </div>
                ) : null}

                {mensajeExito ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{mensajeExito}</span>
                    </div>
                ) : null}

                <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem]">
                    <div className="bg-gradient-to-br from-[#07122f] via-[#172b78] to-orange-500 px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em]">
                                    <Award className="h-4 w-4" />
                                    Certificados MDT
                                </span>

                                <h1 className="mt-5 text-2xl font-black sm:text-3xl">
                                    Gestión de certificados del profesor
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                                    Consulta, sube, edita y administra los
                                    certificados MDT asociados al curso.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                                <ResumenCard
                                    titulo="Total"
                                    valor={certificados.length}
                                    descripcion="Certificados"
                                />

                                <ResumenCard
                                    titulo="Activos"
                                    valor={totalActivos}
                                    descripcion="Disponibles"
                                />

                                <ResumenCard
                                    titulo="Eliminados"
                                    valor={totalEliminados}
                                    descripcion="Ocultos"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 lg:p-6">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                                <div>
                                    <h2 className="text-lg font-black text-slate-950">
                                        Certificados registrados
                                    </h2>

                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Busque, consulte y administre los
                                        certificados del curso.
                                    </p>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap xl:justify-end">
                                    <button
                                        type="button"
                                        onClick={consultarTodo}
                                        disabled={cargando}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                                    >
                                        {cargando ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                        Consultar
                                    </button>

                                    {esRutaAdministrador ? (
                                        <button
                                            type="button"
                                            onClick={cambiarCursoAdministrador}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 text-sm font-black text-[#172861] shadow-sm transition hover:bg-blue-50 xl:w-auto"
                                        >
                                            <ArrowLeftRight className="h-4 w-4" />
                                            Cambiar curso
                                        </button>
                                    ) : (
                                        null
                                    )}

                                    <button
                                        type="button"
                                        onClick={abrirModalSubida}
                                        disabled={
                                            cargando ||
                                            !Number.isFinite(cursoIdNumerico) ||
                                            cursoIdNumerico <= 0
                                        }
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Subir certificado
                                    </button>
                                </div>
                            </div>

                            {!bloquearCurso ? (
                                <div className="mt-5">
                                    <label className="block">
                                        <span className="text-sm font-black text-slate-700">
                                            ID del curso
                                        </span>

                                        <input
                                            value={cursoId}
                                            onChange={(event) =>
                                                setCursoId(event.target.value)
                                            }
                                            placeholder="Ejemplo: 1"
                                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                                        />
                                    </label>
                                </div>
                            ) : null}

                            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        value={busqueda}
                                        onChange={(event) =>
                                            setBusqueda(event.target.value)
                                        }
                                        placeholder="Buscar por archivo, identificación o tipo..."
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarEliminados((actual) => !actual)
                                    }
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 lg:w-auto"
                                >
                                    {mostrarEliminados ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                    {mostrarEliminados
                                        ? "Ocultar eliminados"
                                        : "Ver todos"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:rounded-[2rem]">
                            <div className="grid gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                <div>
                                    <h2 className="text-base font-black text-slate-950">
                                        Lista de certificados
                                    </h2>

                                    <p className="mt-1 text-xs font-bold text-slate-500">
                                        Mostrando {certificadosFiltrados.length}{" "}
                                        de {certificados.length} registro(s)
                                    </p>
                                </div>

                                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                                    <Award className="h-4 w-4 text-orange-500" />
                                    Curso #{cursoIdNumerico || "-"}
                                </span>
                            </div>

                            {cargando ? (
                                <div className="flex items-center gap-2 p-6 text-sm font-bold text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando certificados...
                                </div>
                            ) : null}

                            {!cargando &&
                                certificadosFiltrados.length === 0 ? (
                                <div className="m-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:m-5">
                                    <FileText className="mx-auto h-10 w-10 text-slate-400" />

                                    <h3 className="mt-4 text-base font-black text-slate-900">
                                        No hay certificados registrados
                                    </h3>

                                    <p className="mt-2 text-sm font-semibold text-slate-500">
                                        Sube el primer certificado para que el
                                        estudiante pueda visualizarlo desde su
                                        aula.
                                    </p>
                                </div>
                            ) : null}

                            {!cargando &&
                                certificadosFiltrados.length > 0 ? (
                                <>
                                    <div className="hidden overflow-x-auto lg:block">
                                        <table className="w-full min-w-[1080px] text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                                                    <th className="px-5 py-4">
                                                        Archivo
                                                    </th>
                                                    <th className="px-5 py-4">
                                                        Identificación
                                                    </th>
                                                    <th className="px-5 py-4">
                                                        Tipo
                                                    </th>
                                                    <th className="px-5 py-4">
                                                        Estado
                                                    </th>
                                                    <th className="px-5 py-4">
                                                        Fecha
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {certificadosFiltrados.map(
                                                    (certificado) => (
                                                        <tr
                                                            key={
                                                                certificado.id
                                                            }
                                                            className="border-b border-slate-100 text-sm last:border-0"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <div className="flex min-w-0 items-start gap-3">
                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                                                        <FileText className="h-5 w-5" />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="truncate font-black text-slate-950">
                                                                            {
                                                                                certificado.file_name
                                                                            }
                                                                        </p>

                                                                        {construirUrlArchivo(
                                                                            certificado.file_url,
                                                                        ) ? (
                                                                            <a
                                                                                href={construirUrlArchivo(
                                                                                    certificado.file_url,
                                                                                )}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="mt-1 inline-flex items-center gap-1 text-xs font-black text-[#172861] hover:underline"
                                                                            >
                                                                                Ver
                                                                                archivo
                                                                                <ExternalLink className="h-3 w-3" />
                                                                            </a>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <span className="font-bold text-slate-700">
                                                                    {
                                                                        certificado.id_number
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <TipoBadge
                                                                    tipo={
                                                                        certificado.certificate_type
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <EstadoBadge
                                                                    eliminado={
                                                                        certificado.deleted
                                                                    }
                                                                />
                                                            </td>

                                                            <td className="px-5 py-4 font-bold text-slate-600">
                                                                {formatearFecha(
                                                                    certificado.created_at,
                                                                )}
                                                            </td>

                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="grid gap-3 p-4 lg:hidden">
                                        {certificadosFiltrados.map(
                                            (certificado) => (
                                                <div
                                                    key={certificado.id}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                                            <FileText className="h-5 w-5" />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-black text-slate-950">
                                                                {
                                                                    certificado.file_name
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                                                {
                                                                    certificado.id_number
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <TipoBadge
                                                            tipo={
                                                                certificado.certificate_type
                                                            }
                                                        />

                                                        <EstadoBadge
                                                            eliminado={
                                                                certificado.deleted
                                                            }
                                                        />

                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                                            {formatearFecha(
                                                                certificado.created_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    {construirUrlArchivo(
                                                        certificado.file_url,
                                                    ) ? (
                                                        <a
                                                            href={construirUrlArchivo(
                                                                certificado.file_url,
                                                            )}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#172861] hover:underline"
                                                        >
                                                            Ver archivo
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ) : null}

                                                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                abrirModalEdicion(
                                                                    certificado,
                                                                )
                                                            }
                                                            disabled={
                                                                procesandoId ===
                                                                certificado.id
                                                            }
                                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void cambiarEstadoCertificado(
                                                                    certificado,
                                                                )
                                                            }
                                                            disabled={
                                                                procesandoId ===
                                                                certificado.id
                                                            }
                                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {certificado.deleted
                                                                ? "Restaurar"
                                                                : "Ocultar"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteModal({
                                                                    certificado,
                                                                })
                                                            }
                                                            disabled={
                                                                procesandoId ===
                                                                certificado.id
                                                            }
                                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>

            {modalAbierto ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-3 py-6 sm:px-4">
                    <form
                        onSubmit={subirCertificado}
                        className="w-full max-w-3xl overflow-hidden rounded-[1.7rem] bg-white shadow-2xl sm:rounded-[2rem]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Subir certificado MDT
                                </h2>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Registra uno o varios certificados para el
                                    curso seleccionado.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarModalSubida}
                                disabled={subiendo}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Cerrar modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-black text-slate-700">
                                        Tipo de certificado
                                    </span>

                                    <select
                                        value={tipoCertificado}
                                        onChange={(event) =>
                                            setTipoCertificado(
                                                event.target.value,
                                            )
                                        }
                                        disabled={subiendo}
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {TIPOS_CERTIFICADO.map((tipo) => (
                                            <option key={tipo} value={tipo}>
                                                {tipo}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {!bloquearCurso ? (
                                    <label className="block">
                                        <span className="text-sm font-black text-slate-700">
                                            ID del curso
                                        </span>

                                        <input
                                            value={cursoId}
                                            onChange={(event) =>
                                                setCursoId(event.target.value)
                                            }
                                            disabled={subiendo}
                                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                    </label>
                                ) : (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                            Curso
                                        </p>

                                        <p className="mt-1 text-lg font-black text-slate-950">
                                            #{cursoIdNumerico || "-"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        cambiarTipoCarga("individual")
                                    }
                                    disabled={subiendo}
                                    className={`rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${tipoCarga === "individual"
                                        ? "border-blue-200 bg-blue-50 text-blue-900"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <p className="text-sm font-black">
                                        Carga individual
                                    </p>

                                    <p className="mt-1 text-xs font-semibold">
                                        Selecciona un estudiante y sube su
                                        certificado.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cambiarTipoCarga("masiva")}
                                    disabled={subiendo}
                                    className={`rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${tipoCarga === "masiva"
                                        ? "border-blue-200 bg-blue-50 text-blue-900"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <p className="text-sm font-black">
                                        Carga masiva
                                    </p>

                                    <p className="mt-1 text-xs font-semibold">
                                        Sube varios archivos nombrados con la
                                        cédula.
                                    </p>
                                </button>
                            </div>

                            {tipoCarga === "individual" ? (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <label className="block flex-1">
                                            <span className="text-sm font-black text-slate-700">
                                                Estudiante del curso
                                            </span>

                                            <select
                                                value={
                                                    estudianteSeleccionadoId
                                                }
                                                onChange={(event) =>
                                                    setEstudianteSeleccionadoId(
                                                        event.target.value,
                                                    )
                                                }
                                                disabled={
                                                    subiendo ||
                                                    cargandoEstudiantes
                                                }
                                                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <option value="">
                                                    Selecciona un estudiante
                                                </option>

                                                {estudiantes.map(
                                                    (estudiante) => (
                                                        <option
                                                            key={`${estudiante.enrollmentId}-${estudiante.userId}`}
                                                            value={
                                                                estudiante.enrollmentId
                                                            }
                                                        >
                                                            {obtenerNombreEstudiante(
                                                                estudiante,
                                                            )}{" "}
                                                            -{" "}
                                                            {estudiante.idnumber ||
                                                                "Sin identificación"}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void cargarEstudiantes()
                                            }
                                            disabled={cargandoEstudiantes}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-7"
                                        >
                                            {cargandoEstudiantes ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCcw className="h-4 w-4" />
                                            )}
                                            Cargar estudiantes
                                        </button>
                                    </div>

                                    {estudianteSeleccionado ? (
                                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                            <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                                                Identificación
                                            </p>

                                            <p className="mt-1 text-sm font-black text-blue-950">
                                                {estudianteSeleccionado.idnumber ||
                                                    "Sin identificación"}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
                                    En carga masiva, cada archivo debe tener el
                                    número de cédula en el nombre. Ejemplo:{" "}
                                    <strong>1312345678.pdf</strong>.
                                </div>
                            )}

                            <div
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={soltarArchivos}
                                className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
                            >
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                    {tipoCarga === "masiva" ? (
                                        <FolderUp className="h-6 w-6" />
                                    ) : (
                                        <UploadCloud className="h-6 w-6" />
                                    )}
                                </div>

                                <h3 className="mt-3 text-base font-black text-slate-950">
                                    Arrastra tus archivos aquí
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Formatos permitidos: PDF, JPG, PNG y WEBP.
                                </p>

                                <div className="mt-4 flex flex-wrap justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            inputArchivosRef.current?.click()
                                        }
                                        disabled={subiendo}
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <UploadCloud className="h-4 w-4" />
                                        Elegir archivo
                                    </button>

                                    {tipoCarga === "masiva" ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                inputCarpetaRef.current?.click()
                                            }
                                            disabled={subiendo}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <FolderUp className="h-4 w-4" />
                                            Elegir varios
                                        </button>
                                    ) : null}
                                </div>

                                <input
                                    ref={inputArchivosRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    multiple={tipoCarga === "masiva"}
                                    onChange={seleccionarArchivos}
                                    className="hidden"
                                />

                                <input
                                    ref={inputCarpetaRef}
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    multiple
                                    onChange={seleccionarArchivos}
                                    className="hidden"
                                />
                            </div>

                            {archivosSeleccionados.length > 0 ? (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-black text-slate-950">
                                            Archivos capturados
                                        </p>

                                        <button
                                            type="button"
                                            onClick={limpiarArchivos}
                                            disabled={subiendo}
                                            className="text-xs font-black text-red-600 hover:underline disabled:opacity-60"
                                        >
                                            Limpiar todo
                                        </button>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {archivosSeleccionados.map((file) => (
                                            <div
                                                key={obtenerClaveArchivo(file)}
                                                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-black text-slate-800">
                                                        {file.name}
                                                    </p>

                                                    <p className="text-xs font-semibold text-slate-500">
                                                        {Math.max(
                                                            file.size / 1024,
                                                            1,
                                                        ).toFixed(0)}{" "}
                                                        KB
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    {tipoCarga === "masiva" ? (
                                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                                                            {obtenerCedulaDesdeNombreArchivo(
                                                                file.name,
                                                            ) || "Sin cédula"}
                                                        </span>
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            quitarArchivoCapturado(
                                                                file,
                                                            )
                                                        }
                                                        disabled={subiendo}
                                                        className="inline-flex h-8 items-center justify-center rounded-xl bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:grid-cols-2 sm:px-6">
                            <button
                                type="button"
                                onClick={cerrarModalSubida}
                                disabled={subiendo}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={subiendo}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {subiendo ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UploadCloud className="h-4 w-4" />
                                )}
                                Subir certificado
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {editModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-3 py-6 sm:px-4">
                    <form
                        onSubmit={actualizarCertificado}
                        className="w-full max-w-2xl overflow-hidden rounded-[1.7rem] bg-white shadow-2xl sm:rounded-[2rem]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">
                                    Editar certificado
                                </h2>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Actualiza la identificación, tipo o archivo
                                    del certificado seleccionado.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarModalEdicion}
                                disabled={editando}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Cerrar modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                                    Archivo actual
                                </p>

                                <p className="mt-1 truncate text-sm font-black text-blue-950">
                                    {editModal.certificado.file_name}
                                </p>

                                {construirUrlArchivo(
                                    editModal.certificado.file_url,
                                ) ? (
                                    <a
                                        href={construirUrlArchivo(
                                            editModal.certificado.file_url,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#172861] hover:underline"
                                    >
                                        Ver archivo actual
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                ) : null}
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-black text-slate-700">
                                        Identificación
                                    </span>

                                    <input
                                        value={editModal.idNumber}
                                        onChange={(event) =>
                                            setEditModal((actual) => {
                                                if (!actual) return actual;

                                                return {
                                                    ...actual,
                                                    idNumber:
                                                        event.target.value,
                                                };
                                            })
                                        }
                                        disabled={editando}
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                </label>

                                <label className="block">
                                    <span className="text-sm font-black text-slate-700">
                                        Tipo de certificado
                                    </span>

                                    <select
                                        value={editModal.certificateType}
                                        onChange={(event) =>
                                            setEditModal((actual) => {
                                                if (!actual) return actual;

                                                return {
                                                    ...actual,
                                                    certificateType:
                                                        event.target.value,
                                                };
                                            })
                                        }
                                        disabled={editando}
                                        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {TIPOS_CERTIFICADO.map((tipo) => (
                                            <option key={tipo} value={tipo}>
                                                {tipo}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                                    <UploadCloud className="h-6 w-6" />
                                </div>

                                <h3 className="mt-3 text-base font-black text-slate-950">
                                    Reemplazar archivo
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Opcional. Solo selecciona un archivo si
                                    deseas cambiar el certificado actual.
                                </p>

                                <label className="mt-4 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#172861] px-4 text-sm font-black text-white transition hover:opacity-95">
                                    <UploadCloud className="h-4 w-4" />
                                    Elegir nuevo archivo
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        onChange={seleccionarArchivoEdicion}
                                        disabled={editando}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {editModal.file ? (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-black text-slate-950">
                                            Nuevo archivo capturado
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditModal((actual) => {
                                                    if (!actual) return actual;

                                                    return {
                                                        ...actual,
                                                        file: null,
                                                    };
                                                })
                                            }
                                            disabled={editando}
                                            className="text-xs font-black text-red-600 hover:underline disabled:opacity-60"
                                        >
                                            Quitar
                                        </button>
                                    </div>

                                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                                        <p className="truncate text-sm font-black text-slate-800">
                                            {editModal.file.name}
                                        </p>

                                        <p className="text-xs font-semibold text-slate-500">
                                            {Math.max(
                                                editModal.file.size / 1024,
                                                1,
                                            ).toFixed(0)}{" "}
                                            KB
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:grid-cols-2 sm:px-6">
                            <button
                                type="button"
                                onClick={cerrarModalEdicion}
                                disabled={editando}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={editando}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {editando ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Pencil className="h-4 w-4" />
                                )}
                                Guardar cambios
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {deleteModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-3 py-6 sm:px-4">
                    <div className="w-full max-w-md rounded-[1.7rem] bg-white p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                            <Trash2 className="h-6 w-6" />
                        </div>

                        <h2 className="mt-4 text-xl font-black text-slate-950">
                            Eliminar certificado
                        </h2>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                            ¿Seguro que deseas eliminar{" "}
                            <strong className="text-slate-900">
                                {deleteModal.certificado.file_name}
                            </strong>
                            ? Esta acción eliminará el registro del certificado.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => setDeleteModal(null)}
                                disabled={procesandoId !== null}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void confirmarEliminarCertificado()
                                }
                                disabled={procesandoId !== null}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {procesandoId ===
                                    deleteModal.certificado.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}

export default MdtCertificadosProfesorView;