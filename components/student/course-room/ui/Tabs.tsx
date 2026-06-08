"use client";

import {
    LockKeyhole,
} from "lucide-react";

import {
    notify,
} from "@/lib/notify";

import {
    COURSE_TABS,
} from "../constants";

import type {
    CourseTab,
} from "../types";

type TabsProps = {
    activeTab: CourseTab;
    onChange: (tab: CourseTab) => void;
    isMdtCourse?: boolean;
    hasForum?: boolean;
    hasSurvey?: boolean;
    canAccessMdtCertificate?: boolean;
};

const MDT_ONLY_TABS: CourseTab[] = [
    "mdtcertificate",
    "mdtrequiredfiles",
];

const CERTIFICATE_TAB: CourseTab =
    "certificate";

const MDT_CERTIFICATE_TAB: CourseTab =
    "mdtcertificate";

const ATTENDANCE_TAB: CourseTab =
    "attendance";

const FORUM_TAB: CourseTab =
    "forum";

const SURVEY_TAB: CourseTab =
    "survey";

export function Tabs({
    activeTab,
    onChange,
    isMdtCourse = false,
    hasForum = false,
    hasSurvey = false,
    canAccessMdtCertificate = false,
}: TabsProps) {
    const visibleTabs =
        COURSE_TABS.filter((tab) => {
            if (
                tab.key === FORUM_TAB
            ) {
                return hasForum;
            }

            if (
                tab.key === SURVEY_TAB
            ) {
                return hasSurvey;
            }

            if (
                tab.key ===
                ATTENDANCE_TAB
            ) {
                return isMdtCourse;
            }

            if (
                MDT_ONLY_TABS.includes(
                    tab.key,
                )
            ) {
                return isMdtCourse;
            }

            if (
                tab.key ===
                CERTIFICATE_TAB
            ) {
                return !isMdtCourse;
            }

            return true;
        });

    function handleTabClick(
        tab: CourseTab,
        isLocked: boolean,
    ) {
        if (isLocked) {
            notify.warning(
                "Debes completar el 100% del curso para acceder al certificado MDT.",
            );

            return;
        }

        onChange(tab);
    }

    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="overflow-x-auto overscroll-x-contain px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-2">
                <div className="flex min-w-max gap-1 py-1.5 sm:gap-1.5 sm:py-2">
                    {visibleTabs.map(
                        (tab) => {
                            const active =
                                activeTab ===
                                tab.key;

                            const isLocked =
                                tab.key ===
                                MDT_CERTIFICATE_TAB &&
                                !canAccessMdtCertificate;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    aria-current={
                                        active
                                            ? "page"
                                            : undefined
                                    }
                                    aria-disabled={
                                        isLocked
                                    }
                                    onClick={() =>
                                        handleTabClick(
                                            tab.key,
                                            isLocked,
                                        )
                                    }
                                    title={
                                        isLocked
                                            ? "Completa el 100% del curso para habilitar el certificado MDT."
                                            : undefined
                                    }
                                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-black transition sm:px-4 sm:py-2.5 sm:text-xs lg:text-sm ${isLocked
                                            ? "cursor-not-allowed bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            : active
                                                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm active:scale-[0.98]"
                                                : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] active:scale-[0.98]"
                                        }`}
                                >
                                    {isLocked ? (
                                        <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                                    ) : null}

                                    {tab.label}
                                </button>
                            );
                        },
                    )}
                </div>
            </div>
        </div>
    );
}

export default Tabs;    