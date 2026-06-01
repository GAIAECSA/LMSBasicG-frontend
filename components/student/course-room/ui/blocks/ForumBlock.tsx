"use client";

import { useState } from "react";
import {
    ClipboardList,
    Loader2,
    MessageCircle,
    MessageSquarePlus,
    Send,
    X,
} from "lucide-react";
import type { LessonBlock } from "@/services/lessons.service";
import type { CourseRoomHook } from "../../hook";
import {
    getBlockDescription,
    getBlockTitle,
    getForumAuthor,
    getResponseEnrollmentId,
    getStudentResponseDate,
    getStudentResponseText,
} from "../../utils";

type ForumBlockProps = {
    room: CourseRoomHook;
    block?: LessonBlock;
    active?: boolean;
    onSelect?: (block: LessonBlock) => void;
};

type AnyRecord = Record<string, unknown>;

type PostRecord = {
    id?: number | string;
    created_at?: string | null;
};

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AnyRecord;
}

function parseJsonRecord(value: unknown): AnyRecord {
    const directRecord = toRecord(value);

    if (directRecord) return directRecord;

    if (typeof value !== "string") return {};

    try {
        const parsed = JSON.parse(value) as unknown;
        const parsedRecord = toRecord(parsed);

        return parsedRecord ?? {};
    } catch {
        return {};
    }
}

function readText(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return String(value).trim();

    return "";
}

function readFirstText(record: AnyRecord, keys: string[]): string {
    for (const key of keys) {
        const value = readText(record[key]);

        if (value) return value;
    }

    return "";
}

function getForumInstruction(block: LessonBlock): string {
    const blockRecord = parseJsonRecord(block);
    const contentRecord = parseJsonRecord(blockRecord.content);
    const forumRecord = parseJsonRecord(contentRecord.forum);

    const instructionKeys = [
        "instruction",
        "instructions",
        "instruccion",
        "instrucciones",
        "consigna",
        "forum_instruction",
        "forum_instructions",
        "forumInstruction",
        "forumInstructions",
        "forum_consigna",
        "prompt",
        "question",
        "statement",
    ];

    return (
        readFirstText(contentRecord, instructionKeys) ||
        readFirstText(forumRecord, instructionKeys) ||
        readFirstText(blockRecord, instructionKeys)
    );
}

function getForumDescription(block: LessonBlock): string {
    const blockRecord = parseJsonRecord(block);
    const contentRecord = parseJsonRecord(blockRecord.content);

    const descriptionKeys = [
        "description",
        "descripcion",
        "forum_description",
        "forumDescription",
    ];

    return (
        readFirstText(contentRecord, descriptionKeys) ||
        readFirstText(blockRecord, descriptionKeys) ||
        getBlockDescription(block)
    );
}

function getPostKey(post: unknown, index: number) {
    if (!post || typeof post !== "object") {
        return `forum-post-${index}`;
    }

    const item = post as PostRecord;

    return `${item.id ?? index}-${item.created_at ?? index}`;
}

export function ForumBlock({
    room,
    block,
    active = true,
    onSelect,
}: ForumBlockProps) {
    const [openModal, setOpenModal] = useState(false);

    const currentBlockValue = block ?? room.selectedBlock;

    if (!currentBlockValue) return null;

    const currentBlock = currentBlockValue as LessonBlock;
    const isSelected = room.selectedBlock?.id === currentBlock.id;
    const canWrite = active && isSelected;

    const title = getBlockTitle(currentBlock);
    const description = getForumDescription(currentBlock);
    const instruction = getForumInstruction(currentBlock);
    const posts = room.forumResponses[currentBlock.id] ?? [];

    const hasCurrentStudentPost = posts.some(
        (post) => getResponseEnrollmentId(post) === room.enrollmentId,
    );

    const canSubmit =
        canWrite &&
        !room.studentResponseSaving &&
        room.forumText.trim().length > 0;

    function handleSelectCurrentBlock() {
        if (!isSelected) {
            onSelect?.(currentBlock);
        }
    }

    function handleOpenModal() {
        handleSelectCurrentBlock();
        setOpenModal(true);
    }

    function handleCloseModal() {
        if (room.studentResponseSaving) return;

        setOpenModal(false);
    }

    async function handleSubmitForum() {
        if (!canSubmit) return;

        await Promise.resolve(room.handleSubmitForumResponse());
        setOpenModal(false);
    }

    return (
        <>
            <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                                <MessageCircle className="h-3.5 w-3.5" />
                                Foro
                            </div>

                            <h2 className="text-xl font-black text-slate-950">
                                {title}
                            </h2>

                            {description ? (
                                <p className="mt-3 max-w-4xl whitespace-pre-line text-sm font-semibold leading-6 text-slate-600">
                                    {description}
                                </p>
                            ) : null}

                            {instruction ? (
                                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-700">
                                        <ClipboardList className="h-4 w-4" />
                                        Consigna o instrucción del foro
                                    </div>

                                    <p className="whitespace-pre-line text-sm font-semibold leading-6 text-blue-900">
                                        {instruction}
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                                    Este foro está disponible para registrar
                                    participaciones relacionadas con el tema
                                    indicado.
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleOpenModal}
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95"
                        >
                            <MessageSquarePlus className="h-4 w-4" />
                            Nueva participación
                        </button>
                    </div>

                    {hasCurrentStudentPost ? (
                        <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                            Ya registraste al menos una participación en este
                            foro.
                        </p>
                    ) : null}

                    {room.studentResponseMessage ? (
                        <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                            {room.studentResponseMessage}
                        </p>
                    ) : null}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-black text-slate-950">
                                Participaciones
                            </h3>
                            <p className="text-xs font-bold text-slate-500">
                                Respuestas registradas por los estudiantes.
                            </p>
                        </div>
                    </div>

                    {posts.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                            Todavía no existen participaciones en este foro.
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {posts.map((post, index) => (
                                <article
                                    key={getPostKey(post, index)}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-black text-slate-900">
                                            {getForumAuthor(post)}
                                        </p>

                                        <p className="text-xs font-bold text-slate-400">
                                            {getStudentResponseDate(post)}
                                        </p>
                                    </div>

                                    <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-600">
                                        {getStudentResponseText(post) ||
                                            "Sin contenido."}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {openModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                                    Nueva participación
                                </p>
                                <h3 className="mt-1 text-lg font-black text-slate-950">
                                    {title}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={room.studentResponseSaving}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                                    Tema relacionado
                                </p>
                                <p className="mt-1 text-sm font-bold leading-6 text-blue-900">
                                    {title}
                                </p>
                            </div>

                            {instruction ? (
                                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                                        Consigna o instrucción
                                    </p>
                                    <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-slate-700">
                                        {instruction}
                                    </p>
                                </div>
                            ) : null}

                            <label className="block">
                                <span className="text-sm font-black text-slate-900">
                                    Escribe tu participación
                                </span>

                                <textarea
                                    value={room.forumText}
                                    onChange={(event) =>
                                        room.setForumText(event.target.value)
                                    }
                                    rows={6}
                                    placeholder="Escribe tu aporte para el foro..."
                                    disabled={
                                        !canWrite ||
                                        room.studentResponseSaving
                                    }
                                    className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                />
                            </label>

                            {room.studentResponseMessage ? (
                                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-700">
                                    {room.studentResponseMessage}
                                </div>
                            ) : null}

                            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={room.studentResponseSaving}
                                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSubmitForum}
                                    disabled={!canSubmit}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {room.studentResponseSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}

                                    Publicar participación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}