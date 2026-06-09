"use client";

import {
    ExternalLink,
    Loader2,
    Video,
} from "lucide-react";
import {
    useState,
} from "react";
import {
    openZoomLtiCourse,
} from "@/services/zoom-lti.service";
import type {
    ZoomLtiLauncherProps,
} from "@/types/live-classes";

export function ZoomLtiLauncher({
    courseId,
    audience,
    className = "",
}: ZoomLtiLauncherProps) {
    const [
        opening,
        setOpening,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    const label =
        audience === "teacher"
            ? "Administrar reuniones en Zoom"
            : "Ver reuniones y grabaciones";

    const handleOpenZoom =
        async () => {
            if (opening) {
                return;
            }

            setError(null);
            setOpening(true);

            try {
                const opened =
                    await openZoomLtiCourse(
                        courseId,
                    );

                if (!opened) {
                    setError(
                        "El navegador bloqueó la nueva pestaña. Permita las ventanas emergentes e intente nuevamente.",
                    );
                }
            } catch (openError) {
                setError(
                    openError instanceof Error
                        ? openError.message
                        : "No fue posible abrir Zoom.",
                );
            } finally {
                setOpening(false);
            }
        };

    return (
        <div
            className={`flex flex-col items-start gap-3 ${className}`}
        >
            <button
                type="button"
                onClick={handleOpenZoom}
                disabled={opening}
                className="inline-flex items-center gap-2 rounded-xl bg-[#172861] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
                {opening ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Video className="h-5 w-5" />
                )}

                {opening
                    ? "Preparando acceso..."
                    : label}

                {!opening ? (
                    <ExternalLink className="h-4 w-4" />
                ) : null}
            </button>

            {error ? (
                <p className="text-sm font-medium text-red-600">
                    {error}
                </p>
            ) : null}
        </div>
    );
}