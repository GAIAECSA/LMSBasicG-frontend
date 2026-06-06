import {
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { COURSE_PRESENTATION_THEME as theme } from "../constants";

type StatusBadgeProps = {
    active: boolean;
    activeText: string;
    inactiveText: string;
};

export function StatusBadge({
    active,
    activeText,
    inactiveText,
}: StatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black sm:px-3 sm:text-xs ${
                active
                    ? theme.successSoft
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
            }`}
        >
            {active ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
                <XCircle className="h-3.5 w-3.5" />
            )}

            {active
                ? activeText
                : inactiveText}
        </span>
    );
}

export default StatusBadge;
