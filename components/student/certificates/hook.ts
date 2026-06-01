"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCertificatesByUser } from "@/services/certificates.service";
import { getEnrollmentsByUserForCertificates } from "./api";
import type {
    CertificateStatusFilter,
    CertificateWithExtraFields,
} from "./types";
import {
    getFilteredCertificates,
    getInitials,
    getUserFullName,
    isApprovedEnrollmentForCertificate,
    isCertificateGeneratedAfterFinish,
    toNumericId,
} from "./utils";

export function useStudentCertificates() {
    const { user } = useAuth();

    const numericUserId = toNumericId(user?.id);
    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    const [certificates, setCertificates] = useState<
        CertificateWithExtraFields[]
    >([]);
    const [selectedCertificate, setSelectedCertificate] =
        useState<CertificateWithExtraFields | null>(null);
    const [statusFilter, setStatusFilter] =
        useState<CertificateStatusFilter>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const validCertificatesCount = certificates.filter(
        isCertificateGeneratedAfterFinish,
    ).length;

    const filteredCertificates = useMemo(
        () => getFilteredCertificates(certificates, statusFilter, searchTerm),
        [certificates, statusFilter, searchTerm],
    );

    const fetchCertificates = useCallback(async () => {
        if (!numericUserId) {
            return [];
        }

        const [certificatesData, enrollmentsData] = await Promise.all([
            getCertificatesByUser(numericUserId, {
                onlyValid: true,
            }),
            getEnrollmentsByUserForCertificates(numericUserId),
        ]);

        const userCertificates = Array.isArray(certificatesData)
            ? (certificatesData as CertificateWithExtraFields[])
            : [];

        const userEnrollments = Array.isArray(enrollmentsData)
            ? enrollmentsData
            : [];

        return userCertificates.filter((certificate) => {
            const certificateUserId = toNumericId(certificate.user_id);

            const belongsToCurrentUser =
                certificateUserId === null || certificateUserId === numericUserId;

            const hasApprovedEnrollment = userEnrollments.some((enrollment) =>
                isApprovedEnrollmentForCertificate(enrollment, certificate),
            );

            return (
                belongsToCurrentUser &&
                hasApprovedEnrollment &&
                isCertificateGeneratedAfterFinish(certificate)
            );
        });
    }, [numericUserId]);

    const loadCertificates = useCallback(async () => {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await fetchCertificates();

            setCertificates(data);
        } catch (error) {
            setCertificates([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los certificados.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [fetchCertificates]);

    const refreshCertificates = useCallback(async () => {
        try {
            setIsRefreshing(true);
            setErrorMessage("");

            const data = await fetchCertificates();

            setCertificates(data);
        } catch (error) {
            setCertificates([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron actualizar los certificados.",
            );
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchCertificates]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCertificates();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadCertificates]);

    function openPreviewModal(certificate: CertificateWithExtraFields) {
        setSelectedCertificate(certificate);
    }

    function closePreviewModal() {
        setSelectedCertificate(null);
    }

    return {
        certificates,
        selectedCertificate,
        statusFilter,
        setStatusFilter,
        searchTerm,
        setSearchTerm,
        isLoading,
        isRefreshing,
        errorMessage,
        validCertificatesCount,
        filteredCertificates,
        refreshCertificates,
        openPreviewModal,
        closePreviewModal,
        initials,
    };
}
