import type { ReactNode } from "react";

interface PrintThProps {
    children: ReactNode;
    colSpan?: number;
    rowSpan?: number;
    className?: string;
}

export function PrintTh({
    children,
    colSpan,
    rowSpan,
    className = "",
}: PrintThProps) {
    return (
        <th
            colSpan={colSpan}
            rowSpan={rowSpan}
            className={`
                border
                border-black
                px-2
                py-2
                text-center
                align-middle
                font-black
                ${className}
            `}
        >
            {children}
        </th>
    );
}

interface PrintTdProps {
    children?: ReactNode;
    center?: boolean;
    colSpan?: number;
    rowSpan?: number;
    className?: string;
}

export function PrintTd({
    children,
    center = false,
    colSpan,
    rowSpan,
    className = "",
}: PrintTdProps) {
    return (
        <td
            colSpan={colSpan}
            rowSpan={rowSpan}
            className={`
                border
                border-black
                px-2
                py-1
                align-middle
                ${center ? "text-center" : ""}
                ${className}
            `}
        >
            {children}
        </td>
    );
}