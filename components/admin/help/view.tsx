"use client";

import { useHelpPage } from "./hook";
import { HelpHero } from "./ui/HelpHero";
import { SupportFeatures } from "./ui/SupportFeatures";
import { SupportRequestForm } from "./ui/SupportRequestForm";
import { SupportSidebar } from "./ui/SupportSidebar";

export function HelpPageView() {
    const help = useHelpPage();

    return (
        <section className="min-h-screen bg-[var(--background)] px-3 py-3 pt-16 text-[var(--foreground)] sm:px-4 md:px-5 md:pt-4 lg:px-6 xl:px-8 [@media(max-height:760px)]:py-3">
            <div className="mx-auto w-full max-w-[1450px] space-y-3 sm:space-y-4">
                <HelpHero />

                <SupportFeatures />

                <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_290px] xl:grid-cols-[minmax(0,1fr)_320px]">
                    <SupportRequestForm
                        help={help}
                    />

                    <SupportSidebar />
                </div>
            </div>
        </section>
    );
}

export default HelpPageView;
