"use client";

import type { CertificateTemplateWorkspaceProps } from "./types";
import { useCertTemplate } from "./hook";
import { Loading } from "./ui/Loading";
import { CourseSelect } from "./ui/CourseSelect";
import { Header } from "./ui/Header";
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
            <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
                    <Loading numericCourseId={cert.numericCourseId} />
                </div>
            </div>
        );
    }

    if (cert.numericCourseId <= 0) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
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
            <section className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1500px]">
                    <div className="rounded-[2rem] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
                        <p className="text-sm font-semibold text-slate-600">
                            No se pudo cargar la plantilla del certificado.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-6">
                <Header
                    isAdminRoute={cert.isAdminRoute}
                    selectedCourseName={cert.selectedCourseName}
                    fieldsCount={cert.template.fields.length}
                    qrEnabled={Boolean(cert.qrConfig.enabled)}
                />

                <div className="rounded-[2rem] border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 md:p-6">
                    <Toolbar
                        backHref={cert.backHref}
                        backLabel={cert.backLabel}
                        isAdminRoute={cert.isAdminRoute}
                        routeCourseId={cert.routeCourseId}
                        numericCourseId={cert.numericCourseId}
                        courseOptions={cert.courseOptions}
                        isSavingTemplate={cert.isSavingTemplate}
                        isGenerating={cert.isGenerating}
                        onSelectCourse={cert.handleSelectCourse}
                        onBackgroundUpload={cert.handleBackgroundUpload}
                        onSaveTemplate={cert.handleSaveTemplate}
                        onGeneratePdf={cert.handleGeneratePdf}
                    />
                </div>

                <Alerts error={cert.error} notice={cert.notice} />

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
                    <div className="min-w-0 overflow-hidden rounded-[2rem] border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 md:p-6">
                        <Canvas
                            certificateRef={cert.certificateRef}
                            template={cert.template}
                            selectedFieldId={cert.selectedFieldId}
                            isDraggingQr={cert.isDraggingQr}
                            onPointerMove={cert.handlePointerMove}
                            onPointerUp={cert.handlePointerUp}
                            onFieldPointerDown={cert.handlePointerDown}
                            onQrPointerDown={cert.handleQrPointerDown}
                        />
                    </div>

                    <div className="min-w-0 rounded-[2rem] border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 md:p-6">
                        <SidePanel
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
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CertificateTemplateWorkspace;