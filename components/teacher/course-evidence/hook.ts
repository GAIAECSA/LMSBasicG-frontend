"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    usePathname,
} from "next/navigation";

import {
    getMdtEvidenceBlocks,
    saveMdtEvidence,
} from "./api";

import type {
    EvidenceItem,
} from "./types";

import {
    getEvidenceContent,
    getEvidenceFilename,
    getEvidenceFileUrl,
} from "./utils";

/* =====================================================
   HOOK
===================================================== */

export function useMdtEvidence(
    courseId: string | number,
) {
    const pathname =
        usePathname();

    /* =====================================================
       RUTA / PERMISOS VISUALES
    ===================================================== */

    const isAdminRoute =
        pathname.startsWith(
            "/admin",
        );

    const isTeacherRoute =
        pathname.startsWith(
            "/teacher",
        );

    /*
     * ADMIN y DOCENTE pueden cargar.
     */
    const canUpload =
        isAdminRoute ||
        isTeacherRoute;

    /* =====================================================
       CURSO
    ===================================================== */

    const numericCourseId =
        useMemo(
            () =>
                Number(
                    courseId,
                ),
            [
                courseId,
            ],
        );

    /* =====================================================
       ESTADOS
    ===================================================== */

    const [
        items,
        setItems,
    ] =
        useState<
            EvidenceItem[]
        >([]);

    const [
        loading,
        setLoading,
    ] =
        useState(
            true,
        );

    const [
        refreshing,
        setRefreshing,
    ] =
        useState(
            false,
        );

    const [
        error,
        setError,
    ] =
        useState(
            "",
        );

    const [
        uploadingBlockId,
        setUploadingBlockId,
    ] =
        useState<
            number | null
        >(null);

    /* =====================================================
       CONSTRUIR ITEMS
    ===================================================== */

    const buildItems =
        useCallback(
            (
                blocks:
                    Awaited<
                        ReturnType<
                            typeof getMdtEvidenceBlocks
                        >
                    >,
            ): EvidenceItem[] => {
                return [
                    ...blocks,
                ]
                    .sort(
                        (
                            a,
                            b,
                        ) => {
                            const orderA =
                                Number(
                                    a.order ??
                                    0,
                                );

                            const orderB =
                                Number(
                                    b.order ??
                                    0,
                                );

                            if (
                                orderA !==
                                orderB
                            ) {
                                return (
                                    orderA -
                                    orderB
                                );
                            }

                            return (
                                Number(
                                    a.id,
                                ) -
                                Number(
                                    b.id,
                                )
                            );
                        },
                    )
                    .map(
                        (
                            block,
                        ): EvidenceItem => ({
                            block,

                            content:
                                getEvidenceContent(
                                    block,
                                ),

                            fileUrl:
                                getEvidenceFileUrl(
                                    block,
                                ),

                            filename:
                                getEvidenceFilename(
                                    block,
                                ),
                        }),
                    );
            },
            [],
        );

    /* =====================================================
       CARGAR EVIDENCIAS
    ===================================================== */

    const loadData =
        useCallback(
            async (
                manualRefresh =
                    false,
            ) => {
                try {
                    if (
                        manualRefresh
                    ) {
                        setRefreshing(
                            true,
                        );
                    } else {
                        setLoading(
                            true,
                        );
                    }

                    setError("");

                    if (
                        !Number.isFinite(
                            numericCourseId,
                        ) ||
                        numericCourseId <=
                        0
                    ) {
                        throw new Error(
                            "No se pudo identificar el curso.",
                        );
                    }

                    /*
                     * AQUÍ YA NO HAY MATRÍCULA.
                     *
                     * Simplemente consultamos:
                     *
                     * course_id
                     * block_type_id = 5
                     */

                    const blocks =
                        await getMdtEvidenceBlocks(
                            numericCourseId,
                        );

                    console.log(
                        "EVIDENCIAS MDT:",
                        blocks,
                    );

                    setItems(
                        buildItems(
                            blocks,
                        ),
                    );
                } catch (
                err
                ) {
                    console.error(
                        "Error cargando Evidencia MDT:",
                        err,
                    );

                    setItems([]);

                    setError(
                        err instanceof Error
                            ? err.message
                            : "No se pudieron cargar las evidencias MDT.",
                    );
                } finally {
                    setLoading(
                        false,
                    );

                    setRefreshing(
                        false,
                    );
                }
            },
            [
                numericCourseId,
                buildItems,
            ],
        );

    /* =====================================================
       CARGA INICIAL
    ===================================================== */

    useEffect(
        () => {
            const timeoutId =
                window.setTimeout(
                    () => {
                        void loadData(
                            false,
                        );
                    },
                    0,
                );

            return () => {
                window.clearTimeout(
                    timeoutId,
                );
            };
        },
        [
            loadData,
        ],
    );

    /* =====================================================
       SUBIR / REEMPLAZAR EVIDENCIA
    ===================================================== */

    const handleUpload =
        useCallback(
            async (
                item:
                    EvidenceItem,
                file:
                    File,
            ) => {
                /* =====================================
                   ADMIN O DOCENTE
                ===================================== */

                if (
                    !canUpload
                ) {
                    setError(
                        "No tienes permisos para cargar evidencias.",
                    );

                    return;
                }

                /* =====================================
                   ARCHIVO
                ===================================== */

                if (!file) {
                    setError(
                        "Selecciona un archivo.",
                    );

                    return;
                }

                /* =====================================
                   TAMAÑO
                ===================================== */

                const maxSizeMb =
                    Number(
                        item.content
                            .maxSizeMb,
                    ) ||
                    10;

                const maxBytes =
                    maxSizeMb *
                    1024 *
                    1024;

                if (
                    file.size >
                    maxBytes
                ) {
                    setError(
                        `El archivo supera el máximo permitido de ${maxSizeMb} MB.`,
                    );

                    return;
                }

                try {
                    setUploadingBlockId(
                        Number(
                            item.block.id,
                        ),
                    );

                    setError("");

                    console.log(
                        "SUBIENDO EVIDENCIA MDT:",
                        {
                            courseId:
                                numericCourseId,

                            lessonBlockId:
                                item.block.id,

                            file:
                                file.name,

                            isAdminRoute,

                            isTeacherRoute,
                        },
                    );

                    /*
                     * EL ARCHIVO SE GUARDA EN EL BLOQUE.
                     *
                     * No existe enrollment_id.
                     */
                    await saveMdtEvidence({
                        lessonBlockId:
                            Number(
                                item.block.id,
                            ),

                        file,
                    });

                    /*
                     * Recargar para obtener el
                     * nuevo file_url.
                     */
                    await loadData(
                        true,
                    );
                } catch (
                err
                ) {
                    console.error(
                        "Error subiendo evidencia MDT:",
                        err,
                    );

                    setError(
                        err instanceof Error
                            ? err.message
                            : "No se pudo subir la evidencia.",
                    );
                } finally {
                    setUploadingBlockId(
                        null,
                    );
                }
            },
            [
                canUpload,
                isAdminRoute,
                isTeacherRoute,
                loadData,
                numericCourseId,
            ],
        );

    /* =====================================================
       ACTUALIZAR
    ===================================================== */

    const refresh =
        useCallback(
            async () => {
                await loadData(
                    true,
                );
            },
            [
                loadData,
            ],
        );

    /* =====================================================
       CONTADORES
    ===================================================== */

    const totalCount =
        items.length;

    const submittedCount =
        useMemo(
            () =>
                items.filter(
                    (
                        item,
                    ) =>
                        Boolean(
                            item.fileUrl,
                        ),
                ).length,
            [
                items,
            ],
        );

    /*
     * Por ahora "aprobadas" equivale a evidencias
     * que tienen archivo.
     *
     * Si después tienes un campo específico
     * approved/status en el backend, lo cambiamos.
     */
    const approvedCount =
        submittedCount;

    const pendingCount =
        useMemo(
            () =>
                items.filter(
                    (
                        item,
                    ) =>
                        !item.fileUrl,
                ).length,
            [
                items,
            ],
        );

    /* =====================================================
       RETORNO
    ===================================================== */

    return {
        numericCourseId,

        isAdminRoute,
        isTeacherRoute,
        canUpload,

        items,

        loading,
        refreshing,
        error,

        uploadingBlockId,

        totalCount,
        submittedCount,
        approvedCount,
        pendingCount,

        refresh,
        handleUpload,
    };
}