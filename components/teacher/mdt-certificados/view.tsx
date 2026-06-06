"use client";

import type { MdtCertificatesTeacherViewProps } from "./types";
import { useMdtCertificatesTeacher } from "./hook";
import { Alerts } from "./ui/Alerts";
import { Hero } from "./ui/Hero";
import { Toolbar } from "./ui/Toolbar";
import { CertificatesTable } from "./ui/CertificatesTable";
import { UploadModal } from "./ui/UploadModal";
import { EditModal } from "./ui/EditModal";
import { DeleteModal } from "./ui/DeleteModal";

export function MdtCertificatesTeacherView({
    initialCourseId = 0,
    lockCourse = false,
}: MdtCertificatesTeacherViewProps) {
    const certs = useMdtCertificatesTeacher({
        initialCourseId,
        lockCourse,
    });

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-3 text-slate-950 sm:px-4 sm:py-4 lg:px-5 xl:px-6 [@media(max-height:760px)]:py-3">
            <section className="mx-auto w-full max-w-[1480px] space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-3">
                <Alerts
                    error={certs.errorMessage}
                    success={certs.successMessage}
                />

                <Hero
                    total={certs.certificates.length}
                    active={certs.activeCount}
                    deleted={certs.deletedCount}
                />

                <Toolbar certs={certs} />

                <CertificatesTable certs={certs} />
            </section>

            <UploadModal certs={certs} />
            <EditModal certs={certs} />
            <DeleteModal certs={certs} />
        </main>
    );
}

export default MdtCertificatesTeacherView;
