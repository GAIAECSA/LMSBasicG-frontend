import type { ChangeEvent } from "react";
import type {
    CertificateFieldType,
    CertificateQrConfig,
} from "@/services/certificates.service";
import type { CertificateFieldWithFormat } from "../types";
import { AddFields } from "./AddFields";
import { FieldPanel } from "./FieldPanel";
import { QrPanel } from "./QrPanel";

type SidePanelProps = {
    isAddFieldsOpen: boolean;
    selectedField: CertificateFieldWithFormat | null;
    qrConfig: CertificateQrConfig;
    onToggleAddFields: () => void;
    onAddField: (type: CertificateFieldType) => void;
    onUpdateQrConfig: (changes: Partial<CertificateQrConfig>) => void;
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

export function SidePanel({
    isAddFieldsOpen,
    selectedField,
    qrConfig,
    onToggleAddFields,
    onAddField,
    onUpdateQrConfig,
    onUpdateField,
    onChangeFieldType,
    onSignatureUpload,
    onDeleteField,
}: SidePanelProps) {
    return (
        <aside className="space-y-5 xl:sticky xl:top-5 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pr-1">
            <AddFields
                isOpen={isAddFieldsOpen}
                onToggle={onToggleAddFields}
                onAddField={onAddField}
            />

            <QrPanel
                qrConfig={qrConfig}
                onUpdateQrConfig={onUpdateQrConfig}
            />

            <FieldPanel
                selectedField={selectedField}
                onUpdateField={onUpdateField}
                onChangeFieldType={onChangeFieldType}
                onSignatureUpload={onSignatureUpload}
                onDeleteField={onDeleteField}
            />
        </aside>
    );
}