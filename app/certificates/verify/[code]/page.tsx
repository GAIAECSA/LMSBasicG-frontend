"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

function normalizeApiBaseUrl(url: string) {
    const cleanUrl = url.trim().replace(/\/+$/, "");

    if (cleanUrl.endsWith("/api/v1")) {
        return cleanUrl;
    }

    return `${cleanUrl}/api/v1`;
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_URL);
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, "");

type CertificateResponse = {
    id?: number;
    certificate_code?: string;
    file_url?: string | null;
    pdf_url?: string | null;
    certificate_url?: string | null;
    url?: string | null;
    path?: string | null;
};

function buildFileUrl(url: string | null | undefined) {
    if (!url) return "";

    const cleanUrl = url.trim();

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("data:")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_ORIGIN}${cleanUrl}`;
    }

    return `${API_ORIGIN}/${cleanUrl}`;
}

function getCertificateFileUrl(certificate: CertificateResponse) {
    return buildFileUrl(
        certificate.file_url ||
        certificate.pdf_url ||
        certificate.certificate_url ||
        certificate.url ||
        certificate.path ||
        "",
    );
}

export default function VerifyCertificatePage() {
    const params = useParams<{ code: string }>();

    const [message, setMessage] = useState("Verificando certificado...");
    const [fileUrl, setFileUrl] = useState("");

    useEffect(() => {
        async function redirectToCurrentFile() {
            try {
                const code = params.code;

                if (!code) {
                    setMessage("Código de certificado no válido.");
                    return;
                }

                setMessage("Buscando certificado generado...");

                const response = await fetch(
                    `${API_BASE_URL}/certificates/code/${encodeURIComponent(
                        code,
                    )}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                        cache: "no-store",
                    },
                );

                if (!response.ok) {
                    setMessage("No se pudo verificar el certificado.");
                    return;
                }

                const certificate =
                    (await response.json()) as CertificateResponse;

                const nextFileUrl = getCertificateFileUrl(certificate);

                if (!nextFileUrl) {
                    setMessage("El certificado no tiene archivo disponible.");
                    return;
                }

                setFileUrl(nextFileUrl);
                setMessage("Abriendo certificado...");

                window.location.replace(nextFileUrl);
            } catch {
                setMessage("Ocurrió un error al abrir el certificado.");
            }
        }

        void redirectToCurrentFile();
    }, [params.code]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />

                <h1 className="mt-5 text-xl font-black text-slate-950">
                    Certificado digital
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {message}
                </p>

                {fileUrl ? (
                    <a
                        href={fileUrl}
                        className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
                    >
                        Abrir certificado
                    </a>
                ) : null}
            </div>
        </main>
    );
}