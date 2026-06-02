"use client";

import { COURSE_TABS } from "../constants";
import type { CourseTab } from "../types";

type TabsProps = {
    activeTab: CourseTab;
    onChange: (tab: CourseTab) => void;
    isMdtCourse?: boolean;
    hasForum?: boolean;
    hasSurvey?: boolean;
};

const MDT_ONLY_TABS: CourseTab[] = [
    "mdtcertificate",
    "mdtrequiredfiles",
];

const CERTIFICATE_TAB: CourseTab = "certificate";
const FORUM_TAB: CourseTab = "forum";
const SURVEY_TAB: CourseTab = "survey";

export function Tabs({
    activeTab,
    onChange,
    isMdtCourse = false,
    hasForum = false,
    hasSurvey = false,
}: TabsProps) {
    const visibleTabs = COURSE_TABS.filter((tab) => {
        if (tab.key === FORUM_TAB) {
            return hasForum;
        }

        if (tab.key === SURVEY_TAB) {
            return hasSurvey;
        }

        if (MDT_ONLY_TABS.includes(tab.key)) {
            return isMdtCourse;
        }

        if (tab.key === CERTIFICATE_TAB) {
            return !isMdtCourse;
        }

        return true;
    });

    return (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="overflow-x-auto overscroll-x-contain px-2 sm:px-3">
                <div className="flex min-w-max gap-1.5 py-2 sm:gap-2">
                    {visibleTabs.map((tab) => {
                        const active = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => onChange(tab.key)}
                                aria-current={active ? "page" : undefined}
                                className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm ${active
                                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                    : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Tabs;
