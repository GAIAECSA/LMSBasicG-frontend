import {
    FileUp,
    Loader2,
} from "lucide-react";
import type { MdtRequiredFilesState } from "../hook";
import { REQUIRED_FILE_BLOCK_TYPE_ID } from "../constants";
import { RequiredFileCard } from "./RequiredFileCard";

type FilesListProps = {
    files: MdtRequiredFilesState;
};

export function FilesList({
    files,
}: FilesListProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
            {files.isLoading ? (
                <div className="flex items-center gap-2 p-4 text-xs font-bold text-slate-500 sm:p-5 sm:text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando archivos MDT...
                </div>
            ) : null}

            {!files.isLoading &&
            files.filteredBlocks.length === 0 ? (
                <div className="m-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:m-4 sm:rounded-2xl sm:p-8">
                    <FileUp className="mx-auto h-9 w-9 text-slate-400 sm:h-10 sm:w-10" />

                    <h3 className="mt-3 text-sm font-black text-slate-900 sm:mt-4 sm:text-base">
                        No hay archivos obligatorios registrados
                    </h3>

                    <p className="mx-auto mt-2 max-w-xl text-xs font-semibold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                        Los archivos MDT aparecerán aquí cuando existan
                        bloques del tipo #{REQUIRED_FILE_BLOCK_TYPE_ID}.
                    </p>
                </div>
            ) : null}

            {!files.isLoading &&
            files.filteredBlocks.length > 0 ? (
                <div className="grid gap-3 p-3 sm:p-4">
                    {files.filteredBlocks.map(
                        (block) => (
                            <RequiredFileCard
                                key={block.id}
                                block={block}
                                lessons={files.lessons}
                                isSaving={files.isSaving}
                                isLoadingVerifications={
                                    files.isLoadingVerifications
                                }
                                onVerify={
                                    files.openVerifyModal
                                }
                                onEdit={
                                    files.openEditModal
                                }
                                onDelete={
                                    files.openDeleteModal
                                }
                            />
                        ),
                    )}
                </div>
            ) : null}
        </section>
    );
}
