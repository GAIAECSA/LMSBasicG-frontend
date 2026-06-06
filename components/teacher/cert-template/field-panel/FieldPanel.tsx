import type { ChangeEvent } from "react";
import type { CertificateFieldType } from "@/services/certificates.service";
import type { CertificateFieldWithFormat } from "../types";
import { FieldEditorGrid } from "./FieldEditorGrid";
import { FieldPanelHeader } from "./FieldPanelHeader";
import { SignaturePreview } from "./SignaturePreview";

type FieldPanelProps = {
    selectedField: CertificateFieldWithFormat | null;
    onUpdateField: (
        fieldId: string,
        changes: Partial<CertificateFieldWithFormat>,
    ) => void;
    onChangeFieldType: (
        fieldId: string,
        nextType: CertificateFieldType,
    ) => void;
    onSignatureUpload: (
        event: ChangeEvent<HTMLInputElement>,
        fieldId: string,
    ) => void;
    onDeleteField: (fieldId: string) => void;
};

export function FieldPanel({
    selectedField,
    onUpdateField,
    onChangeFieldType,
    onSignatureUpload,
    onDeleteField,
}: FieldPanelProps) {
    if (!selectedField) {
        return (
            <div className="border-t border-slate-100 bg-white px-3 py-3 sm:px-4">
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-bold leading-5 text-slate-500 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                    Selecciona un campo dentro del certificado para editarlo rápidamente.
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-0 border-t border-slate-100 bg-white px-3 py-3 sm:px-4">
            <FieldPanelHeader
                selectedField={selectedField}
                onSignatureUpload={onSignatureUpload}
                onDeleteField={onDeleteField}
            />

            <FieldEditorGrid
                selectedField={selectedField}
                onUpdateField={onUpdateField}
                onChangeFieldType={onChangeFieldType}
            />

            <SignaturePreview selectedField={selectedField} />
        </div>
    );
}

export default FieldPanel;
