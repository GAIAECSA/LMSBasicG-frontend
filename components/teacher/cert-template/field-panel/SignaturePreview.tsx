import type { CertificateFieldWithFormat } from "../types";
import {
    isSignatureField,
    toCssImageUrl,
} from "../utils";

type SignaturePreviewProps = {
    selectedField: CertificateFieldWithFormat;
};

export function SignaturePreview({
    selectedField,
}: SignaturePreviewProps) {
    if (
        !isSignatureField(selectedField) ||
        !selectedField.signatureImage
    ) {
        return null;
    }

    return (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-2 sm:rounded-2xl">
            <div
                className="h-12 w-full bg-contain bg-center bg-no-repeat sm:h-14"
                style={{
                    backgroundImage: toCssImageUrl(
                        selectedField.signatureImage,
                    ),
                }}
            />
        </div>
    );
}
