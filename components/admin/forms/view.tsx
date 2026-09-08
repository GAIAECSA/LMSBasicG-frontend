"use client";

import type {
    FormDocumentType,
} from "./types";

import {
    useFormDocument,
} from "./hook";

import {
    FormHero,
} from "./ui/FormHero";

import {
    GeneralInformation,
} from "./ui/GeneralInformation";

import {
    RecordsTable,
} from "./ui/RecordsTable";

import {
    FormActions,
} from "./ui/FormActions";

import {
    FormPreviewModal,
} from "./ui/FormPreviewModal";

export function FormDocumentView({
    type,
}: {
    type: FormDocumentType;
}) {
    const form =
        useFormDocument(type);

    return (
        <>
            <section className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6">

                <div className="mx-auto w-full max-w-[1450px] space-y-4">

                    <FormHero
                        title={
                            form.config
                                .title
                        }
                        description={
                            form.config
                                .description
                        }
                    />

                    <GeneralInformation
                        form={form}
                    />

                    <RecordsTable
                        form={form}
                    />

                    <FormActions
                        form={form}
                    />

                </div>
            </section>

            {/* MODAL VISTA PREVIA */}
            <FormPreviewModal
                form={form}
            />

            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #gaia-print-document,
                    #gaia-print-document * {
                        visibility: visible !important;
                    }

                    #gaia-print-document {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;

                        margin: 0 !important;

                        border: none !important;
                        border-radius: 0 !important;

                        box-shadow: none !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }

                @page {
                    size: A4 landscape;
                    margin: 8mm;
                }
            `}</style>
        </>
    );
}

export default FormDocumentView;