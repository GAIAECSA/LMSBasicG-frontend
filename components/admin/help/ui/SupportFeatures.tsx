import {
    BookOpen,
    Headphones,
    ShieldCheck,
} from "lucide-react";
import { SUPPORT_FEATURES } from "../constants";
import type { SupportFeature } from "../types";

function FeatureIcon({
    type,
}: {
    type: SupportFeature["key"];
}) {
    if (type === "academic") {
        return (
            <BookOpen className="h-5 w-5" />
        );
    }

    if (type === "security") {
        return (
            <ShieldCheck className="h-5 w-5" />
        );
    }

    return (
        <Headphones className="h-5 w-5" />
    );
}

export function SupportFeatures() {
    return (
        <div className="grid gap-2.5 md:grid-cols-3 sm:gap-3">
            {SUPPORT_FEATURES.map(
                (feature) => (
                    <article
                        key={feature.key}
                        className="rounded-xl border border-[var(--border)] p-3 shadow-sm sm:rounded-2xl sm:p-4"
                        style={{
                            background:
                                "var(--gradient-card)",
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--secondary-foreground)] sm:h-10 sm:w-10 sm:rounded-2xl">
                                <FeatureIcon
                                    type={
                                        feature.key
                                    }
                                />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-xs font-black text-[var(--foreground)] sm:text-sm">
                                    {
                                        feature.title
                                    }
                                </h2>

                                <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--muted-foreground)] sm:text-xs">
                                    {
                                        feature.description
                                    }
                                </p>
                            </div>
                        </div>
                    </article>
                ),
            )}
        </div>
    );
}

export default SupportFeatures;
