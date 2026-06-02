import { BLOCK_TYPE_IDS } from "../constants";
import type { LessonItemState } from "../hook";

import {
    ExternalLink,
    Save,
    Video,
} from "lucide-react";

type VideoSectionProps = {
    item: LessonItemState;
};

type PreviewType = "iframe" | "video" | "external" | "empty";

type VideoPreview = {
    type: PreviewType;
    url: string;
    label: string;
};

function getYoutubeVideoId(url: string) {
    const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/i,
        /youtube\.com\/embed\/([^?&/]+)/i,
        /youtube\.com\/shorts\/([^?&/]+)/i,
        /youtu\.be\/([^?&/]+)/i,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);

        if (match?.[1]) {
            return match[1];
        }
    }

    return "";
}

function getVimeoVideoId(url: string) {
    const match = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);

    return match?.[1] ?? "";
}

function isDirectVideoUrl(url: string) {
    return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url.trim());
}

function getVideoPreview(
    videoUrl: string,
    videoProvider: string,
): VideoPreview {
    const cleanUrl = videoUrl.trim();
    const provider = videoProvider.trim().toLowerCase();

    if (!cleanUrl) {
        return {
            type: "empty",
            url: "",
            label: "",
        };
    }

    const youtubeId = getYoutubeVideoId(cleanUrl);

    if (
        youtubeId ||
        provider === "youtube"
    ) {
        return youtubeId
            ? {
                type: "iframe",
                url: `https://www.youtube.com/embed/${youtubeId}`,
                label: "Vista previa de YouTube",
            }
            : {
                type: "external",
                url: cleanUrl,
                label: "Enlace de YouTube",
            };
    }

    const vimeoId = getVimeoVideoId(cleanUrl);

    if (
        vimeoId ||
        provider === "vimeo"
    ) {
        return vimeoId
            ? {
                type: "iframe",
                url: `https://player.vimeo.com/video/${vimeoId}`,
                label: "Vista previa de Vimeo",
            }
            : {
                type: "external",
                url: cleanUrl,
                label: "Enlace de Vimeo",
            };
    }

    if (
        isDirectVideoUrl(cleanUrl) ||
        ["direct", "mp4", "webm"].includes(provider)
    ) {
        return {
            type: "video",
            url: cleanUrl,
            label: "Vista previa del archivo de video",
        };
    }

    if (
        [
            "microsoft",
            "microsoft-stream",
            "stream",
            "sharepoint",
            "onedrive",
        ].includes(provider) ||
        cleanUrl.includes("stream.microsoft.com") ||
        cleanUrl.includes("sharepoint.com") ||
        cleanUrl.includes("onedrive.live.com") ||
        cleanUrl.includes("1drv.ms")
    ) {
        return {
            type: "iframe",
            url: cleanUrl,
            label: "Vista previa del video de Microsoft",
        };
    }

    return {
        type: "external",
        url: cleanUrl,
        label: "Enlace externo",
    };
}

function detectProvider(videoUrl: string) {
    const cleanUrl = videoUrl.trim().toLowerCase();

    if (
        cleanUrl.includes("youtube.com") ||
        cleanUrl.includes("youtu.be")
    ) {
        return "youtube";
    }

    if (cleanUrl.includes("vimeo.com")) {
        return "vimeo";
    }

    if (
        cleanUrl.includes("stream.microsoft.com") ||
        cleanUrl.includes("microsoftstream.com")
    ) {
        return "microsoft-stream";
    }

    if (cleanUrl.includes("sharepoint.com")) {
        return "sharepoint";
    }

    if (
        cleanUrl.includes("onedrive.live.com") ||
        cleanUrl.includes("1drv.ms")
    ) {
        return "onedrive";
    }

    if (isDirectVideoUrl(cleanUrl)) {
        return "direct";
    }

    return "external";
}

export function VideoSection({ item }: VideoSectionProps) {
    if (item.itemType !== "video") return null;

    const preview = getVideoPreview(
        item.form.video_url,
        item.form.video_provider,
    );

    function handleVideoUrlChange(value: string) {
        item.setForm((current) => ({
            ...current,
            video_url: value,
            video_provider: value.trim()
                ? detectProvider(value)
                : current.video_provider,
        }));
    }

    return (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-6 py-5">
                <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#172861] text-white shadow-sm">
                        <Video className="h-6 w-6" />
                    </span>

                    <div>
                        <h2 className="text-xl font-black text-slate-950">
                            Video de la lección
                        </h2>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Agrega un enlace de YouTube, Vimeo, Microsoft
                            Stream o un archivo de video público.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                    <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-slate-700">
                            URL del video
                        </label>

                        <input
                            value={item.form.video_url}
                            onChange={(event) =>
                                handleVideoUrlChange(event.target.value)
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[13px] font-bold text-slate-700">
                            Proveedor
                        </label>

                        <select
                            value={item.form.video_provider}
                            onChange={(event) =>
                                item.setForm((current) => ({
                                    ...current,
                                    video_provider: event.target.value,
                                }))
                            }
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                            <option value="youtube">YouTube</option>
                            <option value="vimeo">Vimeo</option>
                            <option value="microsoft-stream">
                                Microsoft Stream
                            </option>
                            <option value="sharepoint">SharePoint</option>
                            <option value="onedrive">OneDrive</option>
                            <option value="direct">
                                Enlace directo de video
                            </option>
                            <option value="external">
                                Otro enlace externo
                            </option>
                        </select>
                    </div>
                </div>

                {preview.type !== "empty" ? (
                    <div className="max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <Video className="h-4 w-4" />
                                </span>

                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                                        Vista previa
                                    </p>

                                    <p className="text-sm font-black text-slate-800">
                                        {preview.label}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={item.form.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Abrir
                            </a>
                        </div>

                        {preview.type === "iframe" ? (
                            <iframe
                                src={preview.url}
                                title={preview.label}
                                className="aspect-video w-full bg-black"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                            />
                        ) : null}

                        {preview.type === "video" ? (
                            <video
                                src={preview.url}
                                controls
                                preload="metadata"
                                className="aspect-video w-full bg-black object-contain"
                            />
                        ) : null}

                        {preview.type === "external" ? (
                            <div className="flex min-h-[170px] flex-col items-center justify-center px-6 py-8 text-center">
                                <Video className="h-9 w-9 text-slate-400" />

                                <p className="mt-3 text-sm font-black text-slate-700">
                                    Este proveedor no permite mostrar una
                                    previsualización automática.
                                </p>

                                <p className="mt-1 max-w-md text-xs font-semibold leading-5 text-slate-500">
                                    Puedes comprobar el contenido mediante el
                                    botón Abrir. El enlace se guardará para que
                                    el estudiante pueda consultarlo.
                                </p>
                            </div>
                        ) : null}
                    </div>
                ) : null}


                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={
                            item.saving ||
                            !item.form.video_url.trim()
                        }
                        className="inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-2xl bg-[#172861] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f1d48] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                    >
                        <Save className="h-4 w-4" />

                        {item.saving
                            ? "Guardando..."
                            : "Guardar cambios"}
                    </button>
                </div>

                <p className="text-xs font-semibold text-slate-400">
                    Se guardará con block_type_id {BLOCK_TYPE_IDS.video} y
                    completion_type VER.
                </p>
            </div>
        </section>
    );
}

export default VideoSection;