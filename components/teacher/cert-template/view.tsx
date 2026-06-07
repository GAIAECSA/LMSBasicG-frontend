"use client";

import type { CertificateTemplateWorkspaceProps } from "./types";
import { useCertTemplate } from "./hook";
import { Loading } from "./ui/Loading";
import { CourseSelect } from "./ui/CourseSelect";
import { Toolbar } from "./ui/Toolbar";
import { Alerts } from "./ui/Alerts";
import { Canvas } from "./ui/Canvas";
import { SidePanel } from "./ui/SidePanel";

export function CertificateTemplateWorkspace({
    courseId,
}: CertificateTemplateWorkspaceProps) {
    const cert = useCertTemplate({ courseId });

    if (cert.isLoadingTemplate) {
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1480px]">
                    <Loading />
                </div>
            </div>
        );
    }

    if (cert.numericCourseId <= 0) {
        return (
            <div className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1480px]">
                    <CourseSelect
                        isAdminRoute={cert.isAdminRoute}
                        courseOptions={cert.courseOptions}
                        error={cert.error}
                        onSelectCourse={cert.handleSelectCourse}
                    />
                </div>
            </div>
        );
    }

    if (!cert.template) {
        return (
            <section className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
                <div className="mx-auto w-full max-w-[1480px]">
                    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center shadow-sm sm:rounded-[2rem] sm:p-8">
                        <p className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                            No se pudo cargar la plantilla del certificado.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1480px] space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-3">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-4 lg:p-5 [@media(max-height:760px)]:p-3">
                    <Toolbar
                        backHref={cert.backHref}
                        backLabel={cert.backLabel}
                        isAdminRoute={cert.isAdminRoute}
                        routeCourseId={cert.routeCourseId}
                        numericCourseId={cert.numericCourseId}
                        courseOptions={cert.courseOptions}
                        hasBackgroundImage={cert.hasBackgroundImage}
                        isSavingTemplate={cert.isSavingTemplate}
                        isGenerating={cert.isGenerating}
                        onSelectCourse={cert.handleSelectCourse}
                        onBackgroundUpload={cert.handleBackgroundUpload}
                        onSaveTemplate={cert.handleSaveTemplate}
                        onGeneratePdf={cert.handleGeneratePdf}
                    />
                </div>

                <Alerts error={cert.error} />

                <SidePanel
                    disabled={!cert.hasBackgroundImage}
                    isAddFieldsOpen={cert.isAddFieldsOpen}
                    selectedField={cert.selectedField}
                    qrConfig={cert.qrConfig}
                    onToggleAddFields={cert.toggleAddFields}
                    onAddField={cert.handleAddField}
                    onUpdateQrConfig={cert.updateQrConfig}
                    onUpdateField={cert.updateField}
                    onChangeFieldType={cert.handleFieldTypeChange}
                    onSignatureUpload={cert.handleSignatureUpload}
                    onDeleteField={cert.handleDeleteField}
                />

                <Canvas
                    certificateRef={cert.certificateRef}
                    template={cert.template}
                    selectedFieldId={cert.selectedFieldId}
                    isDraggingQr={cert.isDraggingQr}
                    onBackgroundUpload={cert.handleBackgroundUpload}
                    onPointerMove={cert.handlePointerMove}
                    onPointerUp={cert.handlePointerUp}
                    onFieldPointerDown={cert.handlePointerDown}
                    onQrPointerDown={cert.handleQrPointerDown}
                    onUpdateField={cert.updateField}
                />
            </div>
        </section>
    );
}

export default CertificateTemplateWorkspace;
