export type ZoomLtiAudience =
    | "teacher"
    | "student";

export type ZoomLtiLauncherProps = {
    courseId: number;
    audience: ZoomLtiAudience;
    className?: string;
};

export type ZoomLtiCoursePanelProps = {
    courseId: number;
    audience: ZoomLtiAudience;
};