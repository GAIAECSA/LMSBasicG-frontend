import type {
    FormDocumentState,
} from "../hook";

export function GeneralInformation({
    form,
}: {
    form: FormDocumentState;
}) {
    if (
        form.config
            .generalFields
            .length === 0
    ) {
        return null;
    }

    return (
        <div className="no-print rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
                <h2 className="text-xl font-black">
                    Información general
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Datos que aparecerán en el encabezado del documento.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {form.config.generalFields.map(
                    (field) => (
                        <div
                            key={
                                field.key
                            }
                        >
                            <label className="mb-1.5 block text-sm font-bold text-slate-700">
                                {
                                    field.label
                                }
                            </label>

                            <input
                                type={
                                    field.type ??
                                    "text"
                                }
                                value={
                                    form
                                        .formState
                                        .general[
                                    field
                                        .key
                                    ]
                                }
                                onChange={(
                                    event,
                                ) =>
                                    form.updateGeneral(
                                        field.key,
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    ),
                )}

            </div>
        </div>
    );
}