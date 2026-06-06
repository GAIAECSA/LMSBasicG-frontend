"use client";

import {
    useEnrollmentsAdminBulkPanel,
} from "./hook";

import {
    BulkHero,
} from "./ui/BulkHero";

import {
    BulkResultPanel,
} from "./ui/BulkResultPanel";

import {
    BulkStudentsPanel,
} from "./ui/BulkStudentsPanel";

import {
    BulkSubmitBar,
} from "./ui/BulkSubmitBar";

import {
    CourseSelectionPanel,
} from "./ui/CourseSelectionPanel";

import {
    NoticeAlert,
} from "./ui/NoticeAlert";

export function EnrollmentsAdminBulkPanel() {
    const panel =
        useEnrollmentsAdminBulkPanel();

    return (
        <form
            onSubmit={panel.handleSubmit}
            className="min-w-0 space-y-3 sm:space-y-4 lg:space-y-5 [@media(max-height:760px)]:space-y-3"
        >
            <BulkHero panel={panel} />

            <CourseSelectionPanel
                panel={panel}
            />

            <NoticeAlert
                error={panel.error}
                success={panel.success}
            />

            <BulkStudentsPanel
                panel={panel}
            />

            <BulkResultPanel
                panel={panel}
            />

            <BulkSubmitBar panel={panel} />
        </form>
    );
}

export default EnrollmentsAdminBulkPanel;
