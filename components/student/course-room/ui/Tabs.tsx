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
        <div className="border-b border-[var(--border)]">
            <div className="flex gap-7 overflow-x-auto text-sm font-black">
                {visibleTabs.map((tab) => {
                    const active = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onChange(tab.key)}
                            className={`whitespace-nowrap border-b-2 px-1 py-4 transition ${active
                                    ? "border-[var(--primary)] text-[var(--primary)]"
                                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default Tabs;