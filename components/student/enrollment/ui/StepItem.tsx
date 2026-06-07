import { CheckCircle2 } from "lucide-react";

type StepItemProps = {
    number: number;
    title: string;
    description: string;
    active?: boolean;
    done?: boolean;
};

export function StepItem({
    number,
    title,
    description,
    active = false,
    done = false,
}: StepItemProps) {
    return (
        <div className="flex min-w-0 gap-3">
            <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black sm:h-9 sm:w-9 sm:text-sm ${
                    done
                        ? "bg-[var(--success)] text-white"
                        : active
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
            >
                {done ? (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                    number
                )}
            </div>

            <div className="min-w-0">
                <p className="break-words text-xs font-black text-[var(--foreground)] sm:text-sm">
                    {title}
                </p>

                <p className="mt-0.5 break-words text-[11px] font-semibold leading-5 text-[var(--muted-foreground)] sm:mt-1 sm:text-xs">
                    {description}
                </p>
            </div>
        </div>
    );
}

export default StepItem;
