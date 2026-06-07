"use client";

import { Toaster } from "sonner";

export function AppToaster() {
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3500}
            visibleToasts={4}
            expand
            toastOptions={{
                classNames: {
                    toast: "font-semibold",
                    title: "text-sm font-black",
                    description:
                        "text-xs font-medium",
                },
            }}
        />
    );
}