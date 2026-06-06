import {
    LifeBuoy,
    Mail,
    MessageCircle,
    Phone,
} from "lucide-react";
import {
    QUICK_QUESTIONS,
    SUPPORT_CHANNELS,
} from "../constants";
import type {
    SupportChannel,
} from "../types";

function ChannelIcon({
    type,
}: {
    type: SupportChannel["key"];
}) {
    if (type === "phone") {
        return (
            <Phone className="h-4 w-4" />
        );
    }

    if (type === "chat") {
        return (
            <MessageCircle className="h-4 w-4" />
        );
    }

    return (
        <Mail className="h-4 w-4" />
    );
}

export function SupportSidebar() {
    return (
        <aside className="min-w-0 space-y-3">
            <section
                className="rounded-2xl border border-[var(--border)] p-3 shadow-sm sm:rounded-3xl sm:p-4"
                style={{
                    background:
                        "var(--gradient-card)",
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--secondary-foreground)] sm:h-10 sm:w-10 sm:rounded-2xl">
                        <LifeBuoy className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div>
                        <h2 className="text-sm font-black text-[var(--foreground)] sm:text-base">
                            Canales
                        </h2>

                        <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted-foreground)] sm:text-xs">
                            Medios de atención.
                        </p>
                    </div>
                </div>

                <div className="mt-3 space-y-2">
                    {SUPPORT_CHANNELS.map(
                        (channel) => (
                            <div
                                key={
                                    channel.key
                                }
                                className="flex min-w-0 items-center gap-2.5 rounded-xl bg-[var(--muted)] px-3 py-2.5 sm:rounded-2xl"
                            >
                                <span className="shrink-0 text-[var(--primary)]">
                                    <ChannelIcon
                                        type={
                                            channel.key
                                        }
                                    />
                                </span>

                                <div className="min-w-0">
                                    <p className="text-[11px] font-black text-[var(--foreground)] sm:text-xs">
                                        {
                                            channel.label
                                        }
                                    </p>

                                    <p
                                        title={
                                            channel.value
                                        }
                                        className="truncate text-[11px] font-semibold text-[var(--muted-foreground)] sm:text-xs"
                                    >
                                        {
                                            channel.value
                                        }
                                    </p>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            </section>
        </aside>
    );
}

export default SupportSidebar;
