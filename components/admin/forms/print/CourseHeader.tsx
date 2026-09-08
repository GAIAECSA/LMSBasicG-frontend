import type {
    FormGeneralData,
} from "../types";

import {
    formatDate,
} from "../utils";

interface CourseHeaderProps {
    general: FormGeneralData;

    teacherLabel?: string;

    teacher?: string;

    teacherCi?: string;

    singleDate?: boolean;
}

export function CourseHeader({
    general,
    teacherLabel = "INSTRUCTOR:",
    teacher,
    teacherCi,
    singleDate = false,
}: CourseHeaderProps) {
    return (
        <div className="grid grid-cols-3 border-b-2 border-black text-[10px]">

            {/* CURSO */}
            <div className="border-r border-black">
                <PrintInfo
                    label="CURSO:"
                    value={general.course}
                />

                <PrintInfo
                    label="CÓDIGO:"
                    value={general.code}
                />
            </div>

            {/* INSTRUCTOR / REPRESENTANTE */}
            <div className="border-r border-black">
                <PrintInfo
                    label={teacherLabel}
                    value={
                        teacher ??
                        general.instructor
                    }
                />

                <PrintInfo
                    label="CI:"
                    value={
                        teacherCi ??
                        general.instructorCi
                    }
                />
            </div>

            {/* FECHAS */}
            <div>
                {singleDate ? (
                    <>
                        <PrintInfo
                            label="FECHA:"
                            value={formatDate(
                                general.date,
                            )}
                        />

                        <PrintInfo
                            label=""
                            value=""
                        />
                    </>
                ) : (
                    <>
                        <PrintInfo
                            label="FECHA INICIO:"
                            value={formatDate(
                                general.startDate,
                            )}
                        />

                        <PrintInfo
                            label="FECHA FINAL:"
                            value={formatDate(
                                general.endDate,
                            )}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

interface PrintInfoProps {
    label: string;
    value: string;
}

function PrintInfo({
    label,
    value,
}: PrintInfoProps) {
    return (
        <div className="grid min-h-[28px] grid-cols-[105px_1fr] border-b border-black last:border-b-0">

            <div className="flex items-center border-r border-black px-2 font-black">
                {label}
            </div>

            <div className="flex items-center px-2">
                {value}
            </div>
        </div>
    );
}